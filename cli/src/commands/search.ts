import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { AptosBlockchainService } from '../services/blockchain.js';
import { ConfigService } from '../services/config.js';
import { Network } from '@aptos-labs/ts-sdk';
import { PACKAGE_TYPE_LIBRARY, PACKAGE_TYPE_TEMPLATE, PackageMetadata } from '../services/types.js';
import { Command } from 'commander';
import Fuse from 'fuse.js';

export interface SearchCommandOptions {
  query: string;
  packageType?: string;
  minEndorsements?: number;
  limit?: number;
  details?: boolean;
  network?: string;
}

export class SearchCommand {
  private blockchain: AptosBlockchainService;
  private config: ConfigService;
  private program: Command;

  constructor(configService: ConfigService, parentProgram: Command) {
    this.config = configService;
    const config = this.config.getConfig();
    this.blockchain = new AptosBlockchainService(
      (config.currentNetwork as Network) || Network.DEVNET
    );

    // Register command with Commander
    this.program = parentProgram
      .command('search')
      .description('Search for Move packages in movr')
      .argument('<query>', 'Search query')
      .option('-t, --package-type <type>', 'Filter by package type (library, template)')
      .option('-e, --min-endorsements <count>', 'Filter by minimum endorsements')
      .option('-l, --limit <count>', 'Limit number of results')
      .option('-d, --details', 'Show detailed package information')
      .option('--network <network>', 'Network to use')
      .action(async (query, options) => {
        await this.execute({ query, ...options });
      });
  }

  async execute(options: SearchCommandOptions): Promise<void> {
    console.log('DEBUG: Entered search execute function');
    try {
      console.log('Searching for packages:', options.query);

      // Fetch all packages
      const packages = await this.blockchain.getAllPackages();
      console.log('DEBUG: Packages fetched:', Array.isArray(packages) ? packages.length : packages);

      // Fuzzy search using Fuse.js
      let filteredPackages = packages;
      if (options.query && options.query.trim() !== '') {
        const fuse = new Fuse(packages, {
          keys: ['name', 'description', 'tags'],
          threshold: 0.4, // Adjust for fuzziness
        });
        filteredPackages = fuse.search(options.query).map(result => result.item);
      }

      // Filter results based on options
      if (options.packageType) {
        const packageType = options.packageType === 'template' ? PACKAGE_TYPE_TEMPLATE : PACKAGE_TYPE_LIBRARY;
        filteredPackages = filteredPackages.filter(pkg => pkg.packageType === packageType);
      }

      if (options.minEndorsements) {
        filteredPackages = filteredPackages.filter(pkg => 
          (pkg.endorsements?.length || 0) >= (options.minEndorsements || 0)
        );
      }

      if (options.limit) {
        filteredPackages = filteredPackages.slice(0, options.limit);
      }

      if (!filteredPackages || filteredPackages.length === 0) {
        console.log('No packages found matching your query');
        console.log('DEBUG: No filtered packages found');
        return;
      }

      console.log(`Found ${filteredPackages.length} packages:`);

      if (options.details) {
        await this.displayDetailedResults(filteredPackages);
      } else {
        await this.displaySummaryResults(filteredPackages);
      }
      console.log('DEBUG: Finished displaying results');

    } catch (error) {
      console.error('Failed to search packages', error);
      throw error;
    }
  }

  private async displaySummaryResults(packages: PackageMetadata[]): Promise<void> {
    let skipped = 0;
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (!pkg.name || !pkg.version) {
        skipped++;
        console.warn('Skipping package with missing name or version:', pkg);
        continue;
      }
      console.log(`\n${chalk.cyan(pkg.name)} ${chalk.yellow(`(${pkg.version})`)}`);
      console.log(`   ${chalk.italic(pkg.description || 'No description available')}`);
      console.log(`   ${chalk.green(pkg.endorsements?.length || 0)} endorsements`);
    }
    if (skipped > 0) {
      console.warn(`\n${skipped} package(s) were skipped due to missing name or version.`);
    }
  }

  private async displayDetailedResults(packages: PackageMetadata[]): Promise<void> {
    let skipped = 0;
    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      if (!pkg.name || !pkg.version) {
        skipped++;
        console.warn('Skipping package with missing name or version:', pkg);
        continue;
      }
      console.log(`${chalk.gray(`${i + 1}.`)} ${chalk.cyan.bold(pkg.name)}`);
      console.log(`   Version: ${chalk.yellow(pkg.version)}`);
      if (pkg.description) {
        console.log(`   Description: ${pkg.description}`);
      }
      if ('homepage' in pkg) {
        console.log(`   Homepage: ${chalk.blue.underline((pkg as any).homepage)}`);
      }
      if ('repository' in pkg) {
        console.log(`   Repository: ${chalk.blue.underline((pkg as any).repository)}`);
      }
      if ('license' in pkg) {
        console.log(`   License: ${(pkg as any).license}`);
      }
      console.log(`   IPFS: ${chalk.gray(pkg.ipfsHash)}`);
      console.log(`   Endorsements: ${chalk.green(pkg.endorsements?.length || 0)}`);
      if (pkg.tags && pkg.tags.length > 0) {
        console.log(`   Tags: ${chalk.magenta(pkg.tags.map((t: string) => `#${t}`).join(' '))}`);
      }
      console.log(chalk.gray('─'.repeat(60)));
    }
    if (skipped > 0) {
      console.warn(`\n${skipped} package(s) were skipped due to missing name or version.`);
    }
  }
} 