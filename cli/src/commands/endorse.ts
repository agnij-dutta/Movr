import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { ConfigService } from '../services/config.js';
import { Network } from '@aptos-labs/ts-sdk';
import { Command } from 'commander';

export interface EndorseCommandOptions {
  name: string;
  version?: string;
  stakeAmount?: number;
  comment?: string;
  network?: string;
  wallet?: string;
}

export class EndorseCommand {
  private blockchain: AptosBlockchainService;
  private config: ConfigService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.DEVNET
    );

    // Register command with Commander
    this.program = parentProgram
      .command('endorse')
      .description('Endorse a Move package or register as an endorser in movr')
      .argument('[name]', 'Package name to endorse or "register" to register as endorser')
      .argument('[stakeAmount]', 'Amount to stake (required for register)')
      .option('-v, --version <version>', 'Package version')
      .option('-s, --stake-amount <amount>', 'Amount to stake')
      .option('-c, --comment <comment>', 'Endorsement comment')
      .option('--network <network>', 'Network to use')
      .option('--wallet <name>', 'Wallet to use')
      .action(async (name, stakeAmount, options) => {
        if (name === 'register') {
          if (!stakeAmount && !options.stakeAmount) {
            console.log('Usage: endorse register <stakeAmount>');
            return;
          }
          await this.registerEndorserSubcommand(Number(stakeAmount || options.stakeAmount), options);
        } else {
          await this.execute({ name, ...options });
        }
      });
  }

  private async registerEndorserSubcommand(stakeAmount: number, options: any): Promise<void> {
    try {
      logger.info('Registering as endorser', { stakeAmount });
      // Get the current wallet
      const wallet = options.wallet ? 
        this.config.getWallet(options.wallet) : 
        this.config.getDefaultWallet();
      if (!wallet || !wallet.privateKey) {
        console.log('No wallet configured. Please run init first.');
        return;
      }
      const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);
      const result = await this.blockchain.registerEndorser(account, Number(stakeAmount));
      if (result.success) {
        console.log('✓ Registered as endorser successfully!');
        console.log('Transaction hash:', result.transactionHash);
      } else {
        console.log('✗ Failed to register as endorser.');
        if (result.vmStatus) {
          console.log(result.vmStatus);
        }
      }
    } catch (error) {
      logger.error('Failed to register as endorser', { error });
      console.log('✗ Failed to register as endorser.');
      if (error instanceof Error) {
        console.log(error.message);
      }
    }
  }

  async execute(options: EndorseCommandOptions): Promise<void> {
    try {
      logger.info('Endorsing package', { name: options.name });

      // Get the current wallet
      const wallet = options.wallet ? 
        this.config.getWallet(options.wallet) : 
        this.config.getDefaultWallet();

      if (!wallet || !wallet.privateKey) {
        console.log(chalk.red('✗') + ' No wallet configured. Please run init first.');
        return;
      }

      // Create account from private key
      const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);

      // Get package info to get latest version if not specified
      const packageInfo = await this.blockchain.getPackageMetadata(options.name, options.version);
      console.log('DEBUG: getPackageMetadata output:', packageInfo);
      if (!packageInfo) {
        console.log(chalk.red('✗') + ` Package '${options.name}' not found.`);
        return;
      }

      // Debug: print the name and version to be endorsed
      const versionToEndorse = options.version || packageInfo.version;
      console.log('DEBUG: Endorsing package with name:', options.name, 'version:', versionToEndorse);

      // Endorse package
      const result = await this.blockchain.endorsePackage(
        account,
        options.name,
        versionToEndorse
      );

      if (result.success) {
        console.log(chalk.green('✓') + ' Package endorsed successfully!');
        console.log(chalk.gray('Transaction hash:'), chalk.gray(result.transactionHash));
      } else {
        console.log(chalk.red('✗') + ' Failed to endorse package.');
        if (result.vmStatus) {
          console.log(chalk.red(result.vmStatus));
        }
      }
    } catch (error) {
      logger.error('Failed to endorse package', { error });
      console.log(chalk.red('✗') + ' Failed to endorse package.');
      if (error instanceof Error) {
        console.log(chalk.red(error.message));
      }
    }
  }
}

// Temporary debug: print getPackageMetadata output if run with --debug-metadata
if (process.argv.includes('--debug-metadata')) {
  (async () => {
    const { ConfigService } = await import('../services/config.js');
    const config = new ConfigService();
    const blockchain = new AptosBlockchainService();
    const result = await blockchain.getPackageMetadata('demo_package');
    console.log('DEBUG: getPackageMetadata output for demo_package:', result);
  })();
} 