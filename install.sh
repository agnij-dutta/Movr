#!/bin/sh
set -e

GITHUB_REPO="agnij-dutta/Movr"
VERSION="${1:-latest}"

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
  if [ "$VERSION" = "latest" ]; then
    VERSION=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
  fi
  case "$PLATFORM" in
    linux)  FILENAME="movr-linux";;
    macos)  FILENAME="movr-macos";;
    win)    FILENAME="movr-win.exe";;
  esac
  echo "https://github.com/$GITHUB_REPO/releases/download/$VERSION/$FILENAME"
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