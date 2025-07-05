#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <version-tag> [release-title]"
  exit 1
fi

TAG="$1"
TITLE="${2:-Movr $TAG}"
BODY="Release $TAG of movr CLI binaries."

BIN_DIR="cli/cli_binaries"

# Create the release (if it doesn't exist)
gh release create "$TAG" \
  --title "$TITLE" \
  --notes "$BODY" \
  --latest \
  --repo agnij-dutta/Movr \
  --draft

# Upload binaries
for f in "$BIN_DIR"/movr-*; do
  gh release upload "$TAG" "$f" --repo agnij-dutta/Movr
done

echo "Release $TAG created and binaries uploaded." 