# Aptos Move Contract Deployment Guide

This guide provides step-by-step instructions for deploying Move contracts on the Aptos blockchain, focusing on the APM (Aptos Package Manager) system.

## Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli/) installed
- [Node.js and npm](https://nodejs.org/) (v16 or higher) installed
- Basic understanding of Move language and Aptos blockchain

## Setup Project Structure

1. Create a new Move project using Aptos CLI:

```bash
aptos move init --name my_package
cd my_package
```

2. Configure your `Move.toml` file:

```toml
[package]
name = "MyPackage"
version = "0.0.1"

[addresses]
my_address = "_"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-framework.git"
rev = "mainnet"
subdir = "aptos-framework"
```

## Create Your Move Contract

1. Create a new file in the `sources` directory (e.g., `my_module.move`):

```move
module my_address::my_module {
    use std::signer;
    use aptos_framework::account;
    
    // Error constants
    const ENOT_INITIALIZED: u64 = 1;
    
    // Resource struct
    struct MyResource has key {
        value: u64
    }
    
    // Initialize resource
    public entry fun initialize(account: &signer) {
        let resource = MyResource {
            value: 0
        };
        move_to(account, resource);
    }
    
    // Update value
    public entry fun update_value(account: &signer, new_value: u64) acquires MyResource {
        let signer_address = signer::address_of(account);
        assert!(exists<MyResource>(signer_address), ENOT_INITIALIZED);
        
        let resource = borrow_global_mut<MyResource>(signer_address);
        resource.value = new_value;
    }
    
    // Get value (view function)
    #[view]
    public fun get_value(addr: address): u64 acquires MyResource {
        assert!(exists<MyResource>(addr), ENOT_INITIALIZED);
        borrow_global<MyResource>(addr).value
    }
}
```

2. Add unit tests (optional but recommended):

```move
#[test_only]
module my_address::my_module_tests {
    use std::signer;
    use aptos_framework::account;
    use my_address::my_module;
    
    #[test(user = @0x123)]
    public fun test_initialize(user: signer) {
        // Create test account
        account::create_account_for_test(signer::address_of(&user));
        
        // Initialize resource
        my_module::initialize(&user);
        
        // Verify value
        let value = my_module::get_value(signer::address_of(&user));
        assert!(value == 0, 0);
    }
    
    #[test(user = @0x123)]
    public fun test_update_value(user: signer) {
        // Create test account
        account::create_account_for_test(signer::address_of(&user));
        
        // Initialize resource
        my_module::initialize(&user);
        
        // Update value
        my_module::update_value(&user, 42);
        
        // Verify value
        let value = my_module::get_value(signer::address_of(&user));
        assert!(value == 42, 0);
    }
}
```

## Compile and Test

1. Compile your Move contract:

```bash
aptos move compile --named-addresses my_address=0x1
```

2. Run tests:

```bash
aptos move test --named-addresses my_address=0x1
```

3. Generate test coverage report (optional):

```bash
aptos move test --coverage
```

## Deploy Contract

### Option 1: Direct Deployment

1. Create an account if you don't have one:

```bash
aptos init
```

2. Deploy your contract:

```bash
aptos move publish --named-addresses my_address=$(aptos config show-profiles --profile default | grep 'account:' | awk '{print $2}')
```

### Option 2: Deploy to an Object

1. Compile your code with your address:

```bash
aptos move compile --named-addresses my_address=<your_address>
```

2. Deploy to a new object:

```bash
aptos move deploy-object --address-name my_address
```

3. Upgrade an existing object (if needed):

```bash
aptos move upgrade-object --address-name my_address --object-address <code_object_addr>
```

### Option 3: Using npm Scripts (for JavaScript/TypeScript Projects)

1. Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "move:compile": "aptos move compile --named-addresses my_address=${VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS}",
    "move:test": "aptos move test --named-addresses my_address=${VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS}",
    "move:publish": "aptos move publish --named-addresses my_address=${VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS}"
  }
}
```

2. Create a `.env` file with your account details:

```
VITE_APP_NETWORK=devnet
VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS=0x...
VITE_MODULE_PUBLISHER_ACCOUNT_PRIVATE_KEY=0x...
```

3. Compile and publish:

```bash
npm run move:compile
npm run move:publish
```

## Verify Deployment

1. Check your module on-chain:

```bash
aptos account list --query modules
```

2. Run a function from your published module:

```bash
aptos move run --function-id <address>::my_module::initialize
```

## Best Practices

1. **Format your code** before publishing:

```bash
aptos move fmt
```

2. **Use formal verification** with the Move Prover:

```bash
aptos move prove
```

3. **Use error constants** instead of magic numbers for better readability.

4. **Test thoroughly** before deployment, including expected failure cases.

5. **Document your code** with comments explaining the purpose of each function.

## Advanced Features

### Upgrading Contracts

Aptos supports upgrading contracts. To upgrade a contract:

1. Make changes to your module code
2. Recompile the module
3. Publish the updated module:

```bash
aptos move publish --named-addresses my_address=<your_address>
```

### Using the Move Prover

The Move Prover is a formal verification tool that can prove your code is correct:

```bash
aptos move prove --package-dir <your-package-directory>
```

### Generating TypeScript Types

For frontend integration, generate TypeScript types for your contract:

1. Download the ABI:

```bash
# For bash
echo "export const ABI = $(curl https://fullnode.$NETWORK.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_NAME | sed -n 's/.*\"abi\":\({.*}\).*}/\1/p') as const" > abi.ts

# For PowerShell
Invoke-RestMethod -Uri "https://fullnode.$NETWORK.aptoslabs.com/v1/accounts/$CONTRACT_ADDRESS/module/$MODULE_NAME" |
    Select-Object -ExpandProperty abi | ConvertTo-Json -Compress |
    Foreach-Object { "export const ABI = $_ as const" } |
    Out-File -FilePath "abi.ts"
```

## Troubleshooting

1. **Compilation Errors**: Check your Move syntax and dependencies.

2. **Publishing Errors**: Ensure you're using the correct address and have sufficient funds.

3. **Transaction Errors**: Verify function parameters and resource existence.

4. **Gas Issues**: Increase the max gas amount if needed.

## Resources

- [Aptos Developer Documentation](https://aptos.dev/)
- [Move Language Book](https://move-language.github.io/move/)
- [Aptos Framework Reference](https://aptos.dev/reference/aptos-framework)
- [Aptos CLI Reference](https://aptos.dev/cli-tools/aptos-cli-tool/use-aptos-cli/) 