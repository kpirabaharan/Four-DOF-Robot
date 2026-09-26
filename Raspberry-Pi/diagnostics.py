#!/usr/bin/env python3
"""
Interactive console for Diagnostics.ino.

Flash Robot_Control/Debug/Diagnostics/Diagnostics.ino to the Arduino, stop
server.py, then run this to exercise the steppers and limit switches:

    .venv/bin/python diagnostics.py

Everything you type is passed straight to the sketch, so `help` there is the
real reference. This adds the things that are awkward over a raw serial
monitor: it tells you when server.py is holding the port, streams the board's
output while you type, sends `stop` on Ctrl-C instead of leaving an axis
running, and provides `selftest` to walk the switches one at a time.
"""

import os
import queue
import subprocess
import sys
import threading
import time

import serial

PORT = os.environ.get("SERIAL_PORT", "/dev/arduino")
BAUD = 115200

# The sketch's own commands; listed only so `help` can mention selftest too.
SKETCH_COMMANDS = (
    "switches",
    "watch",
    "unwatch",
    "status",
    "zero",
    "jog",
    "sweep",
    "seek",
    "stop",
)

AXES = ("1", "2", "3", "z")
AXIS_LABEL = {"1": "J1 (base)", "2": "J2 (elbow)", "3": "J3 (wrist)", "z": "JZ (lift)"}


class Link:
    """Serial connection plus a reader thread, so output streams while typing."""

    def __init__(self, port, baud):
        self.serial = serial.Serial(port, baud, timeout=0.2, exclusive=True)
        self.lines = queue.Queue()
        self._stop = threading.Event()
        self._reader = threading.Thread(target=self._read_loop, daemon=True)
        self._reader.start()

    def _read_loop(self):
        buffer = b""
        while not self._stop.is_set():
            try:
                chunk = self.serial.read(256)
            except serial.SerialException:
                break
            if not chunk:
                continue
            buffer += chunk
            while b"\n" in buffer:
                raw, buffer = buffer.split(b"\n", 1)
                self.lines.put(raw.decode("utf-8", "replace").rstrip("\r"))

    def send(self, command):
        self.serial.write(f"{command}\n".encode())
        self.serial.flush()

    def drain(self, seconds, echo=True):
        """Print whatever arrives for a while. Returns the lines seen."""
        seen = []
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            try:
                line = self.lines.get(timeout=0.1)
            except queue.Empty:
                continue
            seen.append(line)
            if echo:
                print(f"  {line}")
        return seen

    def close(self):
        self._stop.set()
        # Join before closing: the reader may be inside read(), and pulling the
        # port out from under a daemon thread crashes the interpreter at exit
        # with "_enter_buffered_busy: could not acquire lock".
        self._reader.join(timeout=1.5)
        try:
            self.serial.close()
        except Exception:
            pass


def find_server_process():
    """
    Find a running server.py, so we can refuse before touching the port.

    Matching on a command line is a heuristic, but it has to run first: the act
    of opening the port is itself destructive here, so we cannot use "can I
    open it?" as the test. The pattern requires python in the command line and
    diagnostics.py is excluded, which keeps ordinary shells from matching.
    """
    try:
        result = subprocess.run(
            ["pgrep", "-af", r"python.*server\.py"], capture_output=True, text=True
        )
    except FileNotFoundError:
        return None
    if result.returncode != 0:
        return None

    mine = str(os.getpid())
    lines = [
        line
        for line in result.stdout.strip().splitlines()
        # Drop this process and anything that merely mentions diagnostics.
        if line.split(" ", 1)[0] != mine and "diagnostics.py" not in line
    ]
    return "\n".join(lines) if lines else None


def connect():
    # Refuse BEFORE touching the port. Opening a tty toggles DTR and resets the
    # Arduino, and Linux will happily let two processes share it -- server.py's
    # telemetry thread then dies with "device reports readiness to read but
    # returned no data (multiple access on port?)". pyserial's exclusive flag
    # does not prevent this, so the check has to come first.
    holder = find_server_process()
    if holder:
        print("server.py is running and holds the serial port:")
        for line in holder.splitlines():
            print(f"  {line}")
        print()
        print("Opening the port now would reset the Arduino and kill its")
        print("telemetry thread. Stop it first:  pkill -f server.py")
        sys.exit(1)

    try:
        link = Link(PORT, BAUD)
    except serial.SerialException as exc:
        print(f"Could not open {PORT}: {exc}")
        print(f"Check what else has the port:  sudo fuser -v {PORT}")
        sys.exit(1)

    # Opening the port resets the board; wait for it to come back up.
    print(f"connected to {PORT}, waiting for the board to reset...")
    time.sleep(2)
    link.drain(1.5)
    return link


def selftest(link):
    """Walk the four switches one at a time and confirm each one changes."""
    print()
    print("Switch self-test. Each switch is checked on its own.")
    print("Press and release the switch when prompted. Ctrl-C to skip out.")
    print()

    link.send("watch")
    link.drain(0.4, echo=False)

    results = {}
    for axis in AXES:
        label = AXIS_LABEL[axis]
        # Discard anything left over from the previous axis so the result
        # below reflects only this switch.
        link.drain(0.1, echo=False)
        input(f"  press the {label} limit switch, then hit Enter... ")
        seen = link.drain(0.6, echo=False)

        changed = [line for line in seen if line.startswith(f"switch {label[:2]}")]
        if changed:
            results[axis] = "changed"
            print(f"    OK   {label} reported: {changed[-1]}")
        else:
            results[axis] = "no change"
            print(f"    FAIL {label} never changed state")
        print()

    link.send("unwatch")
    link.drain(0.3, echo=False)

    print("summary:")
    for axis in AXES:
        print(f"  {AXIS_LABEL[axis]:<14} {results.get(axis, 'not tested')}")
    print()
    print("A switch that never changes is either disconnected, dead, or on a")
    print("different pin than the firmware expects. A switch that reads HIGH")
    print("while at rest makes homing think the axis is already home.")
    print()


def print_help():
    print()
    print("this console adds:")
    print("  selftest      guided one-switch-at-a-time check")
    print("  quit / exit   leave (sends `stop` first)")
    print()
    print("everything else goes to the board. its own commands:")
    print("  " + ", ".join(SKETCH_COMMANDS))
    print("  e.g.  switches | seek 1 | sweep 1 200 | jog 1 -100 | watch")
    print()


def main():
    link = connect()
    print_help()

    try:
        while True:
            try:
                line = input("> ").strip()
            except EOFError:
                break
            except KeyboardInterrupt:
                # Don't leave an axis running if the user panics.
                print("\n^C -- sending stop")
                link.send("stop")
                link.drain(0.4)
                continue

            if not line:
                link.drain(0.2)
                continue
            if line in ("quit", "exit"):
                break
            if line == "help":
                print_help()
                link.send("help")
                link.drain(0.6)
                continue
            if line == "selftest":
                selftest(link)
                continue

            link.send(line)
            # `seek` and `sweep` report progress for a while; give them longer.
            link.drain(3.0 if line.split()[0] in ("seek", "sweep") else 0.8)
    finally:
        try:
            link.send("stop")
            time.sleep(0.2)
        except Exception:
            pass
        link.close()
        print("disconnected")


if __name__ == "__main__":
    main()
