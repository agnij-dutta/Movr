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
      (config.currentNetwork as Network) || Network.TESTNET
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
      console.log(chalk.gray(`📦 Installing package '${options.name}'...`));
      
      logger.info('Installing package', { name: options.name });

      // Get package metadata
      console.log(chalk.gray('🔍 Fetching package metadata...'));
      const packageInfo = await this.blockchain.getPackageMetadata(
        options.name,
        options.version
      );

      if (!packageInfo) {
        console.log(chalk.red(`✗ Package '${options.name}' not found`));
        if (options.version) {
          console.log(chalk.gray(`   Version '${options.version}' does not exist`));
        }
        console.log(chalk.gray('   Use "movr search" to find available packages'));
        return;
      }

      console.log(chalk.green(`✅ Found package: ${packageInfo.name} v${packageInfo.version}`));
      if (packageInfo.description) {
        console.log(chalk.gray(`   ${packageInfo.description}`));
      }

      // Create output directory if it doesn't exist
      const outputDir = options.outputDir || path.join(process.cwd(), 'packages', options.name);
      await fs.ensureDir(outputDir);

      // Download and extract package from IPFS
      console.log(chalk.gray('📥 Downloading package from IPFS...'));
      logger.info('Downloading package from IPFS...', { ipfsHash: packageInfo.ipfsHash });
      
      try {
        await this.ipfs.downloadPackage(packageInfo.ipfsHash, outputDir);
        
        console.log(chalk.green(`✅ Package '${options.name}' installed successfully!`));
        console.log(chalk.gray(`   Location: ${outputDir}`));
        console.log(chalk.gray(`   IPFS hash: ${packageInfo.ipfsHash}`));
        
        // Show additional info if available
        if (packageInfo.endorsements && packageInfo.endorsements.length > 0) {
          console.log(chalk.gray(`   Endorsements: ${packageInfo.endorsements.length}`));
        }
        
      } catch (ipfsError) {
        console.log(chalk.red('✗ Failed to download package from IPFS'));
        console.log(chalk.gray('   This could be due to network issues or package unavailability'));
        console.log(chalk.gray(`   IPFS hash: ${packageInfo.ipfsHash}`));
        logger.error('Failed to download package from IPFS', { ipfsHash: packageInfo.ipfsHash, error: ipfsError });
        return;
      }

    } catch (error) {
      console.log(chalk.red(`✗ Failed to install package '${options.name}'`));
      logger.error('Failed to install package', { error });
      if (error instanceof Error) {
        console.log(chalk.gray(`   ${error.message}`));
      }
    }
  }
} 