"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndorseCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
const blockchain_1 = require("../services/blockchain");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const readline = __importStar(require("readline"));
class EndorseCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.DEVNET);
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
            }
            else {
                await this.execute({ name, ...options });
            }
        });
    }
    async registerEndorserSubcommand(stakeAmount, options) {
        try {
            logger_1.logger.info('Registering as endorser', { stakeAmount });
            // Get the current wallet
            const wallet = options.wallet ?
                this.config.getWallet(options.wallet) :
                this.config.getDefaultWallet();
            if (!wallet || !wallet.privateKey) {
                console.log('No wallet configured. Please run init first.');
                return;
            }
            const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);
            // Check balance and warn about fees
            const balance = await this.blockchain.getAccountBalance(account.accountAddress.toString());
            const totalCost = blockchain_1.PLATFORM_ENDORSER_FEE + (stakeAmount * 100000000); // Convert stake to octas
            const feeInAPT = this.blockchain.formatToAPT(blockchain_1.PLATFORM_ENDORSER_FEE);
            const stakeInAPT = this.blockchain.formatToAPT(stakeAmount * 100000000);
            const totalInAPT = this.blockchain.formatToAPT(totalCost);
            const balanceInAPT = this.blockchain.formatToAPT(balance);
            console.log(chalk_1.default.yellow(`\n📋 Endorser Registration Fee Information:`));
            console.log(chalk_1.default.yellow(`   Registration fee: ${feeInAPT} APT`));
            console.log(chalk_1.default.yellow(`   Stake amount: ${stakeInAPT} APT`));
            console.log(chalk_1.default.yellow(`   Total cost: ${totalInAPT} APT`));
            console.log(chalk_1.default.yellow(`   Your balance: ${balanceInAPT} APT`));
            if (balance < totalCost) {
                console.log(chalk_1.default.red(`\n❌ Insufficient balance! You need at least ${totalInAPT} APT to register as endorser.`));
                if (this.config.getConfig().currentNetwork !== 'mainnet') {
                    console.log(chalk_1.default.gray(`   💡 Fund your account: aptos account fund-with-faucet --account ${account.accountAddress}`));
                }
                return;
            }
            // Ask for confirmation
            const confirmed = await this.askForConfirmation(`\n💰 Endorser registration will cost ${totalInAPT} APT (${feeInAPT} fee + ${stakeInAPT} stake). Continue? (y/N): `);
            if (!confirmed) {
                console.log(chalk_1.default.gray('Endorser registration cancelled.'));
                return;
            }
            const result = await this.blockchain.registerEndorser(account, Number(stakeAmount));
            if (result.success) {
                console.log('✓ Registered as endorser successfully!');
                console.log('Transaction hash:', result.transactionHash);
            }
            else {
                console.log('✗ Failed to register as endorser.');
                if (result.vmStatus) {
                    console.log(result.vmStatus);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to register as endorser', { error });
            console.log('✗ Failed to register as endorser.');
            if (error instanceof Error) {
                console.log(error.message);
            }
        }
    }
    async execute(options) {
        try {
            logger_1.logger.info('Endorsing package', { name: options.name });
            // Get the current wallet
            const wallet = options.wallet ?
                this.config.getWallet(options.wallet) :
                this.config.getDefaultWallet();
            if (!wallet || !wallet.privateKey) {
                console.log(chalk_1.default.red('✗') + ' No wallet configured. Please run init first.');
                return;
            }
            // Create account from private key
            const account = this.blockchain.createAccountFromPrivateKey(wallet.privateKey);
            // Get package info to get latest version if not specified
            const packageInfo = await this.blockchain.getPackageMetadata(options.name, options.version);
            if (!packageInfo) {
                console.log(chalk_1.default.red('✗') + ` Package '${options.name}' not found.`);
                return;
            }
            // Endorse package
            const versionToEndorse = options.version || packageInfo.version;
            const result = await this.blockchain.endorsePackage(account, options.name, versionToEndorse);
            if (result.success) {
                console.log(chalk_1.default.green('✓') + ' Package endorsed successfully!');
                console.log(chalk_1.default.gray('Transaction hash:'), chalk_1.default.gray(result.transactionHash));
            }
            else {
                console.log(chalk_1.default.red('✗') + ' Failed to endorse package.');
                if (result.vmStatus) {
                    console.log(chalk_1.default.red(result.vmStatus));
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to endorse package', { error });
            console.log(chalk_1.default.red('✗') + ' Failed to endorse package.');
            if (error instanceof Error) {
                console.log(chalk_1.default.red(error.message));
            }
        }
    }
    async askForConfirmation(question) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
            });
        });
    }
}
exports.EndorseCommand = EndorseCommand;
// Temporary debug: print getPackageMetadata output if run with --debug-metadata
if (process.argv.includes('--debug-metadata')) {
    (async () => {
        const { ConfigService } = require('../services/config');
        const config = new ConfigService();
        const blockchain = new blockchain_1.AptosBlockchainService();
        const result = await blockchain.getPackageMetadata('demo_package');
        console.log('DEBUG: getPackageMetadata output for demo_package:', result);
    })();
}
