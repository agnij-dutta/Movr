import { ConfigService } from '../services/config';
import { Command } from 'commander';
export interface SearchCommandOptions {
    query: string;
    packageType?: string;
    minEndorsements?: number;
    limit?: number;
    details?: boolean;
    network?: string;
}
export declare class SearchCommand {
    private blockchain;
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    execute(options: SearchCommandOptions): Promise<void>;
    private displaySummaryResults;
    private displayDetailedResults;
}
