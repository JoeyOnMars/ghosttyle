#!/bin/zsh
set -e

ROOT_DIR="${0:A:h}"
cd "$ROOT_DIR"

# Remember the terminal session that launched this command so a clean shutdown
# can close only its own tab/window instead of touching any other Terminal tabs.
terminal_tty="$(/usr/bin/tty 2>/dev/null || true)"

set +e
node server.mjs --open
status=$?
set -e

# Keep the window open when startup/runtime fails so the error remains visible.
# Set GHOSTTYLE_KEEP_TERMINAL=1 before launching to disable automatic closing.
if [[ $status -eq 0 \
  && "${TERM_PROGRAM:-}" == "Apple_Terminal" \
  && "$terminal_tty" == /dev/* \
  && "${GHOSTTYLE_KEEP_TERMINAL:-0}" != "1" ]]; then
  /usr/bin/nohup /usr/bin/osascript \
    "$ROOT_DIR/scripts/close-terminal.applescript" \
    "$terminal_tty" </dev/null >/dev/null 2>&1 &!
fi

exit "$status"
