import chalk from 'chalk';
import { logger } from '../utils/logger';
import { ConfigService, WalletConfig } from '../services/config';
import { AptosBlockchainService } from '../services/blockchain';
import { Network } from '@aptos-labs/ts-sdk';
import { Account } from '@aptos-labs/ts-sdk';
import { Command } from 'commander';

export interface WalletCommandOptions {
  action: 'create' | 'list' | 'show' | 'remove' | 'use' | 'import';
  name?: string;
  network?: string;
  privateKey?: string;
}

export class WalletCommand {
  private config: ConfigService;
  private blockchain: AptosBlockchainService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.TESTNET
    );

    // Register command with Commander
    this.program = parentProgram
      .command('wallet')
      .description('Manage wallets for movr');

    this.program
      .command('create')
      .description('Create a new wallet')
      .argument('<name>', 'Wallet name')
      .action(async (name) => {
        await this.execute({ action: 'create', name });
      });

    this.program
      .command('list')
      .description('List all wallets')
      .action(async () => {
        await this.execute({ action: 'list' });
      });

    this.program
      .command('show')
      .description('Show wallet details')
      .argument('[name]', 'Wallet name')
      .action(async (name) => {
        await this.execute({ action: 'show', name });
      });

    this.program
      .command('remove')
      .description('Remove a wallet')
      .argument('<name>', 'Wallet name')
      .action(async (name) => {
        await this.execute({ action: 'remove', name });
      });

    this.program
      .command('use')
      .description('Set default wallet')
      .argument('<name>', 'Wallet name')
      .action(async (name) => {
        await this.execute({ action: 'use', name });
      });

    this.program
      .command('import')
      .description('Import a wallet from a private key')
      .argument('<name>', 'Wallet name')
      .requiredOption('--private-key <privateKey>', 'Private key to import')
      .action(async (name, options) => {
        await this.execute({ action: 'import', name, privateKey: options.privateKey });
      });
  }

  async execute(options: WalletCommandOptions): Promise<void> {
    try {
      switch (options.action) {
        case 'create':
          await this.createWallet(options.name);
          break;
        case 'import':
          await this.importWallet(options.name, options.privateKey);
          break;
        case 'list':
          await this.listWallets();
          break;
        case 'show':
          await this.showWallet(options.name);
          break;
        case 'remove':
          await this.removeWallet(options.name);
          break;
        case 'use':
          await this.useWallet(options.name);
          break;
        default:
          throw new Error(`Invalid action: ${options.action}`);
      }
    } catch (error) {
      logger.error('Failed to execute wallet command', { error });
      throw error;
    }
  }

  private async createWallet(name?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }

    const account = Account.generate();
    const walletConfig: WalletConfig = {
      name: name,
      address: account.accountAddress.toString(),
      privateKey: account.privateKey.toString(),
      isDefault: false
    };

    await this.config.addWallet(walletConfig);
    
    console.log(chalk.green('✅ Wallet created successfully!'));
    console.log(chalk.gray(`Name: ${walletConfig.name}`));
    console.log(chalk.gray(`Address: ${walletConfig.address}`));
    
    logger.info('Wallet created successfully', {
      name: walletConfig.name,
      address: walletConfig.address,
    });

    // Fund the account on testnet
    const currentNetwork = this.config.getCurrentNetwork();
    if (currentNetwork.name !== 'mainnet') {
      console.log(chalk.yellow('🔄 Funding wallet on testnet...'));
      try {
        await this.blockchain.fundAccount(walletConfig.address);
        console.log(chalk.green('✅ Wallet funded successfully!'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Failed to auto-fund wallet. You may need to fund it manually.'));
        console.log(chalk.gray(`Fund command: aptos account fund-with-faucet --account ${walletConfig.address}`));
      }
    }
  }

  private async listWallets(): Promise<void> {
    const wallets = this.config.getWallets();
    const defaultWallet = this.config.getDefaultWallet();

    if (wallets.length === 0) {
      console.log(chalk.yellow('No wallets found. Create one with: movr wallet create <name>'));
      return;
    }

    console.log(chalk.cyan('Available wallets:'));
    for (const wallet of wallets) {
      const isDefault = wallet.name === defaultWallet?.name;
      const prefix = isDefault ? chalk.green('* ') : '  ';
      const status = isDefault ? chalk.green(' (default)') : '';
      console.log(`${prefix}${chalk.white(wallet.name)} ${chalk.gray(`(${wallet.address})`)}${status}`);
    }
  }

  private async showWallet(name?: string): Promise<void> {
    let wallet: WalletConfig | null;

    if (name) {
      wallet = this.config.getWallet(name);
      if (!wallet) {
        console.log(chalk.red(`✗ Wallet '${name}' not found`));
        return;
      }
    } else {
      wallet = this.config.getDefaultWallet();
      if (!wallet) {
        console.log(chalk.red('✗ No default wallet found. Create one with: movr wallet create <name>'));
        return;
      }
    }

    console.log(chalk.cyan('Wallet Details:'));
    console.log(`  Name: ${chalk.white(wallet.name)}`);
    console.log(`  Address: ${chalk.gray(wallet.address)}`);
    console.log(`  Default: ${wallet.isDefault ? chalk.green('Yes') : chalk.gray('No')}`);
    console.log(`  Network: ${chalk.yellow(this.config.getCurrentNetwork().name)}`);

    try {
      const accountInfo = await this.blockchain.getAccountInfo(wallet.address);
      const balance = await this.blockchain.getAccountBalance(wallet.address);
      const aptBalance = this.blockchain.formatToAPT(balance);
      
      console.log(`  Balance: ${chalk.green(aptBalance)} APT`);
      console.log(`  Sequence: ${chalk.gray(accountInfo.sequence_number)}`);
    } catch (error) {
      console.log(chalk.yellow('  ⚠️  Could not fetch account info (account may not exist on-chain)'));
    }
  }

  private async removeWallet(name?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }

    // Check if wallet exists
    const wallet = this.config.getWallet(name);
    if (!wallet) {
      console.log(chalk.red(`✗ Wallet '${name}' not found`));
      return;
    }

    await this.config.removeWallet(name);
    console.log(chalk.green(`✅ Wallet '${name}' removed successfully`));
    
    logger.info('Wallet removed successfully', { name });
  }

  private async useWallet(name?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }

    // Check if wallet exists
    const wallet = this.config.getWallet(name);
    if (!wallet) {
      console.log(chalk.red(`✗ Wallet '${name}' not found`));
      return;
    }

    await this.config.setDefaultWallet(name);
    console.log(chalk.green(`✅ Default wallet set to '${name}'`));
    
    logger.info('Default wallet set successfully', { name });
  }

  private async importWallet(name?: string, privateKey?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }
    if (!privateKey) {
      throw new Error('Private key is required');
    }
    
    try {
      // Use blockchain service to create account from private key
      const account = this.blockchain.createAccountFromPrivateKey(privateKey);
      const walletConfig: WalletConfig = {
        name: name,
        address: account.accountAddress.toString(),
        privateKey: privateKey,
        isDefault: false
      };
      
      await this.config.addWallet(walletConfig);
      
      console.log(chalk.green('✅ Wallet imported successfully!'));
      console.log(chalk.gray(`Name: ${walletConfig.name}`));
      console.log(chalk.gray(`Address: ${walletConfig.address}`));
      
      logger.info('Wallet imported successfully', {
        name: walletConfig.name,
        address: walletConfig.address,
      });
    } catch (error) {
      console.log(chalk.red('✗ Failed to import wallet. Please check your private key format.'));
      throw error;
    }
  }
} 