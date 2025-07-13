#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../services/config';
import { InitCommand } from '../commands/init';
import { PublishCommand } from '../commands/publish';
import { InstallCommand } from '../commands/install';
import { SearchCommand } from '../commands/search';
import { EndorseCommand } from '../commands/endorse';
import { IPFSCommand } from '../commands/ipfs';
import { WalletCommand } from '../commands/wallet';
import { errorHandler } from '../utils/errors';
import { logger, setVerboseLogging } from '../utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLI_VERSION = '1.0.0'; // Update this manually for releases

export default async function main() {
  try {
    // Display banner
    console.log(chalk.cyan(`
▗▖  ▗▖ ▗▄▖ ▗▖  ▗▖▗▄▄▖ 
▐▛▚▞▜▌▐▌ ▐▌▐▌  ▐▌▐▌ ▐▌
▐▌  ▐▌▐▌ ▐▌▐▌  ▐▌▐▛▀▚▖
▐▌  ▐▌▝▚▄▞▘ ▝▚▞▘ ▐▌ ▐▌ 
    `));
    
    console.log(chalk.gray(`movr v${CLI_VERSION}`));
    console.log(chalk.gray('The Move Package Manager with IPFS integration\n'));

    // Initialize config service
    const configService = new ConfigService();
    await configService.initialize();

    // Create main program
    const program = new Command();
    program
      .name('movr')
      .description('movr - The Move Package Manager with IPFS')
      .version(CLI_VERSION);

    // Global options
    program.option('-n, --network <network>', 'Network to use (mainnet, testnet)', 'testnet');
    program.option('-v, --verbose', 'Enable verbose logging');

    // Parse arguments to extract global options before command execution
    const originalArgv = [...process.argv];
    const tempProgram = new Command();
    tempProgram.option('-n, --network <network>', 'Network to use (mainnet, testnet)', 'testnet');
    tempProgram.option('-v, --verbose', 'Enable verbose logging');
    tempProgram.allowUnknownOption(true);
    tempProgram.parse(originalArgv, { from: 'node' });
    const globalOptions = tempProgram.opts();

    // Set verbose logging if requested
    if (globalOptions.verbose) {
      setVerboseLogging(true);
      logger.info('Verbose logging enabled');
    }

    // Set network if specified
    if (globalOptions.network && globalOptions.network !== configService.getConfig().currentNetwork) {
      await configService.setCurrentNetwork(globalOptions.network);
      logger.info(`Switched to network: ${globalOptions.network}`);
    }

    // Ensure we're using testnet by default
    const currentNetwork = configService.getConfig().currentNetwork;
    if (currentNetwork !== 'testnet' && !globalOptions.network) {
      await configService.setCurrentNetwork('testnet');
      logger.info('Defaulting to testnet network');
    }

    logger.info(`Using network: ${configService.getConfig().currentNetwork}`);

    // Initialize commands with the main program
    new InitCommand(configService, program);
    new PublishCommand(configService, program);
    new InstallCommand(configService, program);
    new SearchCommand(configService, program);
    new EndorseCommand(configService, program);
    new IPFSCommand(configService, program);
    new WalletCommand(configService, program);

    // Parse and execute commands with original arguments
    await program.parseAsync(originalArgv);
  } catch (error) {
    await errorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Replace the ESM import.meta check with CommonJS equivalent
if (require.main === module) {
  main().catch((error) => {
    errorHandler.handleError(error);
  });
} 