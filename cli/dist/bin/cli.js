#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = main;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const config_1 = require("../services/config");
const init_1 = require("../commands/init");
const publish_1 = require("../commands/publish");
const install_1 = require("../commands/install");
const search_1 = require("../commands/search");
const endorse_1 = require("../commands/endorse");
const ipfs_1 = require("../commands/ipfs");
const wallet_1 = require("../commands/wallet");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const CLI_VERSION = '1.0.0'; // Update this manually for releases
async function main() {
    try {
        // Display banner
        console.log(chalk_1.default.cyan(`
▗▖  ▗▖ ▗▄▖ ▗▖  ▗▖▗▄▄▖ 
▐▛▚▞▜▌▐▌ ▐▌▐▌  ▐▌▐▌ ▐▌
▐▌  ▐▌▐▌ ▐▌▐▌  ▐▌▐▛▀▚▖
▐▌  ▐▌▝▚▄▞▘ ▝▚▞▘ ▐▌ ▐▌ 
    `));
        console.log(chalk_1.default.gray(`movr v${CLI_VERSION}`));
        console.log(chalk_1.default.gray('The Move Package Manager with IPFS integration\n'));
        // Initialize config service
        const configService = new config_1.ConfigService();
        await configService.initialize();
        // Create main program
        const program = new commander_1.Command();
        program
            .name('movr')
            .description('movr - The Move Package Manager with IPFS')
            .version(CLI_VERSION);
        // Global options
        program.option('-n, --network <network>', 'Network to use (mainnet, testnet)', 'testnet');
        program.option('-v, --verbose', 'Enable verbose logging');
        // Parse arguments to extract global options before command execution
        const originalArgv = [...process.argv];
        const tempProgram = new commander_1.Command();
        tempProgram.option('-n, --network <network>', 'Network to use (mainnet, testnet)', 'testnet');
        tempProgram.option('-v, --verbose', 'Enable verbose logging');
        tempProgram.allowUnknownOption(true);
        tempProgram.parse(originalArgv, { from: 'node' });
        const globalOptions = tempProgram.opts();
        // Set verbose logging if requested
        if (globalOptions.verbose) {
            (0, logger_1.setVerboseLogging)(true);
            logger_1.logger.info('Verbose logging enabled');
        }
        // Set network if specified
        if (globalOptions.network && globalOptions.network !== configService.getConfig().currentNetwork) {
            await configService.setCurrentNetwork(globalOptions.network);
            logger_1.logger.info(`Switched to network: ${globalOptions.network}`);
        }
        // Ensure we're using testnet by default
        const currentNetwork = configService.getConfig().currentNetwork;
        if (currentNetwork !== 'testnet' && !globalOptions.network) {
            await configService.setCurrentNetwork('testnet');
            logger_1.logger.info('Defaulting to testnet network');
        }
        logger_1.logger.info(`Using network: ${configService.getConfig().currentNetwork}`);
        // Initialize commands with the main program
        new init_1.InitCommand(configService, program);
        new publish_1.PublishCommand(configService, program);
        new install_1.InstallCommand(configService, program);
        new search_1.SearchCommand(configService, program);
        new endorse_1.EndorseCommand(configService, program);
        new ipfs_1.IPFSCommand(configService, program);
        new wallet_1.WalletCommand(configService, program);
        // Parse and execute commands with original arguments
        await program.parseAsync(originalArgv);
    }
    catch (error) {
        await errors_1.errorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
    }
}
// Replace the ESM import.meta check with CommonJS equivalent
if (require.main === module) {
    main().catch((error) => {
        errors_1.errorHandler.handleError(error);
    });
}
