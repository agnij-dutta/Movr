#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigService } from '../services/config.js';
import { InitCommand } from '../commands/init.js';
import { PublishCommand } from '../commands/publish.js';
import { InstallCommand } from '../commands/install.js';
import { SearchCommand } from '../commands/search.js';
import { EndorseCommand } from '../commands/endorse.js';
import { IPFSCommand } from '../commands/ipfs.js';
import { WalletCommand } from '../commands/wallet.js';
import { errorHandler } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const CLI_VERSION = '1.0.0'; // Update this manually for releases

async function main() {
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

    const program = new Command();

    program
      .name('movr')
      .description('movr - The Move Package Manager with IPFS')
      .version(CLI_VERSION);

    // Global options
    program.option('-n, --network <network>', 'Network to use (mainnet, testnet, devnet)');
    program.option('-b, --verbose', 'Enable verbose logging');

    // Initialize config service
    const configService = new ConfigService();
    await configService.initialize();

    // Initialize commands
    new InitCommand(configService, program);
    new PublishCommand(configService, program);
    new InstallCommand(configService, program);
    new SearchCommand(configService, program);
    new EndorseCommand(configService, program);
    new IPFSCommand(configService, program);
    new WalletCommand(configService, program);

    await program.parseAsync(process.argv);
  } catch (error) {
    await errorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
  }
}

main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
}); 