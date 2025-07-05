#!/bin/bash

echo "Installing movr CLI API Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18.0.0 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
REQUIRED_VERSION="18.0.0"

if [[ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]]; then
    echo "Error: Node.js version $NODE_VERSION is too old. Please install Node.js $REQUIRED_VERSION or higher."
    exit 1
fi

echo "Node.js version $NODE_VERSION is supported."

# Check if CLI binary exists
if [ ! -f "../cli/cli_binaries/movr-linux" ]; then
    echo "Warning: CLI binary not found at ../cli/cli_binaries/movr-linux"
    echo "Make sure the movr CLI binary is available before starting the API."
fi

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Make sure the movr CLI binary is available at ../cli/cli_binaries/movr-linux"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. The API will be available at http://localhost:3001"
    echo ""
    echo "For more information, see the README.md file."
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi 