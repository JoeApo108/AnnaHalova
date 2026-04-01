#!/bin/bash
# Move JPEG files in R2 to migrated folder

set -e

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID environment variable is not set"
  exit 1
fi

SOURCE_PATH="public/images"
BUCKET="annahalova-cms"

echo "=== Moving JPEGs to migrated folder on R2 ==="

shopt -s nullglob

# Move full-size JPEGs
echo "Moving full-size JPEGs..."
for file in "$SOURCE_PATH/full"/*.{jpg,jpeg}; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  Migrating full/$filename"
  
  # Upload to migrated folder
  npx wrangler r2 object put "$BUCKET/images/migrated/full/$filename" \
    --file="$file" --content-type="image/jpeg" --remote 2>/dev/null
    
  # Delete original from images/full
  npx wrangler r2 object delete "$BUCKET/images/full/$filename" 2>/dev/null || true
done

# Move thumbnail JPEGs
echo "Moving thumbnail JPEGs..."
for file in "$SOURCE_PATH/thumbs"/*.{jpg,jpeg}; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  Migrating thumbs/$filename"
  
  # Upload to migrated folder
  npx wrangler r2 object put "$BUCKET/images/migrated/thumbs/$filename" \
    --file="$file" --content-type="image/jpeg" --remote 2>/dev/null
    
  # Delete original from images/thumbs
  npx wrangler r2 object delete "$BUCKET/images/thumbs/$filename" 2>/dev/null || true
done

echo "=== Done moving JPEGs in R2 ==="
