import { Network, Account } from '@aptos-labs/ts-sdk';
import { PackageMetadata, EndorserInfo, RegistryStats, TransactionResult, PackagePublishedEvent, PackageEndorsedEvent, PackageTippedEvent, EndorserRegisteredEvent } from './types.js';
export declare class AptosBlockchainService {
    private aptos;
    private config;
    constructor(network?: Network, nodeUrl?: string);
    /**
     * Get account information
     */
    getAccountInfo(address: string): Promise<import("@aptos-labs/ts-sdk").AccountData>;
    /**
     * Fund account with APT (testnet/devnet only)
     */
    fundAccount(address: string, amount?: number): Promise<void>;
    /**
     * Publish a package to the registry
     */
    publishPackage(signer: Account, metadata: PackageMetadata): Promise<TransactionResult>;
    /**
     * Get package metadata
     */
    getPackageMetadata(name: string, version?: string): Promise<PackageMetadata | null>;
    /**
     * Get package versions
     */
    getPackageVersions(name: string): Promise<string[]>;
    /**
     * Search packages
     */
    searchPackages(query: string): Promise<PackageMetadata[]>;
    /**
     * Get registry stats
     */
    getRegistryStats(): Promise<RegistryStats>;
    /**
     * Get endorser info
     */
    getEndorserInfo(address: string): Promise<EndorserInfo | null>;
    /**
     * Register as an endorser
     */
    registerEndorser(signer: Account, stakeAmount: number): Promise<TransactionResult>;
    /**
     * Endorse a package
     */
    endorsePackage(signer: Account, name: string, version: string): Promise<TransactionResult>;
    /**
     * Tip a package
     */
    tipPackage(signer: Account, name: string, version: string, amount: number): Promise<TransactionResult>;
    /**
     * Create account from private key
     */
    createAccountFromPrivateKey(privateKeyString: string): Account;
    /**
     * Generate new account
     */
    generateAccount(): Account;
    /**
     * Parse Move values into TypeScript types
     */
    private parseMoveValue;
    /**
     * Parse package metadata from Move values
     */
    private parsePackageMetadata;
    /**
     * Parse endorser info from Move values
     */
    private parseEndorserInfo;
    /**
     * Parse registry stats from Move values
     */
    private parseRegistryStats;
    /**
     * Get package published events
     */
    getPackagePublishedEvents(limit?: number): Promise<PackagePublishedEvent[]>;
    /**
     * Get package endorsed events
     */
    getPackageEndorsedEvents(limit?: number): Promise<PackageEndorsedEvent[]>;
    /**
     * Get package tipped events
     */
    getPackageTippedEvents(limit?: number): Promise<PackageTippedEvent[]>;
    /**
     * Get endorser registered events
     */
    getEndorserRegisteredEvents(limit?: number): Promise<EndorserRegisteredEvent[]>;
    /**
     * Get all packages (off-chain aggregation)
     */
    getAllPackages(): Promise<PackageMetadata[]>;
}
