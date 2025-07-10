"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class ConfigService {
    constructor(configPath) {
        this.configPath = configPath || this.getDefaultConfigPath();
        this.config = this.getDefaultConfig();
    }
    /**
     * Initialize the configuration service
     */
    async initialize() {
        try {
            await this.loadConfig();
            logger_1.logger.debug('Configuration service initialized', {
                configPath: this.configPath,
                network: this.config.currentNetwork,
            });
        }
        catch (error) {
            logger_1.logger.warn('Failed to load configuration, using defaults', { error });
            await this.saveConfig();
        }
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get current network configuration
     */
    getCurrentNetwork() {
        const networkName = this.config.currentNetwork;
        const network = this.config.networks[networkName];
        if (!network) {
            throw (0, errors_1.createConfigError)(`Network '${networkName}' not found in configuration`);
        }
        return network;
    }
    /**
     * Set current network
     */
    async setCurrentNetwork(networkName) {
        if (!this.config.networks[networkName]) {
            throw (0, errors_1.createConfigError)(`Network '${networkName}' not found`);
        }
        this.config.currentNetwork = networkName;
        await this.saveConfig();
        logger_1.logger.info('Current network changed', { network: networkName });
    }
    /**
     * Add or update network configuration
     */
    async setNetwork(name, config) {
        this.config.networks[name] = config;
        await this.saveConfig();
        logger_1.logger.info('Network configuration updated', { name, url: config.url });
    }
    /**
     * Get IPFS configuration
     */
    getIPFSConfig() {
        return { ...this.config.ipfs };
    }
    /**
     * Set IPFS configuration
     */
    async setIPFSConfig(config) {
        this.config.ipfs = config;
        await this.saveConfig();
        logger_1.logger.info('IPFS configuration updated', {
            gatewayUrl: config.gatewayUrl,
        });
    }
    /**
     * Get all wallets
     */
    getWallets() {
        return [...this.config.wallets];
    }
    /**
     * Get default wallet
     */
    getDefaultWallet() {
        if (this.config.defaultWallet) {
            const wallet = this.config.wallets.find(w => w.name === this.config.defaultWallet);
            if (wallet) {
                return { ...wallet };
            }
        }
        const defaultWallet = this.config.wallets.find(w => w.isDefault);
        return defaultWallet ? { ...defaultWallet } : null;
    }
    /**
     * Get wallet by name
     */
    getWallet(name) {
        const wallet = this.config.wallets.find(w => w.name === name);
        return wallet ? { ...wallet } : null;
    }
    /**
     * Add a new wallet
     */
    async addWallet(wallet) {
        // Check if wallet name already exists
        const existingWallet = this.config.wallets.find(w => w.name === wallet.name);
        if (existingWallet) {
            throw (0, errors_1.createConfigError)(`Wallet '${wallet.name}' already exists`);
        }
        // If this is the first wallet or marked as default, make it default
        if (this.config.wallets.length === 0 || wallet.isDefault) {
            // Remove default flag from other wallets
            this.config.wallets.forEach(w => w.isDefault = false);
            wallet.isDefault = true;
            this.config.defaultWallet = wallet.name;
        }
        this.config.wallets.push(wallet);
        await this.saveConfig();
        logger_1.logger.info('Wallet added', {
            name: wallet.name,
            address: wallet.address,
            isDefault: wallet.isDefault,
        });
    }
    /**
     * Remove a wallet
     */
    async removeWallet(name) {
        const index = this.config.wallets.findIndex(w => w.name === name);
        if (index === -1) {
            throw (0, errors_1.createConfigError)(`Wallet '${name}' not found`);
        }
        const removedWallet = this.config.wallets[index];
        this.config.wallets.splice(index, 1);
        // If we removed the default wallet, set another as default
        if (removedWallet && removedWallet.isDefault && this.config.wallets.length > 0) {
            if (this.config.wallets[0]) {
                this.config.wallets[0].isDefault = true;
                this.config.defaultWallet = this.config.wallets[0].name;
            }
        }
        else if (this.config.wallets.length === 0) {
            this.config.defaultWallet = undefined;
        }
        await this.saveConfig();
        logger_1.logger.info('Wallet removed', { name });
    }
    /**
     * Set default wallet
     */
    async setDefaultWallet(name) {
        const wallet = this.config.wallets.find(w => w.name === name);
        if (!wallet) {
            throw (0, errors_1.createConfigError)(`Wallet '${name}' not found`);
        }
        // Remove default flag from all wallets
        this.config.wallets.forEach(w => w.isDefault = false);
        // Set new default
        wallet.isDefault = true;
        this.config.defaultWallet = name;
        await this.saveConfig();
        logger_1.logger.info('Default wallet changed', { name });
    }
    /**
     * Get registry contract address for current network
     */
    getRegistryContract() {
        const network = this.getCurrentNetwork();
        return network.contractAddress || this.config.registryContract;
    }
    /**
     * Load configuration from file
     */
    async loadConfig() {
        try {
            if (await fs_extra_1.default.pathExists(this.configPath)) {
                const configData = await fs_extra_1.default.readJSON(this.configPath);
                this.config = { ...this.getDefaultConfig(), ...configData };
                // Validate required fields
                this.validateConfig();
                logger_1.logger.debug('Configuration loaded', { configPath: this.configPath });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load configuration', { configPath: this.configPath, error });
            throw (0, errors_1.createFileSystemError)(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Save configuration to file
     */
    async saveConfig() {
        try {
            await fs_extra_1.default.ensureDir(path_1.default.dirname(this.configPath));
            await fs_extra_1.default.writeJSON(this.configPath, this.config, { spaces: 2 });
            logger_1.logger.debug('Configuration saved', { configPath: this.configPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to save configuration', { configPath: this.configPath, error });
            throw (0, errors_1.createFileSystemError)(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get default configuration path
     */
    getDefaultConfigPath() {
        const homeDir = os_1.default.homedir();
        return path_1.default.join(homeDir, '.apm', 'config.json');
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            version: '1.0.0',
            currentNetwork: 'testnet',
            networks: {
                devnet: {
                    name: 'devnet',
                    url: 'https://fullnode.devnet.aptoslabs.com/v1',
                    contractAddress: '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34',
                },
                testnet: {
                    name: 'testnet',
                    url: 'https://fullnode.testnet.aptoslabs.com/v1',
                    contractAddress: '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34',
                },
                mainnet: {
                    name: 'mainnet',
                    url: 'https://fullnode.mainnet.aptoslabs.com/v1',
                    contractAddress: '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34',
                },
            },
            ipfs: {
                apiKey: process.env.PINATA_API_KEY || '',
                secretKey: process.env.PINATA_SECRET_KEY || '',
                gatewayUrl: process.env.PINATA_GATEWAY_URL || '',
                jwt: process.env.PINATA_JWT || '', // Add JWT from env
            },
            wallets: [],
            registryContract: '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34',
        };
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        if (!this.config.version) {
            throw (0, errors_1.createConfigError)('Configuration missing version');
        }
        if (!this.config.currentNetwork) {
            throw (0, errors_1.createConfigError)('Configuration missing current network');
        }
        if (!this.config.networks || Object.keys(this.config.networks).length === 0) {
            throw (0, errors_1.createConfigError)('Configuration missing network definitions');
        }
        if (!this.config.ipfs) {
            throw (0, errors_1.createConfigError)('Configuration missing IPFS settings');
        }
        const currentNetwork = this.config.networks[this.config.currentNetwork];
        if (!currentNetwork) {
            throw (0, errors_1.createConfigError)(`Current network '${this.config.currentNetwork}' not defined`);
        }
    }
}
exports.ConfigService = ConfigService;
