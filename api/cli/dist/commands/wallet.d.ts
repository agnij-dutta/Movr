import { ConfigService } from '../services/config.js';
import { Command } from 'commander';
export interface WalletCommandOptions {
    action: 'create' | 'list' | 'show' | 'remove' | 'use' | 'import';
    name?: string;
    network?: string;
    privateKey?: string;
}
export declare class WalletCommand {
    private config;
    private blockchain;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    execute(options: WalletCommandOptions): Promise<void>;
    private createWallet;
    private listWallets;
    private showWallet;
    private removeWallet;
    private useWallet;
    private importWallet;
}
