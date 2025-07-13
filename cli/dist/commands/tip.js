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
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.TESTNET);
    }
    async execute(options) {
        try {
            console.log(chalk_1.default.gray(`💰 Sending tip to package '${options.name}'...`));
            logger_1.logger.info('Sending tip to package publisher', {
                name: options.name,
                amount: options.amount
            });
            // Get the current wallet
            const wallet = options.wallet ?
                this.config.getWallet(options.wallet) :
                this.config.getDefaultWallet();
            if (!wallet || !wallet.privateKey) {
                console.log(chalk_1.default.red('✗ No wallet configured'));
                console.log(chalk_1.default.gray('   Run "movr wallet create <name>" to create a wallet first'));
                return;
            }
            console.log(chalk_1.default.gray(`💳 Using wallet: ${wallet.name} (${wallet.address})`));
            // Create account from private key
            const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);
            // Get package info to get latest version if not specified
            console.log(chalk_1.default.gray('🔍 Fetching package information...'));
            const packageInfo = await this.blockchain.getPackageMetadata(options.name);
            if (!packageInfo) {
                console.log(chalk_1.default.red(`✗ Package '${options.name}' not found`));
                console.log(chalk_1.default.gray('   Use "movr search" to find available packages'));
                return;
            }
            const version = options.version || packageInfo.version;
            console.log(chalk_1.default.green(`✅ Found package: ${packageInfo.name} v${version}`));
            // Check balance
            const balance = await this.blockchain.getAccountBalance(account.accountAddress.toString());
            const tipAmount = options.amount * 100000000; // Convert APT to octas (1 APT = 100000000 octas)
            const balanceInAPT = this.blockchain.formatToAPT(balance);
            console.log(chalk_1.default.gray(`💰 Current balance: ${balanceInAPT} APT`));
            console.log(chalk_1.default.gray(`💸 Tip amount: ${options.amount} APT`));
            if (balance < tipAmount) {
                console.log(chalk_1.default.red('✗ Insufficient balance for tip'));
                console.log(chalk_1.default.gray(`   You need at least ${options.amount} APT to send this tip`));
                return;
            }
            // Send tip
            console.log(chalk_1.default.gray('📤 Sending tip transaction...'));
            const result = await this.blockchain.tipPackage(account, options.name, version, options.amount);
            if (result.success) {
                console.log(chalk_1.default.green('✅ Tip sent successfully!'));
                console.log(chalk_1.default.gray(`   Transaction hash: ${result.transactionHash}`));
                console.log(chalk_1.default.gray(`   Amount: ${options.amount} APT`));
                console.log(chalk_1.default.gray(`   Package: ${options.name} v${version}`));
            }
            else {
                console.log(chalk_1.default.red('✗ Failed to send tip'));
                if (result.vmStatus) {
                    console.log(chalk_1.default.gray(`   ${result.vmStatus}`));
                }
                logger_1.logger.error('Failed to send tip', { vmStatus: result.vmStatus });
            }
        }
        catch (error) {
            console.log(chalk_1.default.red(`✗ Failed to send tip to '${options.name}'`));
            logger_1.logger.error('Failed to send tip', { error });
            if (error instanceof Error) {
                console.log(chalk_1.default.gray(`   ${error.message}`));
            }
        }
    }
}
exports.TipCommand = TipCommand;
