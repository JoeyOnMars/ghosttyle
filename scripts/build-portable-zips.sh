#!/bin/zsh
set -euo pipefail

ROOT_DIR="${0:A:h:h}"
NODE_VERSION="${GHOSTTYLE_NODE_VERSION:-24.18.0}"
APP_VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$ROOT_DIR/package.json', 'utf8')).version")"
DIST_DIR="$ROOT_DIR/dist"
TEMP_DIR="$(mktemp -d /tmp/ghosttyle-portable.XXXXXX)"
BASE_URL="https://nodejs.org/download/release/v${NODE_VERSION}"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

/usr/bin/curl --fail --location --silent --show-error \
  --output "$TEMP_DIR/SHASUMS256.txt" \
  "$BASE_URL/SHASUMS256.txt"

for arch in arm64 x64; do
  archive="node-v${NODE_VERSION}-darwin-${arch}.tar.gz"
  extracted="node-v${NODE_VERSION}-darwin-${arch}"
  bundle_root="$TEMP_DIR/bundle-${arch}"
  bundle="$bundle_root/Ghosttyle"
  output="$DIST_DIR/Ghosttyle-v${APP_VERSION}-macos-${arch}.zip"

  /usr/bin/curl --fail --location --silent --show-error \
    --output "$TEMP_DIR/$archive" \
    "$BASE_URL/$archive"

  (
    cd "$TEMP_DIR"
    /usr/bin/grep "  $archive\$" SHASUMS256.txt | /usr/bin/shasum -a 256 -c -
  )

  /usr/bin/tar -xzf "$TEMP_DIR/$archive" -C "$TEMP_DIR"
  mkdir -p "$bundle"

  for item in .gitignore Ghosttyle.command LICENSE README.md README_zh.md package.json public scripts server.mjs market.mjs; do
    /usr/bin/ditto "$ROOT_DIR/$item" "$bundle/$item"
  done

  mkdir -p "$bundle/runtime" "$bundle/licenses"
  cp "$TEMP_DIR/$extracted/bin/node" "$bundle/runtime/node"
  cp "$TEMP_DIR/$extracted/LICENSE" "$bundle/licenses/Node.js-LICENSE"
  chmod +x "$bundle/runtime/node" "$bundle/Ghosttyle.command"

  # 自动化门禁：使用当前 node 验证 bundle 内部所有模块的导入闭包与语法完整性
  (
    cd "$bundle"
    node --check server.mjs
    node --check market.mjs
    node --input-type=module -e "import('./server.mjs'); console.log('Bundle integrity verified for ${arch}.')"
  )

  /usr/bin/ditto -c -k --keepParent "$bundle" "$output"
done

(
  cd "$DIST_DIR"
  /usr/bin/shasum -a 256 *.zip > SHA256SUMS.txt
)

echo "Ghosttyle portable ZIP files created in $DIST_DIR"
