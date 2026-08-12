#!/usr/bin/env bash
#
# peasant installer — served at https://peasantlabs.org/install
#
#   curl -fsSL https://peasantlabs.org/install | bash
#
# Says what it is about to do and waits for a yes before doing any of it. Then
# downloads the release build for this machine, verifies it against the
# release's own checksums.txt, and installs it to ~/.local/bin. It never
# escalates and never edits a shell profile; where PATH needs a line added, it
# prints the line for you to add.
#
#   PEASANT_YES=1        install without the prompt (for CI and scripts)
#   PEASANT_VERSION=vX   install a specific release instead of the newest
#
# The whole script is a set of functions with `main` called on the very last
# line. Piped into a shell, a script executes whatever bytes have arrived — so a
# connection that drops midway through would otherwise run half an install. This
# way a truncated transfer defines some functions and does nothing at all.

set -euo pipefail

REPO="peasant-labs/peasant"
BIN="peasant"
BIN_DIR="${HOME}/.local/bin"

# Global rather than a local of `main`: the cleanup trap runs after `main` has
# returned and its locals are gone, so a local here would leave the trap reading
# an unset name — an "unbound variable" error on the way out of a good install,
# and a temp directory left behind every time.
WORK_DIR=""

say() { printf '%s\n' "$*"; }
err() { printf '%s\n' "$*" >&2; }

need() {
  command -v "$1" >/dev/null 2>&1 || {
    err "peasant: $1 is required but was not found on PATH"
    exit 1
  }
}

detect_os() {
  case "$(uname -s)" in
    Linux) printf 'linux' ;;
    Darwin) printf 'darwin' ;;
    *)
      err "peasant: unsupported operating system: $(uname -s)"
      err "peasant publishes linux and macOS builds"
      exit 1
      ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64) printf 'amd64' ;;
    aarch64 | arm64) printf 'arm64' ;;
    *)
      err "peasant: unsupported architecture: $(uname -m)"
      err "peasant publishes amd64 and arm64 builds"
      exit 1
      ;;
  esac
}

# The newest release tag.
#
# /releases/latest redirects to /releases/tag/<tag>, which costs one HEAD and is
# not rate limited — but GitHub excludes pre-releases from it, so while peasant
# is on release candidates that redirect lands on the releases index instead.
# The API lists pre-releases, newest first, so it is the fallback. It allows 60
# unauthenticated requests per hour per IP, which is why it is not the default.
latest_tag() {
  local url
  url="$(curl -fsSLI -o /dev/null -w '%{url_effective}' \
    "https://github.com/${REPO}/releases/latest" 2>/dev/null || true)"

  case "$url" in
    */releases/tag/*)
      printf '%s' "${url##*/tag/}"
      return 0
      ;;
  esac

  curl -fsSL "https://api.github.com/repos/${REPO}/releases" 2>/dev/null |
    grep -m1 '"tag_name"' |
    sed -E 's/.*"tag_name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/'
}

# Everything that is about to happen, before any of it does. Reading a plan is
# the only way to consent to one, and an installer that has already started is
# not asking.
show_plan() {
  local tag="$1" os="$2" arch="$3" asset="$4" verb="$5" url="$6" sums_url="$7"

  say ""
  say "  peasant ${tag}"
  say ""
  say "  home found     ${HOME}"
  say "  machine        ${os}/${arch}"
  say "  checksum       ${sums_url}"
  say "  source         ${url}"
  say "  download to    ${TMPDIR:-/tmp}  (temporary, removed when finished)"
  say "  install to     ${BIN_DIR}/${BIN}"
  say ""
  say "  here are the steps we will take to install on your machine:"
  # The origin is stated in full as `source` above, so the step just names the file.
  say "    1. download  ${asset}"
  say "    2. verify    against checksums.txt published with the release"
  say "    3. ${verb}   ${BIN_DIR}/${BIN}"
  say ""
}

# A yes, from the person at the keyboard.
#
# stdin is the script itself when this is piped into bash, so the answer has to
# come from the terminal directly. When there is no terminal — CI, a nested
# pipe, a cron job — there is nobody to ask, so it stops rather than assuming
# consent it never got. `-t 1` is the signal: piping the script in leaves stdin
# a pipe but stdout still a terminal.
confirm() {
  if [ "${PEASANT_YES:-}" = "1" ]; then
    say "  continuing without asking (PEASANT_YES=1)"
    say ""
    return 0
  fi

  if [ ! -t 1 ] || [ ! -r /dev/tty ]; then
    err "  no terminal to ask for confirmation, so nothing was changed."
    err "  re-run with PEASANT_YES=1 to install without the prompt."
    exit 1
  fi

  local reply=""
  printf '  continue? [y/N] '
  read -r reply < /dev/tty || true
  say ""

  case "$reply" in
    y | Y | yes | YES) return 0 ;;
    *)
      say "  nothing was changed."
      exit 0
      ;;
  esac
}

