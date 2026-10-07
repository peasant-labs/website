#Requires -Version 5.1
<#
peasant installer for Windows - served at https://peasantlabs.org/install.ps1

    irm https://peasantlabs.org/install.ps1 | iex

Says what it is about to do and waits for a yes before doing any of it. Then
downloads the release build for this machine, verifies it against the release's
own checksums.txt, and installs it to %USERPROFILE%\.local\bin. It never
elevates and never edits your PATH; where PATH needs an entry, it prints the
command for you to run.

    $env:PEASANT_YES = '1'          install without the prompt (for CI and scripts)
    $env:PEASANT_VERSION = 'vX.Y.Z' install a specific release instead of the newest

This is the Windows counterpart of scripts/install.sh; the two are meant to read
the same way and make the same promises. Differences are forced by the platform:
the Windows release ships a .zip rather than a .tar.gz, the binary is
peasant.exe, and PATH is a user environment variable rather than a shell profile
line.

Every statement is inside a function, with Install-Peasant called on the very
last line. `irm | iex` buffers the whole response before executing it, so a
dropped transfer fails in `irm` and runs nothing at all - unlike curl-into-bash,
which would execute whatever bytes arrived. The shape is kept anyway: it is what
makes the file safe to read top-to-bottom, and safe to save and dot-source.
#>

Set-StrictMode -Version Latest

function Write-PeasantLine {
    param([string] $Text = '')
    Write-Host $Text
}

function Write-PeasantError {
    param([Parameter(Mandatory = $true)][string] $Text)
    # Written to the error stream so a caller redirecting output still sees why
    # an install stopped.
    [Console]::Error.WriteLine($Text)
}

# The newest release tag.
#
# /releases/latest redirects to /releases/tag/<tag>, which costs one HEAD and is
# not rate limited - but GitHub excludes pre-releases from it, so while peasant
# is on release candidates that redirect lands on the releases index instead.
# The API lists pre-releases, newest first, so it is the fallback. It allows 60
# unauthenticated requests per hour per IP, which is why it is not the default.
function Get-PeasantLatestTag {
    param([Parameter(Mandatory = $true)][string] $Repo)

    try {
        $response = Invoke-WebRequest -Uri "https://github.com/$Repo/releases/latest" `
            -Method Head -UseBasicParsing -ErrorAction Stop
        # Windows PowerShell 5.1 exposes the resolved address as ResponseUri on
        # .NET Framework's HttpWebResponse; PowerShell 7 exposes it as
        # RequestMessage.RequestUri on HttpResponseMessage. Probe for the
        # property rather than assuming, because Set-StrictMode makes reading an
        # absent one an error.
        $base = $response.BaseResponse
        $resolved = $null
        $names = @($base.PSObject.Properties.Name)
        if ($names -contains 'ResponseUri') {
            $resolved = [string] $base.ResponseUri
        } elseif ($names -contains 'RequestMessage') {
            $resolved = [string] $base.RequestMessage.RequestUri
        }
        if ($resolved -match '/releases/tag/(.+)$') {
            return $Matches[1]
        }
    } catch {
        # Fall through to the API.
    }

    try {
        $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases" `
            -UseBasicParsing -ErrorAction Stop
        foreach ($release in @($releases)) {
            if ($release.tag_name) { return [string] $release.tag_name }
        }
    } catch {
        # Reported by the caller, which knows how to explain a missing tag.
    }

    return $null
}

# Everything that is about to happen, before any of it does. Reading a plan is
# the only way to consent to one, and an installer that has already started is
# not asking.
function Show-PeasantPlan {
    param(
        [Parameter(Mandatory = $true)][string] $Tag,
        [Parameter(Mandatory = $true)][string] $Asset,
        [Parameter(Mandatory = $true)][string] $Verb,
        [Parameter(Mandatory = $true)][string] $Url,
        [Parameter(Mandatory = $true)][string] $SumsUrl,
        [Parameter(Mandatory = $true)][string] $BinDir,
        [Parameter(Mandatory = $true)][string] $Bin,
        [Parameter(Mandatory = $true)][string] $WorkRoot
    )

    Write-PeasantLine ''
    Write-PeasantLine "  peasant $Tag"
    Write-PeasantLine ''
    Write-PeasantLine "  profile found  $env:USERPROFILE"
    Write-PeasantLine '  machine        windows/amd64'
    Write-PeasantLine "  checksum       $SumsUrl"
    Write-PeasantLine "  source         $Url"
    Write-PeasantLine "  download to    $WorkRoot  (temporary, removed when finished)"
    Write-PeasantLine "  install to     $(Join-Path $BinDir $Bin)"
    Write-PeasantLine ''
    Write-PeasantLine '  here are the steps we will take to install on your machine:'
    Write-PeasantLine "    1. download  $Asset"
    Write-PeasantLine '    2. verify    against checksums.txt published with the release'
    Write-PeasantLine "    3. $Verb   $(Join-Path $BinDir $Bin)"
    Write-PeasantLine ''
}

