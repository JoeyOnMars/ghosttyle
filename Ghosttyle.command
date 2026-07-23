#!/bin/zsh
set -e

ROOT_DIR="${0:A:h}"
cd "$ROOT_DIR"

# Remember the terminal session that launched this command so a clean shutdown
# can close only its own tab/window instead of touching any other Terminal tabs.
terminal_tty="$(/usr/bin/tty 2>/dev/null || true)"

bundled_node="$ROOT_DIR/runtime/node"
if [[ -x "$bundled_node" ]]; then
  node_bin="$bundled_node"
else
  node_bin="$(command -v node 2>/dev/null || true)"
fi

if [[ -z "$node_bin" ]]; then
  echo "Ghosttyle: Node.js was not found."
  echo "Ghosttyle: 此安装包没有内置 Node.js，本机也没有找到 Node.js。"
  exit 127
fi

set +e
"$node_bin" server.mjs --open
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
