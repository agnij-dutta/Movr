# Movr: Aptos Package Manager & Registry

Movr is a decentralized, on-chain package registry for the Move ecosystem on the Aptos blockchain. Inspired by `npm`, `crates.io`, and OpenZeppelin.

> "Discover. Trust. Compose. Build Faster on Aptos."

## ✨ Overview

Movr enables Move developers to:

* Register Move packages & templates with metadata & version control
* Add security through validators called **endorsers**
* Enable composability & reuse via packages
* Use CLI tooling and a modern Web UI (coming soon)
* Publish packages as **on-chain transactions**, with revenue sharing

## 🔧 Project Structure

Movr consists of two main components:

1. **Smart Contracts (`web3/`)**: Move contracts that power the on-chain registry
2. **CLI Tool (`cli/`)**: Rust-based command line interface for interacting with the registry

## 📦 Smart Contracts

The smart contracts provide the core functionality:

- Package registration and metadata storage
- Version management
- Endorser staking and validation
- Package tipping and revenue sharing

### Structure

```
web3/
├── sources/
│   └── Movr_registry.move    # Core registry contract
└── tests/                  
    └── Movr_registry_tests.move  # Comprehensive test suite
```

### Key Features

- **PackageMetadata**: Stores package information like name, version, IPFS hash
- **EndorserInfo**: Manages endorser registration, staking, and reputation
- **Events**: Emits events for package publishing, endorsing, and tipping

## 🛠️ CLI Tool

The CLI tool provides an easy way to interact with the Movr registry:

```
cli/
├── src/
│   ├── commands/     # Command implementations
│   ├── blockchain/   # Aptos integration
│   ├── config/       # Configuration management
│   ├── ipfs/         # IPFS integration
│   └── utils/        # Helper utilities
```

### Key Commands

- `movr init`: Initialize a new Move package
- `movr publish`: Publish a package to the registry
- `movr install`: Install a package from the registry
- `movr search`: Search for packages
- `movr endorse`: Endorse a package as a validator

## 🚀 Getting Started

### Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- Access to the Aptos network (devnet/testnet/mainnet)

### Installation

#### Linux & macOS
```bash
curl -fsSL https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.sh | sh
```

#### Windows

**Option 1: PowerShell (Recommended)**
```powershell
# Download and run the PowerShell installer
irm https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.ps1 | iex
```

**Option 2: Batch Script**
```cmd
# Download install.bat and run it
curl -O https://raw.githubusercontent.com/agnij-dutta/Movr/main/install.bat && install.bat
```

**Option 3: Manual Installation**
1. Download `movr-win.exe` from the [latest release](https://github.com/agnij-dutta/Movr/releases/latest)
2. Rename it to `movr.exe` and place it in a folder like `C:\Program Files\movr\`
3. Add that folder to your system PATH

### Using the CLI

Once installed, you can use the `movr` command:

```bash
# View available commands
movr --help

# Initialize a new Move package
movr init my-package

# Search for packages
movr search utility

# Publish a package (requires package-path)
movr publish --package-path ./my-package

# Install a package
movr install some-package

# Endorse a package (requires endorser registration)
movr endorse package-name
```

### Working with the Contracts

The Move contracts are located in the `web3/` directory. You can:

1. Examine the contract code
2. Run tests: `cd web3 && aptos move test`
3. Compile: `cd web3 && aptos move compile`
4. Deploy: Use the Movr CLI or Aptos CLI

## 📜 License

Apache-2.0 