# A yes, from the person at the keyboard.
#
# When there is no interactive session - CI, a scheduled task, a remoting job -
# there is nobody to ask, so it stops rather than assuming consent it never got.
function Confirm-PeasantPlan {
    if ($env:PEASANT_YES -eq '1') {
        Write-PeasantLine '  continuing without asking (PEASANT_YES=1)'
        Write-PeasantLine ''
        # Every exit from this function returns an explicit boolean. A bare
        # `return` yields $null, which the caller reads as a refusal, so the one
        # flag whose whole purpose is to authorise the install would cancel it.
        return $true
    }

    if (-not [Environment]::UserInteractive) {
        Write-PeasantError '  no interactive session to ask for confirmation, so nothing was changed.'
        Write-PeasantError '  re-run with $env:PEASANT_YES = ''1'' to install without the prompt.'
        return $false
    }

    $reply = Read-Host '  continue? [y/N]'
    Write-PeasantLine ''
    if ($reply -notmatch '^(y|Y|yes|YES)$') {
        Write-PeasantLine '  nothing was changed.'
        return $false
    }
    return $true
}

# Refuse to install anything whose hash we have not matched against the one
# published alongside it. HTTPS covers the hop; this covers the artifact.
function Get-PeasantPublishedChecksum {
    param(
        [Parameter(Mandatory = $true)][string] $SumsPath,
        [Parameter(Mandatory = $true)][string] $Asset
    )

    # goreleaser writes "<sha256>  <filename>". The name is compared as a whole
    # field rather than as a pattern, since it is full of characters a regex
    # would read as syntax. A leading "*" is sha256sum's binary-mode marker -
    # not what goreleaser emits, but cheap to tolerate and otherwise a silent
    # no-match.
    foreach ($line in Get-Content -LiteralPath $SumsPath) {
        $fields = @($line -split '\s+' | Where-Object { $_ -ne '' })
        if ($fields.Count -lt 2) { continue }
        $name = $fields[-1] -replace '^\*', ''
        if ($name -eq $Asset) { return $fields[0].ToLowerInvariant() }
    }
    return $null
}