# Refuse to install anything whose hash we have not matched against the one
# published alongside it. HTTPS covers the hop; this covers the artifact.
verify() {
  # The checksum URL arrives as an argument rather than being rebuilt here: the
  # plan showed the user an address, and this is the code that has to fetch that
  # exact one. Two constructions of the same URL are two things to keep in step.
  local dir="$1" asset="$2" tag="$3" sums_url="$4"
  local sums="${dir}/checksums.txt" want got

  curl -fsSL "$sums_url" -o "$sums" || {
    err "peasant: could not download checksums.txt for ${tag}"
    err "refusing to install an unverified binary"
    exit 1
  }

  # goreleaser writes "<sha256>  <filename>"; compare the name as a whole field
  # rather than as a pattern, since it is full of regex metacharacters. The
  # leading "*" is sha256sum's binary-mode marker — not what goreleaser emits,
  # but cheap to tolerate and otherwise a silent no-match.
  want="$(awk -v want="$asset" \
    '{ name = $2; sub(/^\*/, "", name); if (name == want) print $1 }' "$sums")"
  [ -n "$want" ] || {
    err "peasant: checksums.txt for ${tag} does not list ${asset}"
    exit 1
  }

  if command -v sha256sum >/dev/null 2>&1; then
    got="$(sha256sum "${dir}/${asset}" | awk '{ print $1 }')"
  elif command -v shasum >/dev/null 2>&1; then
    got="$(shasum -a 256 "${dir}/${asset}" | awk '{ print $1 }')"
  else
    err "peasant: no sha256sum or shasum available to verify the download"
    exit 1
  fi

  [ "$want" = "$got" ] || {
    err "peasant: checksum mismatch for ${asset}"
    err "  expected ${want}"
    err "  got      ${got}"
    exit 1
  }

  printf '%s' "$got"
}

# What happened, in the same shape as what was promised.
show_result() {
  local sum="$1" size="$2"
  local profile

  say ""
  say "  done."
  say ""
  say "  installed  ${BIN_DIR}/${BIN}${size:+  (${size})}"
  say "  verified   sha256 ${sum:0:16}…"
  say ""

  case ":${PATH}:" in
    *":${BIN_DIR}:"*)
      say "  next:  ${BIN} kickstart"
      ;;
    *)
      case "${SHELL:-}" in
        */zsh) profile="${HOME}/.zshrc" ;;
        */bash) profile="${HOME}/.bashrc" ;;
        *) profile="" ;;
      esac

      say "  ${BIN_DIR} is not on your PATH yet."
      if [ -n "$profile" ]; then
        say "  run these commands:"
        say ""
        say "      printf '\\nexport PATH=\"\$HOME/.local/bin:\$PATH\"\\n' >> \"${profile}\""
        say "      source \"${profile}\""
      else
        say "  add this line to your shell configuration file:"
        say ""
        say "      export PATH=\"\$HOME/.local/bin:\$PATH\""
        say ""
        say "  then run it in this terminal:"
        say ""
        say "      export PATH=\"\$HOME/.local/bin:\$PATH\""
      fi
      say ""
      say "  next:  ${BIN} kickstart"
      ;;
  esac
  say ""
}

main() {
  need curl
  need tar
  need uname

  local os arch tag version asset url sums_url verb sum size
  os="$(detect_os)"
  arch="$(detect_arch)"

  # `|| true` is load-bearing. Under `set -e`, a command substitution that fails
  # inside an assignment exits the shell then and there — so when GitHub 404s a
  # private repo, rate limits us, or is simply unreachable, the script would die
  # silently on this line and never reach the message below it.
  if [ -n "${PEASANT_VERSION:-}" ]; then
    tag="$PEASANT_VERSION"
  else
    tag="$(latest_tag || true)"
  fi

  [ -n "$tag" ] || {
    err "peasant: could not determine the latest release of ${REPO}"
    err "pin one with PEASANT_VERSION=v0.1.0-rc4"
    exit 1
  }

  # Release tags carry a leading v; the asset filenames do not.
  version="${tag#v}"
  asset="${BIN}_${version}_${os}_${arch}.tar.gz"
  url="https://github.com/${REPO}/releases/download/${tag}/${asset}"
  sums_url="https://github.com/${REPO}/releases/download/${tag}/checksums.txt"

  # Say "replace" when there is something there to replace, so an upgrade never
  # looks like a first install.
  if [ -e "${BIN_DIR}/${BIN}" ]; then verb="replace"; else verb="install"; fi

  show_plan "$tag" "$os" "$arch" "$asset" "$verb" "$url" "$sums_url"
  confirm

  WORK_DIR="$(mktemp -d)"
  trap 'rm -rf "${WORK_DIR:-}"' EXIT

  say "  downloading…"
  curl -fsSL "$url" -o "${WORK_DIR}/${asset}" || {
    err "peasant: could not download ${asset}"
    err "  ${url}"
    err "if the release is not public yet, this is expected — try again shortly"
    exit 1
  }

  say "  verifying…"
  sum="$(verify "$WORK_DIR" "$asset" "$tag" "$sums_url")"

  tar -xzf "${WORK_DIR}/${asset}" -C "$WORK_DIR"
  [ -f "${WORK_DIR}/${BIN}" ] || {
    err "peasant: the archive did not contain a ${BIN} binary"
    exit 1
  }

  mkdir -p "$BIN_DIR"
  install -m 755 "${WORK_DIR}/${BIN}" "${BIN_DIR}/${BIN}" 2>/dev/null ||
    { cp "${WORK_DIR}/${BIN}" "${BIN_DIR}/${BIN}" && chmod 755 "${BIN_DIR}/${BIN}"; }

  size="$(du -h "${BIN_DIR}/${BIN}" 2>/dev/null | awk '{ print $1 }' || true)"
  show_result "$sum" "$size"
}

main "$@"
