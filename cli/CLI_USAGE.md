# Movr CLI Usage Guide

## Overview
The Movr CLI is a comprehensive tool for managing Move packages on the Aptos blockchain. It provides functionality for package publication, installation, endorsement, and discovery through an integrated package registry.

## Installation & Setup
```bash
# Install movr CLI globally
npm install -g movr

# Verify installation
movr --version
```

## General Command Structure
```bash
movr <command> [subcommand] [options]
```

**Global Options:**
- `--network <network>`: Network to use (`devnet`, `testnet`, `mainnet`). Default: `devnet`
- `--wallet <name>`: Wallet name to use for transactions
- `--help`: Show help information
- `--version`: Show version information

---

## 1. Getting Started

### Show Available Commands
```bash
movr
```
Displays all available commands and their descriptions.

### Initialize a New Package
```bash
movr init [directory]
```
Creates a new Move package in the specified directory (current directory if not specified).

**Options:**
- `-n, --name <name>`: Package name
- `-a, --author <author>`: Package author  
- `-d, --description <description>`: Package description
- `-t, --template <template>`: Package template (`basic`, `token`, `defi`). Default: `basic`

**Examples:**
```bash
# Initialize in current directory
movr init

# Initialize with specific options
movr init my-package --name "MyPackage" --author "Alice" --description "My awesome Move package"
```

---

## 2. Wallet Management

### Wallet Commands Overview
```bash
movr wallet
```
Shows available wallet management commands.

### Create a New Wallet
```bash
movr wallet create <wallet_name>
```
Creates a new wallet with the specified name.

**Example:**
```bash
movr wallet create socchin
```

### List All Wallets
```bash
movr wallet list
```
Displays all created wallets and indicates which is currently active.

### Set Default Wallet
```bash
movr wallet use <wallet_name>
```
Sets the specified wallet as the default for all operations.

**Example:**
```bash
movr wallet use socchin
```

### Show Wallet Details
```bash
movr wallet show [wallet_name]
```
Shows detailed information for the specified wallet (or default wallet if not specified).

### Remove a Wallet
```bash
movr wallet remove <wallet_name>
```
Permanently removes the specified wallet.

### Import Wallet from Private Key
```bash
movr wallet import <wallet_name> --private-key <private_key>
```
Imports an existing wallet using its private key.

---

## 3. Package Publishing

### Publish a Package
```bash
movr publish --package-path <path> --pkg-version <version> [options]
```

**Required Options:**
- `--package-path <path>`: Path to the package directory
- `--pkg-version <version>`: Package version (semantic versioning)

**Optional Options:**
- `--description <description>`: Package description
- `--homepage <url>`: Package homepage URL
- `--repository <url>`: Package repository URL
- `--license <license>`: Package license (e.g., MIT, Apache-2.0)
- `--tags <tags>`: Comma-separated tags for categorization
- `--ipfs-provider <provider>`: IPFS provider (`pinata`, `infura`). Default: `pinata`
- `--network <network>`: Target network
- `--wallet <name>`: Wallet to use for publishing

**Example:**
```bash
movr publish --package-path ./contract --pkg-version 1.2.0 --description "My awesome Move contract" --tags "utility,helper,math" --wallet socchin
```

---

## 4. Package Discovery

### Search for Packages
```bash
movr search "<query>" [options]
```

**Options:**
- `-t, --package-type <type>`: Filter by package type (`library`, `template`)
- `-e, --min-endorsements <count>`: Minimum number of endorsements
- `-l, --limit <count>`: Maximum number of results to return
- `-d, --details`: Show detailed package information
- `--network <network>`: Network to search on

**Examples:**
```bash
# Basic search
movr search "contract"

# Advanced search with filters
movr search "defi" --package-type library --min-endorsements 5 --limit 10 --details
```

---

## 5. Package Installation

### Install a Package
```bash
movr install <package_name> [options]
```

**Options:**
- `-v, --version <version>`: Specific version to install
- `-o, --output-dir <directory>`: Installation directory
- `--network <network>`: Network to install from

**Examples:**
```bash
# Install latest version
movr install my-package

# Install specific version
movr install my-package --version 1.2.0 --output-dir ./packages/
```

---

## 6. Package Endorsement System

### Register as an Endorser
```bash
movr endorse register <stake_amount> --wallet <wallet_name>
```
Registers you as a package endorser by staking the specified amount.

**Parameters:**
- `<stake_amount>`: Amount to stake (in octas, minimum: 1000000)
- `--wallet <name>`: Wallet to use for staking

```

### Endorse a Package
```bash
movr endorse <package_name> [stake_amount] [options]
```
Endorses a specific package (requires prior endorser registration).

**Parameters:**
- `<package_name>`: Name of the package to endorse
- `[stake_amount]`: Additional stake amount (optional)

**Options:**
- `-v, --version <version>`: Package version to endorse
- `-c, --comment <comment>`: Endorsement comment
- `--network <network>`: Target network
- `--wallet <name>`: Wallet to use


---

## 7. Package Tipping

### Tip a Package Developer
```bash
movr tip <package_name> --amount <amount> [options]
```

**Required Options:**
- `--amount <amount>`: Tip amount in octas

**Optional Options:**
- `-v, --version <version>`: Package version to tip
- `--network <network>`: Target network  
- `--wallet <name>`: Wallet to use for tipping


---

## 8. IPFS Operations

### IPFS Commands Overview
```bash
movr ipfs
```
Shows available IPFS-related commands.

### Upload to IPFS
```bash
movr ipfs upload <path> [options]
```

**Options:**
- `-m, --metadata <json>`: Additional metadata as JSON string

**Example:**
```bash
movr ipfs upload ./my-package.zip --metadata '{"name":"my-package","version":"1.0.0"}'
```

### Download from IPFS
```bash
movr ipfs download <hash> <output_path>
```

**Example:**
```bash
movr ipfs download QmHash123456789 ./downloaded-package.zip
```

### Test IPFS Connection
```bash
movr ipfs test
```
Tests connectivity to the configured IPFS provider.

---

## 9. Common Workflows

### Complete Package Lifecycle
```bash
# 1. Set up wallet
movr wallet create myproject
movr wallet use myproject

# 2. Initialize package
movr init my-package --name "MyPackage" --author "Developer"

# 3. Develop your package...

# 4. Publish package
movr publish --package-path ./my-package --pkg-version 1.0.0 --description "Awesome Move package" --tags "utility,math"

# 5. Register as endorser (optional)
movr endorse register 10000000

# 6. Search for other packages
movr search "math" --details
```

### Working with Multiple Networks
```bash
# Publish to testnet
movr publish --package-path ./contract --pkg-version 1.0.0 --network testnet

# Search on mainnet
movr search "defi" --network mainnet

# Use different wallets for different networks
movr wallet create testnet-wallet
movr publish --package-path ./contract --pkg-version 1.0.0 --network testnet --wallet testnet-wallet
```

---

## 10. Error Handling & Troubleshooting

### Common Issues

1. **Wallet not found**: Ensure wallet exists with `movr wallet list`
2. **Insufficient funds**: Check wallet balance and fund if necessary
3. **Package already exists**: Version numbers must be unique per package
4. **Network connection**: Verify network connectivity and node availability
5. **IPFS upload failures**: Check IPFS provider configuration and connectivity

### Debug Information
Add `--verbose` flag to any command for detailed logging:
```bash
movr publish --package-path ./contract --pkg-version 1.0.0 --verbose
```

### Configuration
Configuration files are stored in `~/.movr/` directory:
- `config.json`: Global configuration
- `wallets/`: Wallet storage directory
- `logs/`: Application logs 