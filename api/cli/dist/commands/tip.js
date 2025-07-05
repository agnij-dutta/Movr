import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { Network } from '@aptos-labs/ts-sdk';
export class TipCommand {
    blockchain;
    config;
    constructor(configService) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new AptosBlockchainService(config.currentNetwork || Network.DEVNET);
    }
    async execute(options) {
        try {
            logger.info('Sending tip to package publisher', {
                name: options.name,
                amount: options.amount
            });
            // Get the current wallet
            const wallet = options.wallet ?
                this.config.getWallet(options.wallet) :
                this.config.getDefaultWallet();
            if (!wallet || !wallet.privateKey) {
                throw new Error('No wallet configured. Please run init first.');
            }
            // Create account from private key
            const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);
            // Get package info to get latest version if not specified
            const packageInfo = await this.blockchain.getPackageMetadata(options.name);
            if (!packageInfo) {
                throw new Error(`Package ${options.name} not found`);
            }
            // Send tip
            const result = await this.blockchain.tipPackage(account, options.name, options.version || packageInfo.version, options.amount);
            if (result.success) {
                logger.info(chalk.green('✓') + ' Tip sent successfully!');
                logger.info('Transaction hash:', chalk.gray(result.transactionHash));
                logger.info('Amount:', chalk.yellow(`${options.amount} APT`));
            }
            else {
                logger.error('Failed to send tip', { vmStatus: result.vmStatus });
                throw new Error(`Failed to send tip: ${result.vmStatus}`);
            }
        }
        catch (error) {
            logger.error('Failed to send tip', { error });
            throw error;
        }
    }
}
