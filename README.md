# APM: Aptos Package Manager & Registry

APM is a decentralized, on-chain package registry for the Move ecosystem on the Aptos blockchain. Inspired by `npm`, `crates.io`, and OpenZeppelin.

> "Discover. Trust. Compose. Build Faster on Aptos."

## ✨ Overview

APM enables Move developers to:

* Register Move packages & templates with metadata & version control
* Add security through validators called **endorsers**
* Enable composability & reuse via packages
* Use CLI tooling and a modern Web UI (coming soon)
* Publish packages as **on-chain transactions**, with revenue sharing

## 🔧 Project Structure

APM consists of two main components:

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
│   └── apm_registry.move    # Core registry contract
└── tests/                  
    └── apm_registry_tests.move  # Comprehensive test suite
```

### Key Features

- **PackageMetadata**: Stores package information like name, version, IPFS hash
- **EndorserInfo**: Manages endorser registration, staking, and reputation
- **Events**: Emits events for package publishing, endorsing, and tipping

## 🛠️ CLI Tool

The CLI tool provides an easy way to interact with the APM registry:

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

- `apm init`: Initialize a new Move package
- `apm publish`: Publish a package to the registry
- `apm install`: Install a package from the registry
- `apm search`: Search for packages
- `apm endorse`: Endorse a package as a validator

## 🚀 Getting Started

### Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- Rust toolchain (for CLI development)
- Access to the Aptos network (devnet/testnet/mainnet)

### Using the CLI

See the [CLI README](cli/README.md) for detailed usage instructions.

### Working with the Contracts

The Move contracts are located in the `web3/` directory. You can:

1. Examine the contract code
2. Run tests: `cd web3 && aptos move test`
3. Compile: `cd web3 && aptos move compile`
4. Deploy: Use the APM CLI or Aptos CLI

## 📜 License

Apache-2.0 