# What happened, in the same shape as what was promised.
function Show-PeasantResult {
    param(
        [Parameter(Mandatory = $true)][string] $Sum,
        [Parameter(Mandatory = $true)][string] $Size,
        [Parameter(Mandatory = $true)][string] $BinDir,
        [Parameter(Mandatory = $true)][string] $Bin
    )

    Write-PeasantLine ''
    Write-PeasantLine '  done.'
    Write-PeasantLine ''
    Write-PeasantLine "  installed  $(Join-Path $BinDir $Bin)  ($Size)"
    Write-PeasantLine "  verified   sha256 $($Sum.Substring(0, 16))..."
    Write-PeasantLine ''

    # The user PATH is read back from the environment rather than from $env:PATH,
    # which is the current process's copy and would report a directory added by
    # an earlier install in this same session as absent.
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $entries = @()
    if ($userPath) {
        $entries = @($userPath -split ';' | Where-Object { $_ -ne '' } | ForEach-Object { $_.TrimEnd('\') })
    }

    if ($entries -contains $BinDir.TrimEnd('\')) {
        Write-PeasantLine '  next:  peasant kickstart'
    } else {
        # Deliberately printed rather than done. install.sh does not edit a shell
        # profile, and this does not edit your environment: the Windows user PATH
        # is one value that every program reads, and an installer that rewrites it
        # unasked can drop an entry it misparsed.
        Write-PeasantLine "  $BinDir is not on your PATH yet."
        Write-PeasantLine '  run this command to add it for future sessions:'
        Write-PeasantLine ''
        # One double-quoted string, so $BinDir interpolates and the single quotes
        # stay literal. Concatenating with + in an argument position would not
        # work: PowerShell parses command arguments in argument mode, where a +
        # is just another argument rather than an operator, so only the first
        # fragment would ever reach the parameter.
        Write-PeasantLine "      [Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';$BinDir', 'User')"
        Write-PeasantLine ''
        Write-PeasantLine '  then run this one to use it in this window:'
        Write-PeasantLine ''
        Write-PeasantLine "      `$env:Path += ';$BinDir'"
        Write-PeasantLine ''
        Write-PeasantLine '  next:  peasant kickstart'
    }
    Write-PeasantLine ''
}

function Install-Peasant {
    $repo = 'peasant-labs/peasant'
    $bin = 'peasant.exe'
    $binDir = Join-Path $env:USERPROFILE '.local\bin'

    $ErrorActionPreference = 'Stop'
    # Invoke-WebRequest renders a progress bar that dominates the runtime of a
    # large download on Windows PowerShell 5.1.
    $ProgressPreference = 'SilentlyContinue'
    # 5.1 on older Windows builds still negotiates TLS 1.0 by default, which
    # github.com refuses.
    try {
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    } catch {
        # PowerShell 7 manages this itself and the type may be unavailable.
    }

    if (-not $env:USERPROFILE) {
        Write-PeasantError 'peasant: USERPROFILE is not set, so there is no home directory to install into'
        return
    }

    # Windows amd64 is the only published native build; arm64 is deliberately not
    # released. An arm64 device runs the amd64 binary under emulation, so the
    # architecture is stated rather than detected.
    if ($env:PEASANT_VERSION) {
        $tag = $env:PEASANT_VERSION
    } else {
        $tag = Get-PeasantLatestTag -Repo $repo
    }
    if (-not $tag) {
        Write-PeasantError "peasant: could not determine the latest release of $repo"
        Write-PeasantError 'pin one with $env:PEASANT_VERSION = ''v0.1.0'''
        return
    }

    # Release tags carry a leading v; the asset filenames do not.
    $version = $tag -replace '^v', ''
    $asset = "peasant_${version}_windows_amd64.zip"
    $url = "https://github.com/$repo/releases/download/$tag/$asset"
    $sumsUrl = "https://github.com/$repo/releases/download/$tag/checksums.txt"
    $target = Join-Path $binDir $bin

    # Say "replace" when there is something there to replace, so an upgrade never
    # looks like a first install.
    $verb = if (Test-Path -LiteralPath $target) { 'replace' } else { 'install' }

    $workRoot = [IO.Path]::GetTempPath()
    Show-PeasantPlan -Tag $tag -Asset $asset -Verb $verb -Url $url -SumsUrl $sumsUrl `
        -BinDir $binDir -Bin $bin -WorkRoot $workRoot

    # Windows will not let a running executable be replaced, so a peasant that is
    # still serving the dashboard has to be stopped first. Saying so now beats an
    # "Access is denied" after the download.
    $running = @(Get-Process -Name 'peasant' -ErrorAction SilentlyContinue)
    if ($running.Count -gt 0) {
        Write-PeasantLine "  note: peasant is running (pid $($running[0].Id))."
        Write-PeasantLine '        Windows cannot replace a running program, so run `peasant web stop`'
        Write-PeasantLine '        (or close it) before continuing.'
        Write-PeasantLine ''
    }

    if (-not (Confirm-PeasantPlan)) { return }

    $work = Join-Path $workRoot ("peasant-install-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
    New-Item -ItemType Directory -Force -Path $work | Out-Null
    try {
        Write-PeasantLine '  downloading...'
        try {
            Invoke-WebRequest -Uri $url -OutFile (Join-Path $work $asset) -UseBasicParsing -ErrorAction Stop
        } catch {
            Write-PeasantError "peasant: could not download $asset"
            Write-PeasantError "  $url"
            Write-PeasantError 'if the release is not public yet, this is expected - try again shortly'
            return
        }

        Write-PeasantLine '  verifying...'
        $sumsPath = Join-Path $work 'checksums.txt'
        try {
            Invoke-WebRequest -Uri $sumsUrl -OutFile $sumsPath -UseBasicParsing -ErrorAction Stop
        } catch {
            Write-PeasantError "peasant: could not download checksums.txt for $tag"
            Write-PeasantError 'refusing to install an unverified binary'
            return
        }

        $want = Get-PeasantPublishedChecksum -SumsPath $sumsPath -Asset $asset
        if (-not $want) {
            Write-PeasantError "peasant: checksums.txt for $tag does not list $asset"
            return
        }
        $got = (Get-FileHash -LiteralPath (Join-Path $work $asset) -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($want -ne $got) {
            Write-PeasantError "peasant: checksum mismatch for $asset"
            Write-PeasantError "  expected $want"
            Write-PeasantError "  got      $got"
            return
        }

        Expand-Archive -LiteralPath (Join-Path $work $asset) -DestinationPath (Join-Path $work 'unpacked') -Force
        $unpacked = Join-Path $work (Join-Path 'unpacked' $bin)
        if (-not (Test-Path -LiteralPath $unpacked)) {
            Write-PeasantError "peasant: the archive did not contain a $bin"
            return
        }

        New-Item -ItemType Directory -Force -Path $binDir | Out-Null
        try {
            Copy-Item -LiteralPath $unpacked -Destination $target -Force -ErrorAction Stop
        } catch {
            Write-PeasantError "peasant: could not write $target"
            Write-PeasantError "  $($_.Exception.Message)"
            Write-PeasantError 'if peasant is running, stop it with `peasant web stop` and run this again'
            return
        }

        $size = '{0:N1} MB' -f ((Get-Item -LiteralPath $target).Length / 1MB)
        Show-PeasantResult -Sum $got -Size $size -BinDir $binDir -Bin $bin
    } finally {
        Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Install-Peasant
