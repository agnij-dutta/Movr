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
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.TESTNET);
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
        console.log(chalk_1.default.green('✅ Wallet created successfully!'));
        console.log(chalk_1.default.gray(`Name: ${walletConfig.name}`));
        console.log(chalk_1.default.gray(`Address: ${walletConfig.address}`));
        logger_1.logger.info('Wallet created successfully', {
            name: walletConfig.name,
            address: walletConfig.address,
        });
        // Fund the account on testnet
        const currentNetwork = this.config.getCurrentNetwork();
        if (currentNetwork.name !== 'mainnet') {
            console.log(chalk_1.default.yellow('🔄 Funding wallet on testnet...'));
            try {
                await this.blockchain.fundAccount(walletConfig.address);
                console.log(chalk_1.default.green('✅ Wallet funded successfully!'));
            }
            catch (error) {
                console.log(chalk_1.default.yellow('⚠️  Failed to auto-fund wallet. You may need to fund it manually.'));
                console.log(chalk_1.default.gray(`Fund command: aptos account fund-with-faucet --account ${walletConfig.address}`));
            }
        }
    }
    async listWallets() {
        const wallets = this.config.getWallets();
        const defaultWallet = this.config.getDefaultWallet();
        if (wallets.length === 0) {
            console.log(chalk_1.default.yellow('No wallets found. Create one with: movr wallet create <name>'));
            return;
        }
        console.log(chalk_1.default.cyan('Available wallets:'));
        for (const wallet of wallets) {
            const isDefault = wallet.name === defaultWallet?.name;
            const prefix = isDefault ? chalk_1.default.green('* ') : '  ';
            const status = isDefault ? chalk_1.default.green(' (default)') : '';
            console.log(`${prefix}${chalk_1.default.white(wallet.name)} ${chalk_1.default.gray(`(${wallet.address})`)}${status}`);
        }
    }
    async showWallet(name) {
        let wallet;
        if (name) {
            wallet = this.config.getWallet(name);
            if (!wallet) {
                console.log(chalk_1.default.red(`✗ Wallet '${name}' not found`));
                return;
            }
        }
        else {
            wallet = this.config.getDefaultWallet();
            if (!wallet) {
                console.log(chalk_1.default.red('✗ No default wallet found. Create one with: movr wallet create <name>'));
                return;
            }
        }
        console.log(chalk_1.default.cyan('Wallet Details:'));
        console.log(`  Name: ${chalk_1.default.white(wallet.name)}`);
        console.log(`  Address: ${chalk_1.default.gray(wallet.address)}`);
        console.log(`  Default: ${wallet.isDefault ? chalk_1.default.green('Yes') : chalk_1.default.gray('No')}`);
        console.log(`  Network: ${chalk_1.default.yellow(this.config.getCurrentNetwork().name)}`);
        try {
            const accountInfo = await this.blockchain.getAccountInfo(wallet.address);
            const balance = await this.blockchain.getAccountBalance(wallet.address);
            const aptBalance = this.blockchain.formatToAPT(balance);
            console.log(`  Balance: ${chalk_1.default.green(aptBalance)} APT`);
            console.log(`  Sequence: ${chalk_1.default.gray(accountInfo.sequence_number)}`);
        }
        catch (error) {
            console.log(chalk_1.default.yellow('  ⚠️  Could not fetch account info (account may not exist on-chain)'));
        }
    }
    async removeWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        // Check if wallet exists
        const wallet = this.config.getWallet(name);
        if (!wallet) {
            console.log(chalk_1.default.red(`✗ Wallet '${name}' not found`));
            return;
        }
        await this.config.removeWallet(name);
        console.log(chalk_1.default.green(`✅ Wallet '${name}' removed successfully`));
        logger_1.logger.info('Wallet removed successfully', { name });
    }
    async useWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        // Check if wallet exists
        const wallet = this.config.getWallet(name);
        if (!wallet) {
            console.log(chalk_1.default.red(`✗ Wallet '${name}' not found`));
            return;
        }
        await this.config.setDefaultWallet(name);
        console.log(chalk_1.default.green(`✅ Default wallet set to '${name}'`));
        logger_1.logger.info('Default wallet set successfully', { name });
    }
    async importWallet(name, privateKey) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        if (!privateKey) {
            throw new Error('Private key is required');
        }
        try {
            // Use blockchain service to create account from private key
            const account = this.blockchain.createAccountFromPrivateKey(privateKey);
            const walletConfig = {
                name: name,
                address: account.accountAddress.toString(),
                privateKey: privateKey,
                isDefault: false
            };
            await this.config.addWallet(walletConfig);
            console.log(chalk_1.default.green('✅ Wallet imported successfully!'));
            console.log(chalk_1.default.gray(`Name: ${walletConfig.name}`));
            console.log(chalk_1.default.gray(`Address: ${walletConfig.address}`));
            logger_1.logger.info('Wallet imported successfully', {
                name: walletConfig.name,
                address: walletConfig.address,
            });
        }
        catch (error) {
            console.log(chalk_1.default.red('✗ Failed to import wallet. Please check your private key format.'));
            throw error;
        }
    }
}
exports.WalletCommand = WalletCommand;
