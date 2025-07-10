"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
const blockchain_1 = require("../services/blockchain");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const ts_sdk_2 = require("@aptos-labs/ts-sdk");
class WalletCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.DEVNET);
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
    async execute(options) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to execute wallet command', { error });
            throw error;
        }
    }
    async createWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        const account = ts_sdk_2.Account.generate();
        const walletConfig = {
            name: name,
            address: account.accountAddress.toString(),
            privateKey: account.privateKey.toString(),
            isDefault: false
        };
        await this.config.addWallet(walletConfig);
        logger_1.logger.info('Wallet created successfully', {
            name: walletConfig.name,
            address: walletConfig.address,
        });
        // Fund the account on testnet/devnet
        const currentNetwork = this.config.getCurrentNetwork();
        if (currentNetwork.name !== 'mainnet') {
            await this.blockchain.fundAccount(walletConfig.address);
        }
    }
    async listWallets() {
        const wallets = this.config.getWallets();
        const defaultWallet = this.config.getDefaultWallet();
        if (wallets.length === 0) {
            logger_1.logger.info('No wallets found');
            return;
        }
        logger_1.logger.info('Available wallets:');
        for (const wallet of wallets) {
            const isDefault = wallet.name === defaultWallet?.name;
            logger_1.logger.info(`${isDefault ? chalk_1.default.green('*') : ' '} ${wallet.name} (${wallet.address})`);
        }
    }
    async showWallet(name) {
        let wallet;
        if (name) {
            wallet = this.config.getWallet(name);
            if (!wallet) {
                throw new Error(`Wallet '${name}' not found`);
            }
        }
        else {
            wallet = this.config.getDefaultWallet();
            if (!wallet) {
                throw new Error('No default wallet found');
            }
        }
        const accountInfo = await this.blockchain.getAccountInfo(wallet.address);
        logger_1.logger.info('Wallet details:');
        logger_1.logger.info(`Name: ${wallet.name}`);
        logger_1.logger.info(`Address: ${wallet.address}`);
        logger_1.logger.info(`Sequence Number: ${accountInfo.sequence_number}`);
        logger_1.logger.info(`Is Default: ${wallet.isDefault}`);
    }
    async removeWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        await this.config.removeWallet(name);
        logger_1.logger.info('Wallet removed successfully', { name });
    }
    async useWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        await this.config.setDefaultWallet(name);
        logger_1.logger.info('Default wallet set successfully', { name });
    }
    async importWallet(name, privateKey) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        if (!privateKey) {
            throw new Error('Private key is required');
        }
        // Use blockchain service to create account from private key
        const account = this.blockchain.createAccountFromPrivateKey(privateKey);
        const walletConfig = {
            name: name,
            address: account.accountAddress.toString(),
            privateKey: privateKey,
            isDefault: false
        };
        await this.config.addWallet(walletConfig);
        logger_1.logger.info('Wallet imported successfully', {
            name: walletConfig.name,
            address: walletConfig.address,
        });
    }
}
exports.WalletCommand = WalletCommand;
