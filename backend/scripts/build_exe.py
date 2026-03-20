from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
DIST_EXE = BACKEND_DIR / "dist" / "main.exe"
VENV_PYTHON = BACKEND_DIR / "venv" / "Scripts" / "python.exe"


def get_running_pids(exe_path: Path) -> list[int]:
  escaped_path = str(exe_path).replace("'", "''")
  command = (
    "Get-CimInstance Win32_Process | "
    f"Where-Object {{ $_.ExecutablePath -eq '{escaped_path}' }} | "
    "Select-Object -ExpandProperty ProcessId"
  )
  result = subprocess.run(
    ["powershell", "-NoProfile", "-Command", command],
    capture_output=True,
    text=True,
    cwd=BACKEND_DIR,
    check=True,
  )
  pids: list[int] = []
  for line in result.stdout.splitlines():
    line = line.strip()
    if line.isdigit():
      pids.append(int(line))
  return pids


def stop_running_exe() -> None:
  if not DIST_EXE.exists():
    return

  pids = get_running_pids(DIST_EXE)
  if not pids:
    return

  for pid in pids:
    subprocess.run(["taskkill", "/F", "/PID", str(pid)], cwd=BACKEND_DIR, check=False, capture_output=True, text=True)

  for _ in range(30):
    if not get_running_pids(DIST_EXE):
      return
    time.sleep(0.2)

  raise RuntimeError(f"Could not stop running executable: {DIST_EXE}")


def build_exe() -> int:
  stop_running_exe()
  result = subprocess.run(
    [str(VENV_PYTHON), "-m", "PyInstaller", "main.spec"],
    cwd=BACKEND_DIR,
  )
  return result.returncode


if __name__ == "__main__":
  try:
    raise SystemExit(build_exe())
  except Exception as exc:
    print(str(exc), file=sys.stderr)
    raise SystemExit(1)
