# Movr CLI Usage Guide

## General Notes
- All commands support `--network <network>` (e.g., `devnet`, `testnet`, `mainnet`) and `--wallet <name>` to specify the wallet to use.
- For most commands, if `--wallet` is not provided, the default wallet is used.

---

## 1. Initialize a Move Package or Registry

### Create a new Move package
```sh
movr init [directory] [options]
```
- `[directory]` (optional): Directory to create the package in (default: current directory).
- `-n, --name <name>`: Package name.
- `-a, --author <author>`: Package author.
- `-d, --description <description>`: Package description.
- `-t, --template <template>`: Package template (`basic`, `token`, `defi`). Default: `basic`.

**Example:**
```sh
movr init my_package -n my_package -a "Alice" -d "A cool Move package" -t basic
```

### Initialize the movr registry
```sh
movr init registry --wallet <wallet>
```
- `registry`: Special keyword to initialize the registry.
- `--wallet <wallet>`: Wallet to use for registry initialization.

---

## 2. Publish a Package

```sh
movr publish [options]
```
- `--package-path <path>`: Path to package directory (default: `.`).
- `--pkg-version <pkgVersion>`: Package version (semver format).
- `--description <description>`: Package description.
- `--homepage <url>`: Package homepage URL.
- `--repository <url>`: Package repository URL.
- `--license <license>`: Package license.
- `--tags <tags>`: Package tags (comma separated).
- `--ipfs-provider <provider>`: IPFS provider to use (default: `pinata`).
- `--network <network>`: Network to publish to.
- `--wallet <name>`: Wallet to use for publishing.

**Example:**
```sh
movr publish --package-path ./my_package --pkg-version 1.0.0 --description "A cool Move package" --tags move,library --wallet alice
```

---

## 3. Install a Package

```sh
movr install <name> [options]
```
- `<name>`: Package name to install.
- `-v, --version <version>`: Package version.
- `-o, --output-dir <dir>`: Output directory.
- `--network <network>`: Network to use.

**Example:**
```sh
movr install my_package -v 1.0.0 -o ./packages/my_package
```

---

## 4. Endorse a Package or Register as Endorser

### Endorse a package
```sh
movr endorse <name> [stakeAmount] [options]
```
- `<name>`: Package name to endorse.
- `-v, --version <version>`: Package version.
- `-c, --comment <comment>`: Endorsement comment.
- `--network <network>`: Network to use.
- `--wallet <name>`: Wallet to use.

**Example:**
```sh
movr endorse my_package -v 1.0.0 --wallet alice
```

### Register as an endorser
```sh
movr endorse register <stakeAmount> [options]
```
- `register`: Special keyword to register as an endorser.
- `<stakeAmount>`: Amount to stake (required).
- `--wallet <name>`: Wallet to use.

**Example:**
```sh
movr endorse register 100000000 --wallet alice
```

---

## 5. Tip a Package

```sh
movr tip <name> [options]
```
- `<name>`: Package name to tip.
- `-v, --version <version>`: Package version.
- `-a, --amount <amount>`: Amount to tip (required).
- `--network <network>`: Network to use.
- `--wallet <name>`: Wallet to use.

**Example:**
```sh
movr tip my_package -v 1.0.0 -a 1000000 --wallet alice
```

---

## 6. Search for Packages

```sh
movr search <query> [options]
```
- `<query>`: Search query.
- `-t, --package-type <type>`: Filter by package type (`library`, `template`).
- `-e, --min-endorsements <count>`: Filter by minimum endorsements.
- `-l, --limit <count>`: Limit number of results.
- `-d, --details`: Show detailed package information.
- `--network <network>`: Network to use.

**Example:**
```sh
movr search "move" -t library -e 2 -l 10 -d
```

---

## 7. Wallet Management

```sh
movr wallet <command> [options]
```
- `create <name>`: Create a new wallet.
- `list`: List all wallets.
- `show [name]`: Show wallet details.
- `remove <name>`: Remove a wallet.
- `use <name>`: Set default wallet.
- `import <name> --private-key <privateKey>`: Import a wallet from a private key.

**Examples:**
```sh
movr wallet create alice
movr wallet list
movr wallet show alice
movr wallet remove alice
movr wallet use alice
movr wallet import alice --private-key 0xabc123...
```

---

## 8. IPFS Operations

```sh
movr ipfs <command> [options]
```
- `upload <path> [-m, --metadata <json>]`: Upload a file or directory to IPFS.
- `download <hash> <output>`: Download a file from IPFS.
- `test`: Test IPFS connection.

**Examples:**
```sh
movr ipfs upload ./my_package.zip -m '{"name":"my_package"}'
movr ipfs download QmHash ./output.zip
movr ipfs test
``` 