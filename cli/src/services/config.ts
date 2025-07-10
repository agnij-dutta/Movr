import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { logger } from '../utils/logger';
import { createConfigError, createFileSystemError } from '../utils/errors';

export interface WalletConfig {
  name: string;
  address: string;
  privateKey?: string; // encrypted
  isDefault: boolean;
}

export interface NetworkConfig {
  name: string;
  url: string;
  contractAddress?: string;
}

export interface IPFSConfig {
  apiKey: string;
  secretKey: string;
  gatewayUrl: string;
  jwt?: string; // Add JWT support
}

export interface APMConfig {
  version: string;
  currentNetwork: string;
  networks: Record<string, NetworkConfig>;
  ipfs: IPFSConfig;
  wallets: WalletConfig[];
  defaultWallet?: string;
  registryContract: string;
}

export class ConfigService {
  private configPath: string;
  private config: APMConfig;
  
  constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize the configuration service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig();
      logger.debug('Configuration service initialized', {
        configPath: this.configPath,
        network: this.config.currentNetwork,
      });
    } catch (error) {
      logger.warn('Failed to load configuration, using defaults', { error });
      await this.saveConfig();
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): APMConfig {
    return { ...this.config };
  }

  /**
   * Get current network configuration
   */
  getCurrentNetwork(): NetworkConfig {
    const networkName = this.config.currentNetwork;
    const network = this.config.networks[networkName];
    
    if (!network) {
      throw createConfigError(`Network '${networkName}' not found in configuration`);
    }
    
    return network;
  }

  /**
   * Set current network
   */
  async setCurrentNetwork(networkName: string): Promise<void> {
    if (!this.config.networks[networkName]) {
      throw createConfigError(`Network '${networkName}' not found`);
    }
    
    this.config.currentNetwork = networkName;
    await this.saveConfig();
    
    logger.info('Current network changed', { network: networkName });
  }

  /**
   * Add or update network configuration
   */
  async setNetwork(name: string, config: NetworkConfig): Promise<void> {
    this.config.networks[name] = config;
    await this.saveConfig();
    
    logger.info('Network configuration updated', { name, url: config.url });
  }

  /**
   * Get IPFS configuration
   */
  getIPFSConfig(): IPFSConfig {
    return { ...this.config.ipfs };
  }

  /**
   * Set IPFS configuration
   */
  async setIPFSConfig(config: IPFSConfig): Promise<void> {
    this.config.ipfs = config;
    await this.saveConfig();
    
    logger.info('IPFS configuration updated', {
      gatewayUrl: config.gatewayUrl,
    });
  }

  /**
   * Get all wallets
   */
  getWallets(): WalletConfig[] {
    return [...this.config.wallets];
  }

  /**
   * Get default wallet
   */
  getDefaultWallet(): WalletConfig | null {
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
  getWallet(name: string): WalletConfig | null {
    const wallet = this.config.wallets.find(w => w.name === name);
    return wallet ? { ...wallet } : null;
  }

  /**
   * Add a new wallet
   */
  async addWallet(wallet: WalletConfig): Promise<void> {
    // Check if wallet name already exists
    const existingWallet = this.config.wallets.find(w => w.name === wallet.name);
    if (existingWallet) {
      throw createConfigError(`Wallet '${wallet.name}' already exists`);
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
    
    logger.info('Wallet added', {
      name: wallet.name,
      address: wallet.address,
      isDefault: wallet.isDefault,
    });
  }

  /**
   * Remove a wallet
   */
  async removeWallet(name: string): Promise<void> {
    const index = this.config.wallets.findIndex(w => w.name === name);
    if (index === -1) {
      throw createConfigError(`Wallet '${name}' not found`);
    }

    const removedWallet = this.config.wallets[index];
    this.config.wallets.splice(index, 1);

    // If we removed the default wallet, set another as default
    if (removedWallet && removedWallet.isDefault && this.config.wallets.length > 0) {
      if (this.config.wallets[0]) {
        this.config.wallets[0].isDefault = true;
        this.config.defaultWallet = this.config.wallets[0].name;
      }
    } else if (this.config.wallets.length === 0) {
      this.config.defaultWallet = undefined;
    }

    await this.saveConfig();
    
    logger.info('Wallet removed', { name });
  }

  /**
   * Set default wallet
   */
  async setDefaultWallet(name: string): Promise<void> {
    const wallet = this.config.wallets.find(w => w.name === name);
    if (!wallet) {
      throw createConfigError(`Wallet '${name}' not found`);
    }

    // Remove default flag from all wallets
    this.config.wallets.forEach(w => w.isDefault = false);
    
    // Set new default
    wallet.isDefault = true;
    this.config.defaultWallet = name;
    
    await this.saveConfig();
    
    logger.info('Default wallet changed', { name });
  }

  /**
   * Get registry contract address for current network
   */
  getRegistryContract(): string {
    const network = this.getCurrentNetwork();
    return network.contractAddress || this.config.registryContract;
  }

  /**
   * Load configuration from file
   */
  private async loadConfig(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJSON(this.configPath);
        this.config = { ...this.getDefaultConfig(), ...configData };
        
        // Validate required fields
        this.validateConfig();
        
        logger.debug('Configuration loaded', { configPath: this.configPath });
      }
    } catch (error) {
      logger.error('Failed to load configuration', { configPath: this.configPath, error });
      throw createFileSystemError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save configuration to file
   */
  private async saveConfig(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJSON(this.configPath, this.config, { spaces: 2 });
      
      logger.debug('Configuration saved', { configPath: this.configPath });
    } catch (error) {
      logger.error('Failed to save configuration', { configPath: this.configPath, error });
      throw createFileSystemError(
        `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get default configuration path
   */
  private getDefaultConfigPath(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.apm', 'config.json');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): APMConfig {
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
  private validateConfig(): void {
    if (!this.config.version) {
      throw createConfigError('Configuration missing version');
    }
    
    if (!this.config.currentNetwork) {
      throw createConfigError('Configuration missing current network');
    }
    
    if (!this.config.networks || Object.keys(this.config.networks).length === 0) {
      throw createConfigError('Configuration missing network definitions');
    }
    
    if (!this.config.ipfs) {
      throw createConfigError('Configuration missing IPFS settings');
    }
    
    const currentNetwork = this.config.networks[this.config.currentNetwork];
    if (!currentNetwork) {
      throw createConfigError(`Current network '${this.config.currentNetwork}' not defined`);
    }
  }
} 