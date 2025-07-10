import { ConfigService } from '../services/config';
import { Command } from 'commander';
export interface PublishCommandOptions {
    packagePath: string;
    pkgVersion?: string;
    description?: string;
    homepage?: string;
    repository?: string;
    license?: string;
    tags?: string;
    ipfsProvider?: string;
    network?: string;
    wallet?: string;
}
export declare class PublishCommand {
    private blockchain;
    private ipfs;
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    execute(options: PublishCommandOptions): Promise<void>;
    private extractPackageName;
    private isValidSemver;
    private askForConfirmation;
}
