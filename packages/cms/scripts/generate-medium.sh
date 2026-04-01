#!/bin/bash
# Generate 800px medium resolution WebP images for responsive serving
# Usage: ./scripts/generate-medium.sh

set -e

SOURCE_DIR="public/images/full"
MEDIUM_DIR="public/images/medium"

# Create output directory
mkdir -p "$MEDIUM_DIR"

echo "=== Generating Medium WebPs (800px) ==="
echo "From: $SOURCE_DIR"
echo "To: $MEDIUM_DIR"

# Count total for progress
TOTAL=$(ls -1 "$SOURCE_DIR"/*.webp 2>/dev/null | wc -l || echo 0)
CURRENT=0

shopt -s nullglob
for img in "$SOURCE_DIR"/*.webp; do
  [ -f "$img" ] || continue
  ((CURRENT++))
  
  filename=$(basename -- "$img")
  basename="${filename%.*}"
  outfile="$MEDIUM_DIR/${basename}.webp"
  
  if [ -f "$outfile" ]; then
    continue
  fi
  
  # Log progress every 10 images
  if [ $((CURRENT % 10)) -eq 0 ]; then
    echo "[$CURRENT/$TOTAL] Processing $filename..."
  fi
  
  cwebp -q 80 -resize 800 0 "$img" -o "$outfile" -quiet >/dev/null 2>&1
done

echo "=== Generation Complete ==="
