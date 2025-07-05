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
      .description('Endorse a Move package')
      .argument('<name>', 'Package name to endorse')
      .option('-v, --version <version>', 'Package version')
      .option('-s, --stake-amount <amount>', 'Amount to stake')
      .option('-c, --comment <comment>', 'Endorsement comment')
      .option('--network <network>', 'Network to use')
      .option('--wallet <name>', 'Wallet to use')
      .action(async (name, options) => {
        await this.execute({ name, ...options });
      });
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
      const packageInfo = await this.blockchain.getPackageMetadata(options.name);
      if (!packageInfo) {
        console.log(chalk.red('✗') + ` Package '${options.name}' not found.`);
        return;
      }

      // Endorse package
      const result = await this.blockchain.endorsePackage(
        account,
        options.name,
        options.version || packageInfo.version
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