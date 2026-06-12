#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/images/illustrations"
HALF="$SRC/half"
FULL="$SRC/full"

mkdir -p "$HALF" "$FULL"

HALF_FILES=(
  img_6347.jpg
)

FULL_FILES=(
  img_6347.jpg
)

optimize() {
  local src="$1"
  local dest="$2"
  local max_px="$3"
  local tmp
  tmp="$(mktemp "${TMPDIR:-/tmp}/illustration.XXXXXX.jpg")"
  cp "$src" "$tmp"
  sips -Z "$max_px" "$tmp" --out "$tmp" >/dev/null
  sips -m "/System/Library/ColorSync/Profiles/sRGB Profile.icc" "$tmp" --out "$dest" >/dev/null
  sips -s format jpeg -s formatOptions 80 "$dest" --out "$dest" >/dev/null
  rm -f "$tmp"
}

for file in "${HALF_FILES[@]}"; do
  optimize "$SRC/$file" "$HALF/$file" 640
done

for file in "${FULL_FILES[@]}"; do
  optimize "$SRC/$file" "$FULL/$file" 1280
done

echo "Half: $(du -sh "$HALF" | cut -f1) ($(ls "$HALF" | wc -l | tr -d ' ') files)"
echo "Full: $(du -sh "$FULL" | cut -f1) ($(ls "$FULL" | wc -l | tr -d ' ') files)"
