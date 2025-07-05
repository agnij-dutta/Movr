export interface PinataConfig {
    apiKey: string;
    secretKey: string;
    gatewayUrl: string;
    jwt?: string;
}
export interface IPFSFile {
    name: string;
    content: Buffer | string;
    path?: string;
}
export interface UploadResult {
    ipfsHash: string;
    pinSize: number;
    timestamp: string;
}
export interface PinataResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}
export declare class PinataIPFSService {
    private client;
    private config;
    private pinata?;
    constructor(config: PinataConfig);
    /**
     * Upload a directory to IPFS
     */
    uploadDirectory(directoryPath: string, metadata?: Record<string, any>): Promise<UploadResult>;
    /**
     * Upload a single file to IPFS
     */
    uploadFile(filePath: string, metadata?: Record<string, any>): Promise<UploadResult>;
    /**
     * Download a file from IPFS
     */
    downloadFile(ipfsHash: string, outputPath: string): Promise<void>;
    /**
     * Download and extract a package from IPFS
     */
    downloadPackage(ipfsHash: string, extractPath: string): Promise<void>;
    /**
     * Get file content as string from IPFS
     */
    getFileContent(ipfsHash: string): Promise<string>;
    /**
     * Pin content to IPFS using Pinata
     */
    pinJSON(content: any, metadata?: Record<string, any>): Promise<UploadResult>;
    /**
     * Test connection to Pinata
     */
    testConnection(): Promise<boolean>;
    /**
     * Create a zip archive of a directory
     */
    private createZipArchive;
}
