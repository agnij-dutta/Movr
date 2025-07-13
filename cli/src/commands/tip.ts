import chalk from 'chalk';
import { logger } from '../utils/logger';
import { AptosBlockchainService } from '../services/blockchain';
import { ConfigService } from '../services/config';
import { Network } from '@aptos-labs/ts-sdk';

export interface TipCommandOptions {
  name: string;
  version?: string;
  amount: number;
  message?: string;
  network?: string;
  wallet?: string;
}

export class TipCommand {
  private blockchain: AptosBlockchainService;
  private config: ConfigService;

  constructor(configService: ConfigService) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.TESTNET
    );
  }

  async execute(options: TipCommandOptions): Promise<void> {
    try {
      console.log(chalk.gray(`💰 Sending tip to package '${options.name}'...`));
      
      logger.info('Sending tip to package publisher', { 
        name: options.name,
        amount: options.amount
      });

      // Get the current wallet
      const wallet = options.wallet ? 
        this.config.getWallet(options.wallet) : 
        this.config.getDefaultWallet();

      if (!wallet || !wallet.privateKey) {
        console.log(chalk.red('✗ No wallet configured'));
        console.log(chalk.gray('   Run "movr wallet create <name>" to create a wallet first'));
        return;
      }

      console.log(chalk.gray(`💳 Using wallet: ${wallet.name} (${wallet.address})`));

      // Create account from private key
      const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);

      // Get package info to get latest version if not specified
      console.log(chalk.gray('🔍 Fetching package information...'));
      const packageInfo = await this.blockchain.getPackageMetadata(options.name);
      if (!packageInfo) {
        console.log(chalk.red(`✗ Package '${options.name}' not found`));
        console.log(chalk.gray('   Use "movr search" to find available packages'));
        return;
      }

      const version = options.version || packageInfo.version;
      console.log(chalk.green(`✅ Found package: ${packageInfo.name} v${version}`));

      // Check balance
      const balance = await this.blockchain.getAccountBalance(account.accountAddress.toString());
      const tipAmount = options.amount * 100000000; // Convert APT to octas (1 APT = 100000000 octas)
      const balanceInAPT = this.blockchain.formatToAPT(balance);
      
      console.log(chalk.gray(`💰 Current balance: ${balanceInAPT} APT`));
      console.log(chalk.gray(`💸 Tip amount: ${options.amount} APT`));
      
      if (balance < tipAmount) {
        console.log(chalk.red('✗ Insufficient balance for tip'));
        console.log(chalk.gray(`   You need at least ${options.amount} APT to send this tip`));
        return;
      }

      // Send tip
      console.log(chalk.gray('📤 Sending tip transaction...'));
      const result = await this.blockchain.tipPackage(
        account,
        options.name,
        version,
        options.amount
      );

      if (result.success) {
        console.log(chalk.green('✅ Tip sent successfully!'));
        console.log(chalk.gray(`   Transaction hash: ${result.transactionHash}`));
        console.log(chalk.gray(`   Amount: ${options.amount} APT`));
        console.log(chalk.gray(`   Package: ${options.name} v${version}`));
      } else {
        console.log(chalk.red('✗ Failed to send tip'));
        if (result.vmStatus) {
          console.log(chalk.gray(`   ${result.vmStatus}`));
        }
        logger.error('Failed to send tip', { vmStatus: result.vmStatus });
      }
    } catch (error) {
      console.log(chalk.red(`✗ Failed to send tip to '${options.name}'`));
      logger.error('Failed to send tip', { error });
      if (error instanceof Error) {
        console.log(chalk.gray(`   ${error.message}`));
      }
    }
  }
} 