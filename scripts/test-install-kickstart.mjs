import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const fixture = parse(readFileSync(new URL('../testdata/install/kickstart.yaml', import.meta.url), 'utf8'));
assert.equal(fixture.version, 1);
const names = fixture.cases.map(row => row.name);
assert.equal(new Set(names).size, names.length, 'fixture names must be unique');
for (const name of fixture.requiredNames) assert(names.includes(name), `required installer fixture missing: ${name}`);
const installer = resolve('scripts/install.sh');
const terminalHelper = resolve('scripts/install-pty-test.py');
for (const row of fixture.cases) {
  const work = mkdtempSync(join(tmpdir(), 'peasant-installer-test-'));
  try {
    const home = join(work, 'home'), tools = join(work, 'tools'), pack = join(work, 'pack');
    for (const path of [home, tools, pack]) mkdirSync(path);
    const trace = join(work, 'setup.trace');
    const binary = '#!/bin/bash\ntty0=n; tty1=n; tty2=n\ntest -t 0 && tty0=y\ntest -t 1 && tty1=y\ntest -t 2 && tty2=y\nprintf "args:%s tty:%s%s%s\\n" "$*" "$tty0" "$tty1" "$tty2" >> "$PEASANT_TEST_TRACE"\nexit "${PEASANT_TEST_SETUP_EXIT:-0}"\n';
    writeFileSync(join(pack, row.missingBinary ? 'different-file' : 'peasant'), binary);
    chmodSync(join(pack, row.missingBinary ? 'different-file' : 'peasant'), 0o755);
    const asset = `peasant_0.0.0_${process.platform === 'darwin' ? 'darwin' : 'linux'}_${process.arch === 'arm64' ? 'arm64' : 'amd64'}.tar.gz`;
    const archive = join(work, asset);
    execFileSync('tar', ['-czf', archive, '-C', pack, row.missingBinary ? 'different-file' : 'peasant']);
    const checksum = createHash('sha256').update(readFileSync(archive)).digest('hex');
    const sums = join(work, 'checksums.txt');
    writeFileSync(sums, `${row.badChecksum ? '0'.repeat(64) : checksum}  ${asset}\n`);
    writeFileSync(join(tools, 'curl'), '#!/bin/bash\nset -eu\nurl=""; out=""\nwhile [ "$#" -gt 0 ]; do case "$1" in -o) out="$2"; shift 2;; -*) shift;; *) url="$1"; shift;; esac; done\ncase "$url" in */checksums.txt) cp "$PEASANT_TEST_SUMS" "$out";; *) cp "$PEASANT_TEST_ARCHIVE" "$out";; esac\n');
    chmodSync(join(tools, 'curl'), 0o755);
    writeFileSync(join(tools, 'peasant'), '#!/bin/sh\necho wrong-binary >> "$PEASANT_TEST_TRACE"\nexit 99\n');
    chmodSync(join(tools, 'peasant'), 0o755);
    const env = { ...process.env, HOME: home, PATH: `${tools}:${process.env.PATH}`, PEASANT_VERSION: 'v0.0.0', PEASANT_TEST_ARCHIVE: archive, PEASANT_TEST_SUMS: sums, PEASANT_TEST_TRACE: trace, PEASANT_TEST_SETUP_EXIT: String(row.setupExit ?? 0), PEASANT_TEST_REPLY: row.reply ?? 'n' };
    delete env.PEASANT_YES;
    if (row.yes) env.PEASANT_YES = '1';
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
    assert.equal(existsSync(join(home, '.local/bin/peasant')), row.installed, row.name);
    assert.equal(existsSync(trace), row.setup, row.name);
    if (row.setup) assert.equal(readFileSync(trace, 'utf8'), 'args:kickstart tty:yyy\n', row.name);
    console.log(`PASS ${row.name}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
