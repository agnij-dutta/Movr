import { Command } from 'commander';
import { ConfigService } from '../services/config';
export interface IPFSUploadOptions {
    path: string;
    metadata?: string;
}
export interface IPFSDownloadOptions {
    hash: string;
    output: string;
}
export declare class IPFSCommand {
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    executeUpload(options: IPFSUploadOptions): Promise<void>;
    executeDownload(options: IPFSDownloadOptions): Promise<void>;
    executeTest(): Promise<void>;
}
