"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
const blockchain_1 = require("../services/blockchain");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
class TipCommand {
    constructor(configService) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.DEVNET);
    }
    async execute(options) {
        try {
            logger_1.logger.info('Sending tip to package publisher', {
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
                logger_1.logger.info(chalk_1.default.green('✓') + ' Tip sent successfully!');
                logger_1.logger.info('Transaction hash:', chalk_1.default.gray(result.transactionHash));
                logger_1.logger.info('Amount:', chalk_1.default.yellow(`${options.amount} APT`));
            }
            else {
                logger_1.logger.error('Failed to send tip', { vmStatus: result.vmStatus });
                throw new Error(`Failed to send tip: ${result.vmStatus}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send tip', { error });
            throw error;
        }
    }
}
exports.TipCommand = TipCommand;
