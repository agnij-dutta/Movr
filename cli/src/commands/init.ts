import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import { createFileSystemError } from '../utils/errors.js';
import { Command } from 'commander';
import { ConfigService } from '../services/config.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { Network } from '@aptos-labs/ts-sdk';

export interface InitCommandOptions {
  directory: string;
  name?: string;
  author?: string;
  description?: string;
  template?: 'basic' | 'token' | 'defi';
}

export interface GlobalOptions {
  network: string;
  configPath?: string;
}

export class InitCommand {
  private config: ConfigService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    
    // Register command with Commander
    this.program = parentProgram
      .command('init')
      .description('Initialize a new Move package or the movr registry')
      .argument('[directory]', 'Directory to create package in (or "registry" to initialize registry)', '.')
      .option('-n, --name <name>', 'Package name')
      .option('-a, --author <author>', 'Package author')
      .option('-d, --description <description>', 'Package description')
      .option('-t, --template <template>', 'Package template (basic, token, defi)', 'basic')
      .option('--wallet <name>', 'Wallet to use for registry initialization')
      .action(async (directory, options) => {
        if (directory === 'registry') {
          await this.executeRegistryInit(options);
        } else {
        await this.execute({ directory, ...options });
        }
      });
  }

  async execute(options: InitCommandOptions): Promise<void> {
    try {
      logger.info('Initializing new Move package', {
        directory: options.directory,
        template: options.template,
      });

      const packageDir = path.resolve(options.directory);
      
      // Check if directory exists and is not empty
      if (await fs.pathExists(packageDir)) {
        const files = await fs.readdir(packageDir);
        if (files.length > 0) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: `Directory ${packageDir} is not empty. Continue?`,
              default: false,
            },
          ]);

          if (!proceed) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }
      } else {
        await fs.ensureDir(packageDir);
      }

      // Gather package information
      const packageInfo = await this.gatherPackageInfo(options);

      // Create package structure
      await this.createPackageStructure(packageDir, packageInfo, options.template!);

      console.log(chalk.green('✅ Move package initialized successfully!'));
      console.log(chalk.gray(`Package created at: ${packageDir}`));
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('  1. Navigate to the package directory'));
      console.log(chalk.gray('  2. Build your Move modules in sources/'));
      console.log(chalk.gray('  3. Run tests with `movr test`'));
      console.log(chalk.gray('  4. Publish with `movr publish`'));

    } catch (error) {
      logger.error('Failed to initialize package', { error });
      throw error;
    }
  }

  async executeRegistryInit(options: any): Promise<void> {
    try {
      logger.info('Initializing movr registry');

      // Get wallet configuration
      const walletConfig = this.config.getWallet(options.wallet || '');
      if (!walletConfig || !walletConfig.privateKey) {
        throw new Error('No wallet configured or private key missing. Run `movr wallet create` first');
      }

      // Initialize blockchain service
      const config = this.config.getConfig();
      const blockchain = new AptosBlockchainService(
        (config.currentNetwork as Network) || Network.DEVNET
      );

      // Create account from private key
      const account = blockchain.createAccountFromPrivateKey(walletConfig.privateKey);

      console.log(chalk.blue('Initializing movr registry...'));
      console.log(chalk.gray(`Using wallet: ${walletConfig.name} (${walletConfig.address})`));

      // Get contract address from config
      const contractAddress = this.config.getRegistryContract();

      // Call the registry initialization function
      const transaction = await blockchain['aptos'].transaction.build.simple({
        sender: account.accountAddress,
        data: {
          function: `${contractAddress}::registry::initialize_registry`,
          functionArguments: [],
        },
      });

      const senderAuthenticator = blockchain['aptos'].transaction.sign({
        signer: account,
        transaction,
      });

      const submittedTx = await blockchain['aptos'].transaction.submit.simple({
        transaction,
        senderAuthenticator,
      });

      const txResult = await blockchain['aptos'].waitForTransaction({
        transactionHash: submittedTx.hash,
      });

      if (txResult.success) {
        console.log(chalk.green('✅ movr registry initialized successfully!'));
        console.log(chalk.gray(`Transaction hash: ${submittedTx.hash}`));
      } else {
        console.log(chalk.red('✗ Failed to initialize registry'));
        if (txResult.vm_status) {
          console.log(chalk.red(txResult.vm_status));
        }
      }

    } catch (error) {
      logger.error('Failed to initialize registry', { error });
      console.log(chalk.red('✗ Failed to initialize registry'));
      if (error instanceof Error) {
        console.log(chalk.red(error.message));
      }
    }
  }

  private async gatherPackageInfo(options: InitCommandOptions) {
    const questions = [];

    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Package name:',
        default: path.basename(path.resolve(options.directory)),
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Package name is required';
          }
          if (!/^[a-z][a-z0-9_]*$/.test(input)) {
            return 'Package name must start with a letter and contain only lowercase letters, numbers, and underscores';
          }
          return true;
        },
      });
    }

    if (!options.author) {
      questions.push({
        type: 'input',
        name: 'author',
        message: 'Author:',
        default: '',
      });
    }

    if (!options.description) {
      questions.push({
        type: 'input',
        name: 'description',
        message: 'Description:',
        default: '',
      });
    }

    const answers = await inquirer.prompt(questions);

    return {
      name: options.name || answers.name,
      author: options.author || answers.author,
      description: options.description || answers.description,
    };
  }

  private async createPackageStructure(
    packageDir: string,
    packageInfo: any,
    template: string
  ): Promise<void> {
    try {
      // Create Move.toml
      const moveToml = this.generateMoveToml(packageInfo);
      await fs.writeFile(path.join(packageDir, 'Move.toml'), moveToml);

      // Create directory structure
      await fs.ensureDir(path.join(packageDir, 'sources'));
      await fs.ensureDir(path.join(packageDir, 'tests'));
      await fs.ensureDir(path.join(packageDir, 'scripts'));
      await fs.ensureDir(path.join(packageDir, 'doc'));

      // Create template files based on selected template
      await this.createTemplateFiles(packageDir, packageInfo, template);

      // Create README.md
      const readme = this.generateReadme(packageInfo);
      await fs.writeFile(path.join(packageDir, 'README.md'), readme);

      // Create .gitignore
      const gitignore = this.generateGitignore();
      await fs.writeFile(path.join(packageDir, '.gitignore'), gitignore);

      logger.info('Package structure created', {
        packageDir,
        template,
        name: packageInfo.name,
      });

    } catch (error) {
      throw createFileSystemError(
        `Failed to create package structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateMoveToml(packageInfo: any): string {
    return `[package]
name = "${packageInfo.name}"
version = "1.0.0"
authors = ["${packageInfo.author}"]
license = "MIT"

[addresses]
${packageInfo.name} = "_"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-framework/", rev = "main" }
AptosStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-stdlib/", rev = "main" }
MoveStdlib = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/move-stdlib/", rev = "main" }

[dev-dependencies]

[dev-addresses]
${packageInfo.name} = "0x1"
`;
  }

  private async createTemplateFiles(
    packageDir: string,
    packageInfo: any,
    template: string
  ): Promise<void> {
    switch (template) {
      case 'basic':
        await this.createBasicTemplate(packageDir, packageInfo);
        break;
      case 'token':
        await this.createTokenTemplate(packageDir, packageInfo);
        break;
      case 'defi':
        await this.createDefiTemplate(packageDir, packageInfo);
        break;
      default:
        await this.createBasicTemplate(packageDir, packageInfo);
    }
  }

  private async createBasicTemplate(packageDir: string, packageInfo: any): Promise<void> {
    const moduleContent = `module ${packageInfo.name}::${packageInfo.name} {
    use std::signer;
    use std::string::String;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    /// Resource to store module data
    struct ModuleData has key {
        value: u64,
        message: String,
    }

    /// Initialize the module
    public entry fun initialize(account: &signer, initial_value: u64, message: String) {
        let account_addr = signer::address_of(account);
        assert!(!exists<ModuleData>(account_addr), E_ALREADY_INITIALIZED);
        
        move_to(account, ModuleData {
            value: initial_value,
            message,
        });
    }

    /// Update the stored value
    public entry fun update_value(account: &signer, new_value: u64) acquires ModuleData {
        let account_addr = signer::address_of(account);
        assert!(exists<ModuleData>(account_addr), E_NOT_INITIALIZED);
        
        let module_data = borrow_global_mut<ModuleData>(account_addr);
        module_data.value = new_value;
    }

    /// Get the stored value
    #[view]
    public fun get_value(addr: address): u64 acquires ModuleData {
        assert!(exists<ModuleData>(addr), E_NOT_INITIALIZED);
        borrow_global<ModuleData>(addr).value
    }

    /// Get the stored message
    #[view]
    public fun get_message(addr: address): String acquires ModuleData {
        assert!(exists<ModuleData>(addr), E_NOT_INITIALIZED);
        borrow_global<ModuleData>(addr).message
    }
}
`;

    await fs.writeFile(
      path.join(packageDir, 'sources', `${packageInfo.name}.move`),
      moduleContent
    );

    // Create test file
    const testContent = `#[test_only]
module ${packageInfo.name}::${packageInfo.name}_tests {
    use ${packageInfo.name}::${packageInfo.name};
    use std::string;
    use std::signer;

    #[test(account = @${packageInfo.name})]
    public fun test_initialize(account: &signer) {
        let addr = signer::address_of(account);
        ${packageInfo.name}::initialize(account, 42, string::utf8(b"Hello, Aptos!"));
        
        assert!(${packageInfo.name}::get_value(addr) == 42, 0);
        assert!(${packageInfo.name}::get_message(addr) == string::utf8(b"Hello, Aptos!"), 1);
    }

    #[test(account = @${packageInfo.name})]
    public fun test_update_value(account: &signer) {
        let addr = signer::address_of(account);
        ${packageInfo.name}::initialize(account, 42, string::utf8(b"Hello, Aptos!"));
        ${packageInfo.name}::update_value(account, 100);
        
        assert!(${packageInfo.name}::get_value(addr) == 100, 0);
    }
}
`;

    await fs.writeFile(
      path.join(packageDir, 'tests', `${packageInfo.name}_tests.move`),
      testContent
    );
  }

  private async createTokenTemplate(packageDir: string, packageInfo: any): Promise<void> {
    const moduleContent = `module ${packageInfo.name}::token {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, BurnCapability, FreezeCapability, MintCapability};
    use aptos_framework::account;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_NOT_AUTHORIZED: u64 = 4;

    /// Token data
    struct TokenInfo has key {
        name: String,
        symbol: String,
        decimals: u8,
        supply: u64,
        mint_cap: MintCapability<CoinType>,
        burn_cap: BurnCapability<CoinType>,
        freeze_cap: FreezeCapability<CoinType>,
    }

    /// Initialize token with metadata
    public entry fun initialize(
        account: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        monitor_supply: bool,
    ) {
        let account_addr = signer::address_of(account);
        assert!(!exists<TokenInfo>(account_addr), error::already_exists(E_ALREADY_INITIALIZED));

        let (mint_cap, burn_cap, freeze_cap) = coin::initialize<CoinType>(
            account,
            name,
            symbol,
            decimals,
            monitor_supply,
        );

        move_to(account, TokenInfo {
            name,
            symbol,
            decimals,
            supply: 0,
            mint_cap,
            burn_cap,
            freeze_cap,
        });
    }

    /// Mint new tokens
    public entry fun mint(
        account: &signer,
        amount: u64,
        recipient: address,
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), error::not_found(E_NOT_INITIALIZED));

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins = coin::mint(amount, &token_info.mint_cap);
        coin::deposit(recipient, coins);
        token_info.supply = token_info.supply + amount;
    }

    /// Burn tokens
    public entry fun burn(
        account: &signer,
        amount: u64,
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), error::not_found(E_NOT_INITIALIZED));

        let token_info = borrow_global_mut<TokenInfo>(account_addr);
        let coins = coin::withdraw<CoinType>(account, amount);
        coin::burn(coins, &token_info.burn_cap);
        token_info.supply = token_info.supply - amount;
    }

    /// Freeze account
    public entry fun freeze_account(
        account: &signer,
        to_freeze: address,
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), error::not_found(E_NOT_INITIALIZED));

        let token_info = borrow_global<TokenInfo>(account_addr);
        coin::freeze_account(to_freeze, &token_info.freeze_cap);
    }

    /// Unfreeze account
    public entry fun unfreeze_account(
        account: &signer,
        to_unfreeze: address,
    ) acquires TokenInfo {
        let account_addr = signer::address_of(account);
        assert!(exists<TokenInfo>(account_addr), error::not_found(E_NOT_INITIALIZED));

        let token_info = borrow_global<TokenInfo>(account_addr);
        coin::unfreeze_account(to_unfreeze, &token_info.freeze_cap);
    }

    /// Get token metadata
    #[view]
    public fun get_token_info(addr: address): (String, String, u8, u64) acquires TokenInfo {
        assert!(exists<TokenInfo>(addr), error::not_found(E_NOT_INITIALIZED));
        let token_info = borrow_global<TokenInfo>(addr);
        (
            token_info.name,
            token_info.symbol,
            token_info.decimals,
            token_info.supply,
        )
    }
}`;

    const testContent = `#[test_only]
