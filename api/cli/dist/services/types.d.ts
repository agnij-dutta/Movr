import { Network as AptosNetwork } from '@aptos-labs/ts-sdk';
export { AptosNetwork as Network };
export interface NetworkConfig {
    url: string;
    faucetUrl?: string;
}
export declare const NETWORKS: Record<AptosNetwork, NetworkConfig>;
export declare const APM_CONTRACT_ADDRESS = "0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34";
export declare const APM_MODULE_NAME = "registry";
export declare const PACKAGE_TYPE_LIBRARY = 0;
export declare const PACKAGE_TYPE_TEMPLATE = 1;
export interface EndorserInfo {
    endorser: string;
    stakeAmount: number;
    isActive: boolean;
    reputation: number;
    packagesEndorsed: number;
    registeredAt: number;
}
export interface PackageMetadata {
    name: string;
    version: string;
    publisher: string;
    ipfsHash: string;
    endorsements: string[];
    timestamp: number;
    packageType: number;
    downloadCount: number;
    totalTips: number;
    tags: string[];
    description: string;
    homepage?: string;
    repository?: string;
    license?: string;
}
export interface RegistryStats {
    totalPackages: number;
    totalEndorsers: number;
    totalDownloads: number;
    totalTips: number;
}
export interface TransactionResult {
    transactionHash: string;
    success: boolean;
    vmStatus: string;
}
export interface PackagePublishedEvent {
    name: string;
    version: string;
    publisher: string;
    packageType: number;
    timestamp: number;
}
export interface PackageEndorsedEvent {
    name: string;
    version: string;
    endorser: string;
    timestamp: number;
}
export interface PackageTippedEvent {
    name: string;
    version: string;
    tipper: string;
    amount: number;
    timestamp: number;
}
export interface EndorserRegisteredEvent {
    endorser: string;
    stakeAmount: number;
    timestamp: number;
}
