import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger';
import { AptosBlockchainService } from '../services/blockchain';
import { PinataIPFSService } from '../services/ipfs';
import { ConfigService } from '../services/config';
import { Network } from '@aptos-labs/ts-sdk';
import { Command } from 'commander';

export interface InstallCommandOptions {
  name: string;
  version?: string;
  outputDir?: string;
  network?: string;
}

export class InstallCommand {
  private blockchain: AptosBlockchainService;
  private ipfs: PinataIPFSService;
  private config: ConfigService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.DEVNET
    );
    // PinataIPFSService now supports JWT authentication if present in config
    this.ipfs = new PinataIPFSService(config.ipfs);

    // Register command with Commander
    this.program = parentProgram
      .command('install')
      .description('Install a Move package from movr')
      .argument('<name>', 'Package name to install')
      .option('-v, --version <version>', 'Package version')
      .option('-o, --output-dir <dir>', 'Output directory')
      .option('--network <network>', 'Network to use')
      .action(async (name, options) => {
        await this.execute({ name, ...options });
      });
  }

  async execute(options: InstallCommandOptions): Promise<void> {
    try {
      logger.info('Installing package', { name: options.name });

      // Get package metadata
      const packageInfo = await this.blockchain.getPackageMetadata(
        options.name,
        options.version
      );

      if (!packageInfo) {
        console.log(chalk.red('✗') + ` Package '${options.name}' not found.`);
        return;
      }

      // Create output directory if it doesn't exist
      const outputDir = options.outputDir || path.join(process.cwd(), 'packages', options.name);
      await fs.ensureDir(outputDir);

      // Download and extract package from IPFS
      logger.info('Downloading package from IPFS...', { ipfsHash: packageInfo.ipfsHash });
      try {
        await this.ipfs.downloadPackage(packageInfo.ipfsHash, outputDir);
      } catch (ipfsError) {
        console.log(chalk.red('✗') + ' Failed to download package from IPFS.');
        logger.error('Failed to download package from IPFS', { ipfsHash: packageInfo.ipfsHash, error: ipfsError });
        return;
      }

      console.log(chalk.green('✓') + ` Package '${options.name}' installed successfully!`);
      console.log(chalk.gray('Location:'), chalk.gray(outputDir));
      console.log(chalk.gray('IPFS hash:'), chalk.gray(packageInfo.ipfsHash));

    } catch (error) {
      logger.error('Failed to install package', { error });
      console.log(chalk.red('✗') + ' Failed to install package.');
      if (error instanceof Error) {
        console.log(chalk.red(error.message));
      }
    }
  }
} 