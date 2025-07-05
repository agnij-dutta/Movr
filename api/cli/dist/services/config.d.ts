export interface WalletConfig {
    name: string;
    address: string;
    privateKey?: string;
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
    jwt?: string;
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
export declare class ConfigService {
    private configPath;
    private config;
    constructor(configPath?: string);
    /**
     * Initialize the configuration service
     */
    initialize(): Promise<void>;
    /**
     * Get the current configuration
     */
    getConfig(): APMConfig;
    /**
     * Get current network configuration
     */
    getCurrentNetwork(): NetworkConfig;
    /**
     * Set current network
     */
    setCurrentNetwork(networkName: string): Promise<void>;
    /**
     * Add or update network configuration
     */
    setNetwork(name: string, config: NetworkConfig): Promise<void>;
    /**
     * Get IPFS configuration
     */
    getIPFSConfig(): IPFSConfig;
    /**
     * Set IPFS configuration
     */
    setIPFSConfig(config: IPFSConfig): Promise<void>;
    /**
     * Get all wallets
     */
    getWallets(): WalletConfig[];
    /**
     * Get default wallet
     */
    getDefaultWallet(): WalletConfig | null;
    /**
     * Get wallet by name
     */
    getWallet(name: string): WalletConfig | null;
    /**
     * Add a new wallet
     */
    addWallet(wallet: WalletConfig): Promise<void>;
    /**
     * Remove a wallet
     */
    removeWallet(name: string): Promise<void>;
    /**
     * Set default wallet
     */
    setDefaultWallet(name: string): Promise<void>;
    /**
     * Get registry contract address for current network
     */
    getRegistryContract(): string;
    /**
     * Load configuration from file
     */
    private loadConfig;
    /**
     * Save configuration to file
     */
    private saveConfig;
    /**
     * Get default configuration path
     */
    private getDefaultConfigPath;
    /**
     * Get default configuration
     */
    private getDefaultConfig;
    /**
     * Validate configuration
     */
    private validateConfig;
}