module ${packageInfo.name}::token_tests {
    use std::signer;
    use std::string;
    use ${packageInfo.name}::token;

    #[test(creator = @${packageInfo.name})]
    public fun test_initialize(creator: &signer) {
        let name = string::utf8(b"Test Token");
        let symbol = string::utf8(b"TEST");
        let decimals = 8;

        token::initialize(creator, name, symbol, decimals, true);

        let (actual_name, actual_symbol, actual_decimals, supply) = 
            token::get_token_info(signer::address_of(creator));

        assert!(actual_name == name, 0);
        assert!(actual_symbol == symbol, 1);
        assert!(actual_decimals == decimals, 2);
        assert!(supply == 0, 3);
    }

    #[test(creator = @${packageInfo.name}, recipient = @0x123)]
    public fun test_mint_and_burn(creator: &signer, recipient: &signer) {
        let name = string::utf8(b"Test Token");
        let symbol = string::utf8(b"TEST");
        let decimals = 8;
        let amount = 1000;

        token::initialize(creator, name, symbol, decimals, true);
        token::mint(creator, amount, signer::address_of(recipient));

        let (_, _, _, supply) = token::get_token_info(signer::address_of(creator));
        assert!(supply == amount, 0);

        token::burn(creator, amount);
        let (_, _, _, supply) = token::get_token_info(signer::address_of(creator));
        assert!(supply == 0, 1);
    }

    #[test(creator = @${packageInfo.name}, user = @0x123)]
    public fun test_freeze_unfreeze(creator: &signer, user: &signer) {
        let name = string::utf8(b"Test Token");
        let symbol = string::utf8(b"TEST");
        let decimals = 8;

        token::initialize(creator, name, symbol, decimals, true);
        token::freeze_account(creator, signer::address_of(user));
        token::unfreeze_account(creator, signer::address_of(user));
    }
}`;

    // Create source and test files
    await fs.writeFile(
      path.join(packageDir, 'sources', 'token.move'),
      moduleContent
    );

    await fs.writeFile(
      path.join(packageDir, 'tests', 'token_tests.move'),
      testContent
    );

    // Update Move.toml with token dependencies
    const moveTomlPath = path.join(packageDir, 'Move.toml');
    const moveToml = await fs.readFile(moveTomlPath, 'utf-8');
    const updatedMoveToml = moveToml.replace(
      '[dependencies]',
      `[dependencies]
