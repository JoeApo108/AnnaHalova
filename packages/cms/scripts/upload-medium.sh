#!/bin/bash
# Upload medium WebP images to R2
set -e

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set"
  exit 1
fi

BUCKET="annahalova-cms"
SOURCE_DIR="public/images/medium"

echo "=== Uploading Medium WebPs to R2 ==="
shopt -s nullglob
for file in "$SOURCE_DIR"/*.webp; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  Uploading $filename..."
  npx wrangler r2 object put "$BUCKET/images/medium/$filename" \
    --file="$file" --content-type="image/webp" --remote >/dev/null 2>&1
done

echo "=== Upload Complete ==="
