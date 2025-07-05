import { ConfigService } from '../services/config.js';
import { Command } from 'commander';
export interface EndorseCommandOptions {
    name: string;
    version?: string;
    stakeAmount?: number;
    comment?: string;
    network?: string;
    wallet?: string;
}
export declare class EndorseCommand {
    private blockchain;
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    private registerEndorserSubcommand;
    execute(options: EndorseCommandOptions): Promise<void>;
}
