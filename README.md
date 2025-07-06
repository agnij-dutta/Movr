# Movr: Aptos Package Manager & Registry

Movr is a decentralized, on-chain package registry for the Move ecosystem on the Aptos blockchain. Built with a modern Web UI and powerful CLI, Movr enables secure package distribution with endorsements and revenue sharing.

> "Discover. Trust. Compose. Build Faster on Aptos."

![License](https://img.shields.io/badge/license-Apache%202.0-blue)

## ✨ Key Features (In-Depth)

Movr is designed to empower Move developers, validators, and users with a robust, secure, and user-friendly package management experience. Here's a deeper look at what makes Movr unique:

- **On-Chain Package Registry**
  - All package metadata, versioning, and endorsements are stored directly on the Aptos blockchain, ensuring transparency, immutability, and censorship resistance. This means anyone can verify the authenticity and history of any package at any time.

- **Security Validation via Endorsers**
  - Packages can be endorsed by trusted validators (endorsers) who stake APT to vouch for the quality and security of a package. Endorsements are visible on-chain, helping users identify reputable packages and reducing the risk of malicious code.
  - Endorsers build reputation over time, and their activity is tracked and rewarded, creating a robust trust network.

- **Revenue Sharing & Tipping**
  - Package authors can receive APT tips directly from users who find their work valuable. This incentivizes high-quality, open-source contributions and enables sustainable development.
  - Tipping is fully on-chain, and all transactions are transparent and auditable.

- **Modern Web UI**
  - Discover, search, and analyze packages with a beautiful, dark-themed dashboard. The UI is built with shadcn UI components for a modern, accessible experience.
  - Features include package search, detailed package pages, endorsement visibility, analytics, and wallet integration.

- **Powerful CLI**
  - The CLI offers a seamless developer experience for publishing, installing, searching, endorsing, and managing packages and wallets. It supports advanced options for automation and scripting, making it ideal for both individual developers and CI/CD pipelines.
  - CLI commands are modular and extensible, with robust error handling and helpful output.

- **IPFS Integration**
  - All package source code and assets are stored on IPFS, ensuring decentralized, tamper-proof distribution. This means packages are always available, even if a centralized server goes down.
  - Movr supports multiple IPFS providers and easy configuration.

- **Wallet Management**
  - Create, import, and manage multiple Aptos wallets directly from the CLI. Set a default wallet, view balances, and use wallets for publishing, endorsing, and tipping.
  - Wallets are securely managed and can be used across both CLI and Web UI.

- **Comprehensive Analytics**
  - Track downloads, endorsements, tips, and other key metrics for every package. Analytics are available both on-chain and in the Web UI, helping authors and users make informed decisions.

- **Semantic Versioning & Dependency Management**
  - Movr supports semantic versioning for all packages, making it easy to manage upgrades and dependencies. Users can install specific versions or get the latest stable release.

- **Event System & Transparency**
  - Every major action (publish, endorse, tip, etc.) emits an on-chain event, providing a complete, auditable history for every package and endorser.

- **Open Ecosystem & Extensibility**
  - Movr is open-source and designed for extensibility. Developers can contribute new features, templates, and integrations, and the platform is built to support future enhancements like governance, advanced dependency resolution, and more.

## 🔧 Project Architecture

Movr consists of three main components:

1. **Smart Contracts (`web3/`)**: Move contracts that power the on-chain registry
2. **CLI Tool (`cli/`)**: TypeScript-based command line interface for developers
3. **Web UI (`client/`)**: Next.js-based dashboard for package discovery and management

## 📦 Smart Contracts

The smart contracts provide the core functionality for the decentralized registry:

```
web3/
├── sources/
│   └── apm_registry.move    # Core registry contract
└── tests/                  
    └── apm_registry_tests.move  # Comprehensive test suite
```

### Key Contract Features

- **Package Registration**: Register Move packages with semantic versioning
- **Endorser System**: Security validation from trusted endorsers
- **Tipping Mechanism**: Direct financial rewards for package authors
- **Metadata Storage**: Rich on-chain metadata for package discovery
- **Versioning**: Support for semantic versioning and dependency resolution
- **Events**: Comprehensive event system for tracking registry activity

## 🛠️ CLI Tool

The CLI tool provides a powerful interface for developers to interact with the Movr registry:

```
cli/
├── src/
│   ├── bin/        # CLI entry point
│   ├── commands/   # Command implementations
│   ├── services/   # Core services (blockchain, IPFS, config)
│   └── utils/      # Helper utilities and error handling
```

### CLI Commands Reference

| Command | Description | Options |
|---------|-------------|---------|
| `movr init` | Initialize a new Move package | `<name>` - Package name |
| `movr publish` | Publish a package to the registry | `--package-path <path>` - Package directory path<br>`--pkg-version <version>` - Package version<br>`--description <text>` - Package description<br>`--homepage <url>` - Homepage URL<br>`--repository <url>` - Repository URL<br>`--license <license>` - License type<br>`--tags <tags>` - Comma-separated tags<br>`--network <network>` - Target network<br>`--wallet <name>` - Wallet to use |
| `movr install` | Install a package from the registry | `<package-name>` - Package to install<br>`--version <version>` - Specific version to install<br>`--dest <path>` - Destination directory |
| `movr search` | Search for packages | `<query>` - Search term<br>`--tags <tags>` - Filter by tags<br>`--sort <field>` - Sort results<br>`--limit <n>` - Limit results |
| `movr endorse` | Endorse a package as a validator | `<package-name>` - Package to endorse<br>`--version <version>` - Version to endorse<br>`--stake <amount>` - Amount to stake<br>`--wallet <name>` - Wallet to use |
| `movr wallet` | Manage wallets | **Subcommands**:<br>`create <name>` - Create a new wallet<br>`list` - List all wallets<br>`show [name]` - Show wallet details<br>`remove <name>` - Remove a wallet<br>`use <name>` - Set default wallet<br>`import <name> --private-key <key>` - Import existing wallet |
| `movr tip` | Send APT tip to a package author | `<package-name>` - Package to tip<br>`--version <version>` - Version to tip<br>`--amount <apt>` - Tip amount<br>`--wallet <name>` - Wallet to use |

### Advanced CLI Examples

```bash
# Initialize a new package with predefined templates
movr init my-project --template defi

# Publish a package with full metadata
movr publish --package-path ./my-package --pkg-version 1.2.3 --description "Awesome utility functions" --tags "utils,math,security" --license MIT

# Search for packages with advanced filtering
movr search defi --tags "lending,amm" --sort downloads --limit 10

# Endorse a package with a specific stake amount
movr endorse awesome-package --version 1.0.0 --stake 50 --wallet my-endorser-wallet

# Import an existing wallet
movr wallet import my-imported-wallet --private-key 0x1234...abcd
```

## 🏗️ CLI Usage & Best Practices

The Movr CLI is designed for flexibility and power. Here are some best practices and advanced usage tips to get the most out of it:

- **Global Options**: Most commands support `--network <network>` (e.g., `devnet`, `testnet`, `mainnet`) and `--wallet <name>`. If `--wallet` is not provided, the default wallet is used.
- **Consistent Workflow**: Use the same wallet and network flags across commands for a seamless experience.
- **Templates**: When initializing a package, you can use templates like `basic`, `token`, or `defi` for quick scaffolding.
- **Registry Initialization**: You can initialize the registry itself with `movr init registry --wallet <wallet>`.
- **Detailed Search**: Use advanced search options like `-t, --package-type`, `-e, --min-endorsements`, `-l, --limit`, and `-d, --details` to filter and sort results.
- **Endorser Registration**: Register as an endorser and stake APT to build reputation and help secure the ecosystem.
- **IPFS Operations**: Upload and download files directly to/from IPFS using the CLI for decentralized storage.

### Common CLI Patterns

```sh
# Initialize a new Move package with a template
movr init my_package -n my_package -a "Alice" -d "A cool Move package" -t basic

# Publish a package with full metadata
movr publish --package-path ./my_package --pkg-version 1.0.0 --description "A cool Move package" --tags move,library --wallet alice

# Install a specific version of a package
movr install my_package -v 1.0.0 -o ./packages/my_package

# Endorse a package as a validator
movr endorse my_package -v 1.0.0 --wallet alice

# Register as an endorser (staking required)
movr endorse register 100000000 --wallet alice

# Tip a package author
movr tip my_package -v 1.0.0 -a 1000000 --wallet alice

# Search for packages with filters
movr search "move" -t library -e 2 -l 10 -d

# Wallet management
movr wallet create alice
movr wallet list
movr wallet show alice
movr wallet remove alice
movr wallet use alice
movr wallet import alice --private-key 0xabc123...

# IPFS operations
movr ipfs upload ./my_package.zip -m '{"name":"my_package"}'
movr ipfs download QmHash ./output.zip
movr ipfs test
```

For a full list of commands and options, see [`cli/CLI_USAGE.md`](cli/CLI_USAGE.md).

## 🖥️ Web Dashboard

The Web UI provides a beautiful and intuitive interface for discovering, managing, and analyzing packages:

```
client/
├── app/            # Next.js application pages
├── components/     # UI components
├── lib/            # Utility functions and API integrations
└── public/         # Static assets
```

### Web Dashboard Features

- **Package Discovery**: Search and browse available packages
- **Package Details**: View detailed package information and documentation
- **Endorsements**: See which validators have endorsed each package
- **Analytics**: Track package downloads, tips, and popularity
- **Wallet Integration**: Connect with Aptos wallets (Petra, Martian, etc.)
- **User Profiles**: View publisher information and package collections
- **Visualization**: Dependency graphs and package relationships

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
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

### Configuration

After installation, you can configure Movr with:

```bash
# Initialize configuration
movr wallet create default-wallet

# Configure IPFS provider (defaults to Pinata)
movr ipfs setup --provider pinata --api-key YOUR_API_KEY --secret-key YOUR_SECRET_KEY

# Set network (defaults to devnet)
movr config set-network testnet
```

## 💡 Common Use Cases

### For Package Authors

1. Create a new package structure:
   ```bash
   movr init my-awesome-package
   cd my-awesome-package
   ```

2. Develop your package according to Move standards

3. Publish your package:
   ```bash
   movr publish --pkg-version 1.0.0 --description "My awesome package" --tags "utils,math"
   ```

4. Monitor usage and receive tips through the web dashboard

### For Package Users

1. Search for packages:
   ```bash
   movr search token --tags "defi,fungible"
   ```

2. Install a package:
   ```bash
   movr install awesome-token-package
   ```

3. Tip the authors of packages you find valuable:
   ```bash
   movr tip awesome-token-package --amount 5
   ```

### For Endorsers

1. Register as an endorser:
   ```bash
   movr endorser register --stake 100
   ```

2. Endorse packages you've reviewed and validated:
   ```bash
   movr endorse secure-vault-package --version 1.0.0
   ```

3. Build reputation as a trusted validator in the ecosystem

## 🛣️ Roadmap

- **Q3 2025**: CLI beta release
- **Q4 2025**: Web UI beta launch
- **Q1 2026**: Endorser reputation system
- **Q2 2026**: Package dependency resolution
- **Q3 2026**: Advanced analytics dashboard
- **Q4 2026**: Package governance features

##CONTRACT_ADDRESS=0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34

## 🔗 Integration Guides

- [Contract Deployment Guide](./contract-deployment-guide.md)
- [Pinata IPFS Integration Guide](./pinata-ipfs-integration-guide.md)
- [Full Roadmap](./ROADMAP.md)

## 🤝 Contributing

We welcome contributions to Movr! Please see our contributing guidelines for more information.

## 📜 License

Apache-2.0 
