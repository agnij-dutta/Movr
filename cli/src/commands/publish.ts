import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { createFileSystemError } from '../utils/errors.js';
import { AptosBlockchainService, PLATFORM_PUBLISH_FEE } from '../services/blockchain.js';
import { PinataIPFSService } from '../services/ipfs.js';
import { ConfigService } from '../services/config.js';
import { Network } from '@aptos-labs/ts-sdk';
import { PACKAGE_TYPE_LIBRARY } from '../services/types.js';
import { Command } from 'commander';
import * as readline from 'readline';

export interface PublishCommandOptions {
  packagePath: string;
  pkgVersion?: string;
  description?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  tags?: string;
  ipfsProvider?: string;
  network?: string;
  wallet?: string;
}

export class PublishCommand {
  private blockchain: AptosBlockchainService;
  private ipfs: PinataIPFSService;
  private config: ConfigService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    console.log('DEBUG: PublishCommand constructor called');
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.DEVNET
    );
    // PinataIPFSService now supports JWT authentication if present in config
    this.ipfs = new PinataIPFSService(config.ipfs);

    // Register command with Commander
    this.program = parentProgram
      .command('publish')
      .description('Publish a Move package to movr')
      .option('--package-path <path>', 'Path to package directory', '.')
      .option('--pkg-version <pkgVersion>', 'Package version (semver format)')
      .option('--description <description>', 'Package description')
      .option('--homepage <url>', 'Package homepage URL')
      .option('--repository <url>', 'Package repository URL')
      .option('--license <license>', 'Package license')
      .option('--tags <tags>', 'Package tags (comma separated)')
      .option('--ipfs-provider <provider>', 'IPFS provider to use', 'pinata')
      .option('--network <network>', 'Network to publish to')
      .option('--wallet <name>', 'Wallet to use for publishing')
      .action(async (options) => {
        console.log('DEBUG: .action handler called with options:', options);
        await this.execute(options);
      });
  }

  async execute(options: PublishCommandOptions): Promise<void> {
    console.log('DEBUG: PublishCommand.execute called');
    console.log('DEBUG: Entered publish execute function');
    try {
      console.log('Publishing package:', options.packagePath, options.pkgVersion);

      // Validate package directory
      const packageDir = path.resolve(options.packagePath);
      console.log('DEBUG: Resolved packageDir:', packageDir);
      if (!await fs.pathExists(packageDir)) {
        throw createFileSystemError('Package directory does not exist');
      }

      // Validate Move.toml exists
      const moveTomlPath = path.join(packageDir, 'Move.toml');
      console.log('DEBUG: Move.toml path:', moveTomlPath);
      if (!await fs.pathExists(moveTomlPath)) {
        throw createFileSystemError('Move.toml not found in package directory');
      }

      // Read package name from Move.toml
      const moveToml = await fs.readFile(moveTomlPath, 'utf-8');
      const packageName = this.extractPackageName(moveToml);
      console.log('DEBUG: Extracted packageName:', packageName);
      if (!packageName) {
        throw createFileSystemError('Invalid Move.toml: package name not found');
      }

      // Validate version format
      const version = options.pkgVersion || '1.0.0';
      console.log('DEBUG: Using version:', version);
      if (!this.isValidSemver(version)) {
        throw createFileSystemError('Invalid version format. Must be semver (e.g., 1.0.0)');
      }

      // Create temporary directory and copy package contents
      const tempDir = await fs.mkdtemp(path.join('/tmp', 'apm_publish_'));
      console.log('DEBUG: Created tempDir:', tempDir);
      await fs.copy(packageDir, tempDir);
      console.log('DEBUG: Copied package to tempDir');

      // Upload to IPFS
      console.log('Uploading package to IPFS...');
      console.log('DEBUG: Calling ipfs.uploadDirectory');
      const uploadResult = await this.ipfs.uploadDirectory(tempDir);
      console.log('DEBUG: IPFS upload result:', uploadResult);
      console.log('Package uploaded to IPFS', { ipfsHash: uploadResult.ipfsHash });

      // Get wallet account
      const walletConfig = this.config.getWallet(options.wallet || '');
      console.log('DEBUG: Wallet config:', walletConfig);
      if (!walletConfig || !walletConfig.privateKey) {
        throw createFileSystemError('No wallet configured or private key missing. Run `apm wallet init` first');
      }

      // Create account from private key using blockchain service
      const account = this.blockchain.createAccountFromPrivateKey(walletConfig.privateKey);
      console.log('DEBUG: Created account from private key:', account.accountAddress.toString());

      // Check balance and warn about fee
      const balance = await this.blockchain.getAccountBalance(account.accountAddress.toString());
      const feeInAPT = this.blockchain.formatToAPT(PLATFORM_PUBLISH_FEE);
      const balanceInAPT = this.blockchain.formatToAPT(balance);
      
      console.log(chalk.yellow(`\n📋 Platform Fee Information:`));
      console.log(chalk.yellow(`   Publishing fee: ${feeInAPT} APT`));
      console.log(chalk.yellow(`   Your balance: ${balanceInAPT} APT`));
      
      if (balance < PLATFORM_PUBLISH_FEE) {
        console.log(chalk.red(`\n❌ Insufficient balance! You need at least ${feeInAPT} APT to publish.`));
        if (this.config.getConfig().currentNetwork !== 'mainnet') {
          console.log(chalk.gray(`   💡 Fund your account: aptos account fund-with-faucet --account ${account.accountAddress}`));
        }
        return;
      }

      // Ask for confirmation
      const confirmed = await this.askForConfirmation(
        `\n💰 Publishing will cost ${feeInAPT} APT. Continue? (y/N): `
      );
      
      if (!confirmed) {
        console.log(chalk.gray('Publishing cancelled.'));
        return;
      }

      // Parse tags
      const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
      console.log('DEBUG: Parsed tags:', tags);

      // Publish to blockchain
      console.log('DEBUG: Calling blockchain.publishPackage');
      const result = await this.blockchain.publishPackage(account, {
        name: packageName,
        version,
        ipfsHash: uploadResult.ipfsHash,
        description: options.description || '',
        homepage: options.homepage,
        repository: options.repository,
        license: options.license,
        tags,
        packageType: PACKAGE_TYPE_LIBRARY,
        publisher: account.accountAddress.toString(),
        endorsements: [],
        timestamp: Math.floor(Date.now() / 1000),
        downloadCount: 0,
        totalTips: 0,
      });
      console.log('DEBUG: Blockchain publish result:', result);

      // Clean up temp directory
      await fs.remove(tempDir);
      console.log('DEBUG: Removed tempDir');

      if (result.success) {
        console.log(chalk.green('✅ Package published successfully!'));
        console.log(chalk.gray(`Transaction hash: ${result.transactionHash}`));
        console.log(chalk.gray(`IPFS hash: ${uploadResult.ipfsHash}`));
        console.log(chalk.gray(`IPFS gateway URL: ${this.config.getIPFSConfig().gatewayUrl}/ipfs/${uploadResult.ipfsHash}`));
        // Verification step: fetch package metadata
        console.log('DEBUG: Verifying on-chain package metadata');
        const published = await this.blockchain.getPackageMetadata(packageName, version);
        console.log('DEBUG: On-chain package metadata:', published);
        if (published && published.ipfsHash === uploadResult.ipfsHash) {
          console.log(chalk.green('✓') + ' On-chain verification: Package metadata matches published data.');
        } else {
          console.log(chalk.yellow('!') + ' On-chain verification: Could not verify published package metadata.');
        }
      } else {
        console.log(chalk.red('✗') + ' Failed to publish package.');
        if (result.vmStatus) {
          console.log(chalk.red(result.vmStatus));
        }
      }
    } catch (error) {
      console.error('Failed to publish package:', error);
      console.log(chalk.red('✗') + ' Failed to publish package.');
      if (error instanceof Error) {
        console.log(chalk.red(error.message));
      }
    }
  }

  private extractPackageName(moveToml: string): string | null {
    const nameMatch = moveToml.match(/name\s*=\s*"([^"]+)"/);
    return nameMatch ? nameMatch[1] : null;
  }

  private isValidSemver(version: string): boolean {
    const parts = version.split('.');
    return parts.length === 3 && parts.every(part => /^\d+$/.test(part));
  }

  private async askForConfirmation(question: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
      });
    });
  }
} 