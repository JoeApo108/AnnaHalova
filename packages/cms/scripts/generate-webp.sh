#!/bin/bash
# Generate WebP versions of all JPEG images
# Requires: cwebp (brew install webp)
# Run from: nextjs-cms/packages/cms/
set -euo pipefail

FULL_DIR="public/images/full"
THUMB_DIR="public/images/thumbs"

echo "Converting full-size images to WebP..."
for jpg in "$FULL_DIR"/*.jpg; do
  webp="${jpg%.jpg}.webp"
  [ -f "$webp" ] && continue
  cwebp -q 82 "$jpg" -o "$webp"
done

echo "Converting thumbnails to WebP..."
for jpg in "$THUMB_DIR"/*.jpg; do
  webp="${jpg%.jpg}.webp"
  [ -f "$webp" ] && continue
  cwebp -q 80 "$jpg" -o "$webp"
done

echo "Done. WebP files generated."
