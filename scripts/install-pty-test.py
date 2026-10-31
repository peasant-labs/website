"""Run a fixture's installer through a real terminal without touching the host."""
import errno
import json
import os
import pty
import select
import signal
import sys
import time

pid, terminal = pty.fork()
if pid == 0:
    command = json.loads(sys.argv[1])
    os.execvpe(command[0], command, os.environ)
output = bytearray()
answered = False
status = None
try:
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        readable, _, _ = select.select([terminal], [], [], 0.1)
        if readable:
            try:
                chunk = os.read(terminal, 4096)
            except OSError as error:
                if error.errno == errno.EIO:
                    break
                raise
            if not chunk:
                break
            output.extend(chunk)
            if len(output) > 65536:
                raise RuntimeError("installer output exceeded fixture budget")
            if not answered and b"[y/N]" in output:
                os.write(terminal, (os.environ.get("PEASANT_TEST_REPLY", "n") + "\n").encode())
                answered = True
        done, candidate = os.waitpid(pid, os.WNOHANG)
        if done:
            status = candidate
            break
    else:
        raise RuntimeError("installer terminal fixture timed out")
finally:
    os.close(terminal)
    if status is None:
        done, candidate = os.waitpid(pid, os.WNOHANG)
        if done:
            status = candidate
        else:
            os.killpg(pid, signal.SIGKILL)
            _, status = os.waitpid(pid, 0)
print(json.dumps({"exit": os.waitstatus_to_exitcode(status), "output": output.decode(errors="replace")}))
