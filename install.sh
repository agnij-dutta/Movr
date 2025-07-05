#!/bin/sh
set -e

# Always use v1.01 release
VERSION="v1.01"

GITHUB_REPO="agnij-dutta/Movr"

# Platform detection

detect_platform() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"
  case "$OS" in
    Linux*)   PLATFORM="linux";;
    Darwin*)  PLATFORM="macos";;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win";;
    *)        echo "Unsupported OS: $OS"; exit 1;;
  esac

  case "$ARCH" in
    x86_64|amd64) ARCH="x64";;
    arm64|aarch64) ARCH="arm64";;
    *) echo "Unsupported arch: $ARCH"; exit 1;;
  esac
}

get_download_url() {
  case "$PLATFORM" in
    linux)  echo "https://github.com/agnij-dutta/Movr/releases/download/v1.01/movr-linux";;
    macos)  echo "https://github.com/agnij-dutta/Movr/releases/download/v1.01/movr-macos";;
    win)    echo "https://github.com/agnij-dutta/Movr/releases/download/v1.01/movr-win.exe";;
    *)      echo "Unsupported platform: $PLATFORM"; exit 1;;
  esac
}

install_binary() {
  TMP=$(mktemp -d)
  URL=$(get_download_url)
  echo "Downloading $URL ..."
  curl -L "$URL" -o "$TMP/movr"
  chmod +x "$TMP/movr"
  if [ "$PLATFORM" = "win" ]; then
    mv "$TMP/movr" "$HOME/movr.exe"
    echo "movr installed at $HOME/movr.exe"
  else
    sudo mv "$TMP/movr" /usr/local/bin/movr
    echo "movr installed at /usr/local/bin/movr"
  fi
  rm -rf "$TMP"
}

detect_platform
install_binary
echo "Run 'movr --help' to get started!" 