import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { Network } from '@aptos-labs/ts-sdk';
import { Account } from '@aptos-labs/ts-sdk';
export class WalletCommand {
    config;
    blockchain;
    program;
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new AptosBlockchainService(config.currentNetwork || Network.DEVNET);
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
            logger.error('Failed to execute wallet command', { error });
            throw error;
        }
    }
    async createWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        const account = Account.generate();
        const walletConfig = {
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
    async listWallets() {
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
        logger.info('Wallet details:');
        logger.info(`Name: ${wallet.name}`);
        logger.info(`Address: ${wallet.address}`);
        logger.info(`Sequence Number: ${accountInfo.sequence_number}`);
        logger.info(`Is Default: ${wallet.isDefault}`);
    }
    async removeWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        await this.config.removeWallet(name);
        logger.info('Wallet removed successfully', { name });
    }
    async useWallet(name) {
        if (!name) {
            throw new Error('Wallet name is required');
        }
        await this.config.setDefaultWallet(name);
        logger.info('Default wallet set successfully', { name });
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
        logger.info('Wallet imported successfully', {
            name: walletConfig.name,
            address: walletConfig.address,
        });
    }
}
