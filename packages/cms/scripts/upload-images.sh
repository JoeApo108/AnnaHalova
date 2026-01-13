#!/bin/bash
# Upload images and assets to R2
# Usage: ./scripts/upload-images.sh

set -e

# Security: Require CLOUDFLARE_ACCOUNT_ID to be set explicitly
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set"
  echo "  Set it with: export CLOUDFLARE_ACCOUNT_ID=your-account-id"
  exit 1
fi

SOURCE_PATH="/Users/admin/AnnaHalova/nextjs-site/public/images"
BUCKET="annahalova-cms"

echo "=== Uploading assets to R2 ==="

# Upload favicons and manifest
echo "Uploading favicons and manifest..."
npx wrangler r2 object put "$BUCKET/site/favicon.svg" \
  --file="public/favicon.svg" --content-type="image/svg+xml" --remote
npx wrangler r2 object put "$BUCKET/site/favicon.ico" \
  --file="public/favicon.ico" --content-type="image/x-icon" --remote
npx wrangler r2 object put "$BUCKET/site/apple-touch-icon.png" \
  --file="public/apple-touch-icon.png" --content-type="image/png" --remote
npx wrangler r2 object put "$BUCKET/site/site.webmanifest" \
  --file="public/site.webmanifest" --content-type="application/manifest+json" --remote

# Upload thumbnails (for gallery view)
echo "Uploading thumbnails..."
for file in "$SOURCE_PATH/thumbs"/*.{jpg,jpeg,png,webp} 2>/dev/null; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  $filename"
  npx wrangler r2 object put "$BUCKET/images/thumbs/$filename" \
    --file="$file" --content-type="image/jpeg" --remote 2>/dev/null
done

# Upload full-size images (for lightbox)
echo "Uploading full-size images..."
for file in "$SOURCE_PATH/full"/*.{jpg,jpeg,png,webp} 2>/dev/null; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  $filename"
  npx wrangler r2 object put "$BUCKET/images/full/$filename" \
    --file="$file" --content-type="image/jpeg" --remote 2>/dev/null
done

echo "=== Done ==="
