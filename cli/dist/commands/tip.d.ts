import { ConfigService } from '../services/config';
export interface TipCommandOptions {
    name: string;
    version?: string;
    amount: number;
    message?: string;
    network?: string;
    wallet?: string;
}
export declare class TipCommand {
    private blockchain;
    private config;
    constructor(configService: ConfigService);
    execute(options: TipCommandOptions): Promise<void>;
}
