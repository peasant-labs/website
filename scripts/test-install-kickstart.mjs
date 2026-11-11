import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { parse } from 'yaml';

const fixture = parse(readFileSync(new URL('../testdata/install/kickstart.yaml', import.meta.url), 'utf8'));
assert.equal(fixture.version, 1);
const names = fixture.cases.map(row => row.name);
assert.equal(new Set(names).size, names.length, 'fixture names must be unique');
for (const name of fixture.requiredNames) assert(names.includes(name), `required installer fixture missing: ${name}`);
const installer = resolve('scripts/install.sh');
const terminalHelper = resolve('scripts/install-pty-test.py');

// A PATH that holds every command this host offers except the named ones, so a
// case can stand in for a machine that lacks them (Git Bash without unzip).
function pathWithout(dir, missing) {
  mkdirSync(dir);
  for (const entry of process.env.PATH.split(delimiter)) {
    let names;
    try { names = readdirSync(entry); } catch { continue; }
    for (const name of names) {
      if (missing.includes(name) || existsSync(join(dir, name))) continue;
      try { symlinkSync(join(entry, name), join(dir, name)); } catch { /* raced a duplicate */ }
    }
  }
  return dir;
}

const script = (path, body) => { writeFileSync(path, body); chmodSync(path, 0o755); };

