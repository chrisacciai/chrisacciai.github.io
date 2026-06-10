#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/images/photography"
HALF="$SRC/half"
FULL="$SRC/full"

mkdir -p "$HALF" "$FULL"

# Half-column photos: max 640px wide (~75 KB each)
HALF_FILES=(
  000061160024_websize.jpg 000061160027_websize.jpg 000061170004_websize.jpg
  000061170001_websize.jpg 3134_03.jpg 000061160009_websize.jpg
  000061160029_websize.jpg 000061160036_websize.jpg 3134_02.jpg
  000061160008_websize.jpg 000061170008_websize.jpg 000061170010_websize.jpg
  000061170015_websize.jpg 000061170006_websize.jpg 000061170027_websize.jpg
  000061170035_websize.jpg 000031850031_websize.jpg 000061160017_websize.jpg
  000031850034_websize.jpg 000096500006_websize.jpg 000096500007_websize.jpg
  000096500010_websize.jpg 000096500013_websize.jpg 000096500015_websize.jpg
  000096500017_websize.jpg 000096500022_websize.jpg 000096500031_websize.jpg
  000096510001_websize.jpg 000061160018_websize.jpg 000096510008_websize.jpg
  000096510012_websize.jpg 000096510028_websize.jpg 3134_01.jpg
  000061160026_websize.jpg 3134_25.jpg 3134_05.jpg 3134_06.jpg 3134_07.jpg
  3134_08.jpg 3134_10.jpg 3134_11.jpg 3134_12.jpg 3134_13.jpg 3134_14.jpg
  3134_16.jpg 3134_17.jpg 3134_18.jpg 3134_27.jpg 3134_20.jpg 3134_22.jpg
  000096510005_websize.jpg 3134_24.jpg 000031850032_websize.jpg 3134_04.jpg
  3134_28.jpg 3134_29.jpg 3134_23.jpg 3134_31.jpg 3134_32.jpg 3134_34.jpg
  3134_35.jpg 3134_36.jpg 3134_37.jpg
)

# Full-width photos: max 1280px wide (~320 KB each)
FULL_FILES=(
  000061170018_websize.jpg 3134_26.jpg 000061170019_websize.jpg
  000096500001_websize.jpg 000096500016_websize.jpg 000096510006_websize.jpg
  3134_30.jpg 3134_09.jpg 3134_15.jpg 3134_21.jpg 3134_19.jpg 3134_33.jpg
)

optimize() {
  local src="$1"
  local dest="$2"
  local max_px="$3"
  cp "$src" "$dest"
  sips -Z "$max_px" "$dest" --out "$dest" >/dev/null
  sips -s format jpeg -s formatOptions 75 "$dest" --out "$dest" >/dev/null
}

for file in "${HALF_FILES[@]}"; do
  optimize "$SRC/$file" "$HALF/$file" 640
done

for file in "${FULL_FILES[@]}"; do
  optimize "$SRC/$file" "$FULL/$file" 1280
done

echo "Half: $(du -sh "$HALF" | cut -f1) ($(ls "$HALF" | wc -l | tr -d ' ') files)"
echo "Full: $(du -sh "$FULL" | cut -f1) ($(ls "$FULL" | wc -l | tr -d ' ') files)"
