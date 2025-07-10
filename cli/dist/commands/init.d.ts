import { Command } from 'commander';
import { ConfigService } from '../services/config';
export interface InitCommandOptions {
    directory: string;
    name?: string;
    author?: string;
    description?: string;
    template?: 'basic' | 'token' | 'defi';
}
export interface GlobalOptions {
    network: string;
    configPath?: string;
}
export declare class InitCommand {
    private config;
    private program;
    constructor(configService: ConfigService, parentProgram: Command);
    execute(options: InitCommandOptions): Promise<void>;
    executeRegistryInit(options: any): Promise<void>;
    private gatherPackageInfo;
    private createPackageStructure;
    private generateMoveToml;
    private createTemplateFiles;
    private createBasicTemplate;
    private createTokenTemplate;
    private createDefiTemplate;
    private generateReadme;
    private generateGitignore;
}
