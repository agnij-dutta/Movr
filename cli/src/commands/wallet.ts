import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { ConfigService, WalletConfig } from '../services/config.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { Network } from '@aptos-labs/ts-sdk';
import { Account } from '@aptos-labs/ts-sdk';
import { Command } from 'commander';

export interface WalletCommandOptions {
  action: 'create' | 'list' | 'show' | 'remove' | 'use';
  name?: string;
  network?: string;
}

export class WalletCommand {
  private config: ConfigService;
  private blockchain: AptosBlockchainService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.DEVNET
    );

    // Register command with Commander
    this.program = parentProgram
      .command('wallet')
      .description('Manage wallets');

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
  }

  async execute(options: WalletCommandOptions): Promise<void> {
    try {
      switch (options.action) {
        case 'create':
          await this.createWallet(options.name);
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
    logger.info('Wallet created successfully', {
      name: walletConfig.name,
      address: walletConfig.address,
    });

    // Fund the account on testnet/devnet
    const currentNetwork = this.config.getCurrentNetwork();
    if (currentNetwork.name !== 'mainnet') {
      await this.blockchain.fundAccount(walletConfig.address);
    }
  }

  private async listWallets(): Promise<void> {
    const wallets = this.config.getWallets();
    const defaultWallet = this.config.getDefaultWallet();

    if (wallets.length === 0) {
      logger.info('No wallets found');
      return;
    }

    logger.info('Available wallets:');
    for (const wallet of wallets) {
      const isDefault = wallet.name === defaultWallet?.name;
      logger.info(`${isDefault ? chalk.green('*') : ' '} ${wallet.name} (${wallet.address})`);
    }
  }

  private async showWallet(name?: string): Promise<void> {
    let wallet: WalletConfig | null;

    if (name) {
      wallet = this.config.getWallet(name);
      if (!wallet) {
        throw new Error(`Wallet '${name}' not found`);
      }
    } else {
      wallet = this.config.getDefaultWallet();
      if (!wallet) {
        throw new Error('No default wallet found');
      }
    }

    const accountInfo = await this.blockchain.getAccountInfo(wallet.address);

    logger.info('Wallet details:');
    logger.info(`Name: ${wallet.name}`);
    logger.info(`Address: ${wallet.address}`);
    logger.info(`Sequence Number: ${accountInfo.sequence_number}`);
    logger.info(`Is Default: ${wallet.isDefault}`);
  }

  private async removeWallet(name?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }

    await this.config.removeWallet(name);
    logger.info('Wallet removed successfully', { name });
  }

  private async useWallet(name?: string): Promise<void> {
    if (!name) {
      throw new Error('Wallet name is required');
    }

    await this.config.setDefaultWallet(name);
    logger.info('Default wallet set successfully', { name });
  }
} 