AptosTokenObjects = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-token-objects/", rev = "main" }`
    );
    await fs.writeFile(moveTomlPath, updatedMoveToml);
  }

  private async createDefiTemplate(packageDir: string, packageInfo: any): Promise<void> {
    const moduleContent = `module ${packageInfo.name}::defi {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::account;
    use aptos_std::math64;

    /// Error codes
    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 4;
    const E_ZERO_AMOUNT: u64 = 5;

    /// Pool data
    struct LiquidityPool<phantom CoinTypeA, phantom CoinTypeB> has key {
        coin_a: Coin<CoinTypeA>,
        coin_b: Coin<CoinTypeB>,
        lp_supply: u64,
        fee_percent: u64,
    }

    /// LP token data
    struct LPToken<phantom CoinTypeA, phantom CoinTypeB> has key {
        value: u64,
    }

    /// Initialize a new liquidity pool
    public entry fun initialize<CoinTypeA, CoinTypeB>(
        account: &signer,
        initial_a: u64,
        initial_b: u64,
        fee_percent: u64,
    ) {
        let account_addr = signer::address_of(account);
        assert!(!exists<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr), error::already_exists(E_ALREADY_INITIALIZED));
        assert!(initial_a > 0 && initial_b > 0, error::invalid_argument(E_ZERO_AMOUNT));
        assert!(fee_percent <= 1000, error::invalid_argument(E_INVALID_FEE)); // Max 10% fee

        let coin_a = coin::withdraw<CoinTypeA>(account, initial_a);
        let coin_b = coin::withdraw<CoinTypeB>(account, initial_b);

        let initial_lp = math64::sqrt((initial_a as u128 * initial_b as u128) as u64);

        move_to(account, LiquidityPool<CoinTypeA, CoinTypeB> {
            coin_a,
            coin_b,
            lp_supply: initial_lp,
            fee_percent,
        });

        // Issue initial LP tokens
        move_to(account, LPToken<CoinTypeA, CoinTypeB> { value: initial_lp });
    }

    /// Add liquidity to the pool
    public entry fun add_liquidity<CoinTypeA, CoinTypeB>(
        account: &signer,
        amount_a: u64,
        amount_b: u64,
    ) acquires LiquidityPool {
        let account_addr = signer::address_of(account);
        assert!(exists<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr), error::not_found(E_NOT_INITIALIZED));
        assert!(amount_a > 0 && amount_b > 0, error::invalid_argument(E_ZERO_AMOUNT));

        let pool = borrow_global_mut<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr);
        
        let coin_a = coin::withdraw<CoinTypeA>(account, amount_a);
        let coin_b = coin::withdraw<CoinTypeB>(account, amount_b);

        let a_reserve = coin::value(&pool.coin_a);
        let b_reserve = coin::value(&pool.coin_b);

        let lp_amount = math64::min(
            (amount_a * pool.lp_supply) / a_reserve,
            (amount_b * pool.lp_supply) / b_reserve
        );

        coin::merge(&mut pool.coin_a, coin_a);
        coin::merge(&mut pool.coin_b, coin_b);
        pool.lp_supply = pool.lp_supply + lp_amount;

        if (!exists<LPToken<CoinTypeA, CoinTypeB>>(account_addr)) {
            move_to(account, LPToken<CoinTypeA, CoinTypeB> { value: 0 });
        };
        
        let lp_token = borrow_global_mut<LPToken<CoinTypeA, CoinTypeB>>(account_addr);
        lp_token.value = lp_token.value + lp_amount;
    }

    /// Remove liquidity from the pool
    public entry fun remove_liquidity<CoinTypeA, CoinTypeB>(
        account: &signer,
        lp_amount: u64,
    ) acquires LiquidityPool, LPToken {
        let account_addr = signer::address_of(account);
        assert!(exists<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr), error::not_found(E_NOT_INITIALIZED));
        assert!(exists<LPToken<CoinTypeA, CoinTypeB>>(account_addr), error::not_found(E_NOT_INITIALIZED));
        
        let pool = borrow_global_mut<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr);
        let lp_token = borrow_global_mut<LPToken<CoinTypeA, CoinTypeB>>(account_addr);
        
        assert!(lp_token.value >= lp_amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));

        let a_reserve = coin::value(&pool.coin_a);
        let b_reserve = coin::value(&pool.coin_b);

        let amount_a = (lp_amount * a_reserve) / pool.lp_supply;
        let amount_b = (lp_amount * b_reserve) / pool.lp_supply;

        coin::deposit(account_addr, coin::extract(&mut pool.coin_a, amount_a));
        coin::deposit(account_addr, coin::extract(&mut pool.coin_b, amount_b));

        pool.lp_supply = pool.lp_supply - lp_amount;
        lp_token.value = lp_token.value - lp_amount;
    }

    /// Swap exact amount of token A for token B
    public entry fun swap_exact_a_for_b<CoinTypeA, CoinTypeB>(
        account: &signer,
        amount_a_in: u64,
        min_b_out: u64,
    ) acquires LiquidityPool {
        let account_addr = signer::address_of(account);
        assert!(exists<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr), error::not_found(E_NOT_INITIALIZED));
        assert!(amount_a_in > 0, error::invalid_argument(E_ZERO_AMOUNT));

        let pool = borrow_global_mut<LiquidityPool<CoinTypeA, CoinTypeB>>(account_addr);
        
        let a_reserve = coin::value(&pool.coin_a);
        let b_reserve = coin::value(&pool.coin_b);

        let amount_a_with_fee = amount_a_in * (10000 - pool.fee_percent);
        let amount_b_out = (amount_a_with_fee * b_reserve) / ((a_reserve * 10000) + amount_a_with_fee);

        assert!(amount_b_out >= min_b_out, error::invalid_argument(E_INSUFFICIENT_OUTPUT));

        let coin_a_in = coin::withdraw<CoinTypeA>(account, amount_a_in);
        coin::merge(&mut pool.coin_a, coin_a_in);
        
        let coin_b_out = coin::extract(&mut pool.coin_b, amount_b_out);
        coin::deposit(account_addr, coin_b_out);
    }

    /// Get pool info
    #[view]
    public fun get_pool_info<CoinTypeA, CoinTypeB>(addr: address): (u64, u64, u64, u64) acquires LiquidityPool {
        assert!(exists<LiquidityPool<CoinTypeA, CoinTypeB>>(addr), error::not_found(E_NOT_INITIALIZED));
        
        let pool = borrow_global<LiquidityPool<CoinTypeA, CoinTypeB>>(addr);
        (
            coin::value(&pool.coin_a),
            coin::value(&pool.coin_b),
            pool.lp_supply,
            pool.fee_percent,
        )
    }

    /// Get LP token balance
    #[view]
    public fun get_lp_balance<CoinTypeA, CoinTypeB>(addr: address): u64 acquires LPToken {
        if (!exists<LPToken<CoinTypeA, CoinTypeB>>(addr)) {
            return 0
        };
        borrow_global<LPToken<CoinTypeA, CoinTypeB>>(addr).value
    }
}`;

    const testContent = `#[test_only]
module ${packageInfo.name}::defi_tests {
    use std::signer;
    use ${packageInfo.name}::defi;
    use aptos_framework::coin;
    use aptos_framework::account;

    struct CoinA {}
    struct CoinB {}

    #[test(creator = @${packageInfo.name})]
    public fun test_initialize(creator: &signer) {
        // Setup test coins
        let (burn_cap_a, freeze_cap_a, mint_cap_a) = coin::initialize<CoinA>(
            creator,
            string::utf8(b"Coin A"),
            string::utf8(b"A"),
            8,
            true
        );

        let (burn_cap_b, freeze_cap_b, mint_cap_b) = coin::initialize<CoinB>(
            creator,
            string::utf8(b"Coin B"),
            string::utf8(b"B"),
            8,
            true
        );

        // Mint initial coins
        let coins_a = coin::mint(1000, &mint_cap_a);
        let coins_b = coin::mint(1000, &mint_cap_b);
        
        coin::deposit(signer::address_of(creator), coins_a);
        coin::deposit(signer::address_of(creator), coins_b);

        // Initialize pool
        defi::initialize<CoinA, CoinB>(creator, 1000, 1000, 30); // 0.3% fee

        let (reserve_a, reserve_b, lp_supply, fee_percent) = 
            defi::get_pool_info<CoinA, CoinB>(signer::address_of(creator));

        assert!(reserve_a == 1000, 0);
        assert!(reserve_b == 1000, 1);
        assert!(lp_supply == 1000, 2); // sqrt(1000 * 1000)
        assert!(fee_percent == 30, 3);

        // Clean up test resources
        coin::destroy_burn_cap(burn_cap_a);
        coin::destroy_freeze_cap(freeze_cap_a);
        coin::destroy_mint_cap(mint_cap_a);
        coin::destroy_burn_cap(burn_cap_b);
        coin::destroy_freeze_cap(freeze_cap_b);
        coin::destroy_mint_cap(mint_cap_b);
    }

    #[test(creator = @${packageInfo.name}, user = @0x123)]
    public fun test_add_remove_liquidity(creator: &signer, user: &signer) {
        // Similar setup as test_initialize...
        // Add liquidity tests
        // Remove liquidity tests
    }

    #[test(creator = @${packageInfo.name}, user = @0x123)]
    public fun test_swap(creator: &signer, user: &signer) {
        // Similar setup as test_initialize...
        // Swap tests
    }
}`;

    // Create source and test files
    await fs.writeFile(
      path.join(packageDir, 'sources', 'defi.move'),
      moduleContent
    );

    await fs.writeFile(
      path.join(packageDir, 'tests', 'defi_tests.move'),
      testContent
    );

    // Update Move.toml with DeFi dependencies
    const moveTomlPath = path.join(packageDir, 'Move.toml');
    const moveToml = await fs.readFile(moveTomlPath, 'utf-8');
    const updatedMoveToml = moveToml.replace(
      '[dependencies]',
      `[dependencies]
AptosTokenObjects = { git = "https://github.com/aptos-labs/aptos-core.git", subdir = "aptos-move/framework/aptos-token-objects/", rev = "main" }`
    );
    await fs.writeFile(moveTomlPath, updatedMoveToml);
  }

  private generateReadme(packageInfo: any): string {
    return `# ${packageInfo.name}

${packageInfo.description || 'A Move package for the Aptos blockchain.'}

## Author

${packageInfo.author}

## Getting Started

### Prerequisites

- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- [movr CLI](https://github.com/your-org/movr-cli)

### Building

\`\`\`bash
aptos move compile
\`\`\`

### Testing

\`\`\`bash
aptos move test
\`\`\`

### Publishing

\`\`\`bash
movr publish
\`\`\`

## License

MIT
`;
  }

  private generateGitignore(): string {
    return `# Build outputs
build/
.aptos/

# Dependencies
node_modules/

# Logs
logs/
*.log

# movr
.movr/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
`;
  }
} 