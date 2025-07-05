# Aptos/Move Setup Guide

## 1. Installation

Install the Aptos CLI using the following command:

```bash
sudo curl -fssl "https://aptos.dev/scripts/install_cli.py" | python3
```

---

## 2. Project Initialization

Initialize your Move project with:

```bash
aptos move init --name <name of dapp>
```

This command will generate the following folders in your project directory:
- `scripts`
- `sources`
- `tests`

---

## 3. Account Creation

Create an account for development or testing by running:

```bash
aptos move init --network <dev or test>
```

After running this command, you should see a `.aptos` folder and a `config.yml` file in your project directory. This configuration essentially acts as your wallet.

---

## 4. Understanding `config.yml` and the Account Value

After account creation, your `.aptos/config.yml` file will contain an `account` value. This value is important because:

- **Account Address:** The `account` value represents the address on the Aptos blockchain where your Move modules are deployed.
- **Module Identifier:** When you define a Move module, you will use this account address as the identifier in the module's storage and when making calls to the module.
- **Referencing the Account:** Whenever you interact with your deployed module (e.g., calling functions, accessing resources), you will refer to this account address.

**Example:**

If your `config.yml` contains:

```yaml
account: "0x123...abc"
```

Then, when deploying or calling your Move module, you will use `0x123...abc` as the module's address.

---

## 5. Compilation

To compile your Move modules, use the following command:

```bash
aptos move compile
```

This will compile the Move code in your project and output the build artifacts.

---
