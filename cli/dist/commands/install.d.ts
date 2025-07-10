import { ConfigService } from '../services/config';
import { Command } from 'commander';
export interface InstallCommandOptions {
    name: string;
    version?: string;
    outputDir?: string;
    network?: string;
}
export declare class InstallCommand {
    private blockchain;
    private ipfs;
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    execute(options: InstallCommandOptions): Promise<void>;
}