for (const row of fixture.cases) {
  const work = mkdtempSync(join(tmpdir(), 'peasant-installer-test-'));
  try {
    // A Windows case runs the same script under a stubbed `uname` that reports
    // Git Bash, MSYS2 or Cygwin. The native build is a zip holding peasant.exe,
    // installed under USERPROFILE — kept apart from HOME here, as it is in
    // MSYS2 and Cygwin, so a case proves which of the two the script chose.
    const windows = Boolean(row.uname);
    const exe = windows ? 'peasant.exe' : 'peasant';
    const home = join(work, 'home'), profile = join(work, 'profile'), tools = join(work, 'tools'), pack = join(work, 'pack');
    for (const path of [home, profile, tools, pack]) mkdirSync(path);
    const trace = join(work, 'setup.trace');
    const binary = '#!/bin/bash\ntty0=n; tty1=n; tty2=n\ntest -t 0 && tty0=y\ntest -t 1 && tty1=y\ntest -t 2 && tty2=y\nprintf "args:%s tty:%s%s%s\\n" "$*" "$tty0" "$tty1" "$tty2" >> "$PEASANT_TEST_TRACE"\nexit "${PEASANT_TEST_SETUP_EXIT:-0}"\n';
    const packed = row.missingBinary ? 'different-file' : exe;
    script(join(pack, packed), binary);
    const target = windows
      ? 'windows_amd64.zip'
      : `${process.platform === 'darwin' ? 'darwin' : 'linux'}_${process.arch === 'arm64' ? 'arm64' : 'amd64'}.tar.gz`;
    const asset = `peasant_0.0.0_${target}`;
    const archive = join(work, asset);
    if (windows) {
      execFileSync('python3', ['-c', 'import sys, zipfile\nwith zipfile.ZipFile(sys.argv[1], "w") as z: z.write(sys.argv[2], sys.argv[3])', archive, join(pack, packed), packed]);
    } else {
      execFileSync('tar', ['-czf', archive, '-C', pack, packed]);
    }
    const checksum = createHash('sha256').update(readFileSync(archive)).digest('hex');
    const sums = join(work, 'checksums.txt');
    writeFileSync(sums, `${row.badChecksum ? '0'.repeat(64) : checksum}  ${asset}\n`);
    // The stub serves exactly one archive, so it refuses any other name: a
    // Windows case that asked for a tarball would otherwise pass unnoticed.
    script(join(tools, 'curl'), `#!/bin/bash\nset -eu\nurl=""; out=""\nwhile [ "$#" -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; -*) shift;; *) url="$1"; shift;; esac; done\ncase "$url" in */checksums.txt) cp "$PEASANT_TEST_SUMS" "$out";; */${asset}) cp "$PEASANT_TEST_ARCHIVE" "$out";; *) echo "unexpected download: $url" >&2; exit 22;; esac\n`);
    script(join(tools, 'peasant'), '#!/bin/sh\necho wrong-binary >> "$PEASANT_TEST_TRACE"\nexit 99\n');
    script(join(tools, 'peasant.exe'), '#!/bin/sh\necho wrong-binary >> "$PEASANT_TEST_TRACE"\nexit 99\n');
    const env = { ...process.env, HOME: home, PATH: `${tools}${delimiter}${process.env.PATH}`, PEASANT_VERSION: 'v0.0.0', PEASANT_TEST_ARCHIVE: archive, PEASANT_TEST_SUMS: sums, PEASANT_TEST_TRACE: trace, PEASANT_TEST_SETUP_EXIT: String(row.setupExit ?? 0), PEASANT_TEST_REPLY: row.reply ?? 'n' };
    delete env.PEASANT_YES;
    delete env.USERPROFILE;
    delete env.SYSTEMROOT;
    if (row.yes) env.PEASANT_YES = '1';
    if (windows) {
      script(join(tools, 'uname'), `#!/bin/sh\ncase "$1" in -s) echo '${row.uname}';; -m) echo '${row.machine ?? 'x86_64'}';; *) echo '${row.uname}';; esac\n`);
      // The paths in these cases are already POSIX, so the script's own
      // path handling is the identity here; no converter is on the PATH.
      if (row.profile !== false) env.USERPROFILE = row.profile === 'unreachable' ? join(work, 'no-such-profile') : profile;
      const extractor = row.extractor ?? 'unzip';
      if (extractor !== 'unzip') env.PATH = `${tools}${delimiter}${pathWithout(join(work, 'path'), ['unzip'])}`;
      if (extractor === 'windows-tar') {
        // Windows' own tar.exe is bsdtar, which reads zip archives.
        const system32 = join(work, 'windows', 'System32');
        mkdirSync(system32, { recursive: true });
        // The script runs it inside the work directory with the archive's bare name.
        script(join(system32, 'tar.exe'), '#!/bin/sh\n[ "$1" = -xf ] && [ "$#" = 2 ] && [ "${2#/}" = "$2" ] || exit 64\nexec python3 -m zipfile -e "$2" .\n');
      }
      env.SYSTEMROOT = join(work, 'windows');
    }
    let result;
    if (row.tty) {
      // This is the mounted public invocation: Bash reads source from a pipe,
      // while approval and Kickstart must use the controlling terminal.
      const command = ['/bin/bash', '-c', 'cat "$1" | bash -s -- "${@:2}"', 'fixture', installer, ...row.args];
      const run = execFileSync('python3', [terminalHelper, JSON.stringify(command)], { env, encoding: 'utf8', timeout: 12000 });
      result = JSON.parse(run);
    } else {
      const run = spawnSync('/bin/bash', [installer, ...row.args], { env, encoding: 'utf8', timeout: 10000 });
      assert.ifError(run.error);
      result = { exit: run.status, output: run.stdout + run.stderr };
    }
    assert.equal(result.exit, row.exit, `${row.name}: ${result.output}`);
    const installed = join(windows ? profile : home, '.local/bin', exe);
    assert.equal(existsSync(installed), row.installed, `${row.name}: ${result.output}`);
    if (windows) assert(!existsSync(join(home, '.local/bin')), `${row.name}: installed under HOME instead of USERPROFILE`);
    assert.equal(existsSync(trace), row.setup, row.name);
    if (row.setup) assert.equal(readFileSync(trace, 'utf8'), 'args:kickstart tty:yyy\n', row.name);
    for (const text of row.output ?? []) assert(result.output.includes(text), `${row.name}: output lacks ${JSON.stringify(text)}:\n${result.output}`);
    console.log(`PASS ${row.name}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
