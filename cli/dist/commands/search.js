"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchCommand = void 0;
const chalk_1 = __importDefault(require("chalk"));
const blockchain_1 = require("../services/blockchain");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const types_1 = require("../services/types");
const fuse_js_1 = __importDefault(require("fuse.js"));
class SearchCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.DEVNET);
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
    async execute(options) {
        try {
            // Fetch all packages
            const packages = await this.blockchain.getAllPackages();
            // Fuzzy search using Fuse.js
            let filteredPackages = packages;
            if (options.query && options.query.trim() !== '') {
                const fuse = new fuse_js_1.default(packages, {
                    keys: ['name', 'description', 'tags'],
                    threshold: 0.4, // Adjust for fuzziness
                });
                filteredPackages = fuse.search(options.query).map((result) => result.item);
            }
            // Filter results based on options
            if (options.packageType) {
                const packageType = options.packageType === 'template' ? types_1.PACKAGE_TYPE_TEMPLATE : types_1.PACKAGE_TYPE_LIBRARY;
                filteredPackages = filteredPackages.filter(pkg => pkg.packageType === packageType);
            }
            if (options.minEndorsements) {
                filteredPackages = filteredPackages.filter(pkg => (pkg.endorsements?.length || 0) >= (options.minEndorsements || 0));
            }
            if (options.limit) {
                filteredPackages = filteredPackages.slice(0, options.limit);
            }
            if (!filteredPackages || filteredPackages.length === 0) {
                console.log('No packages found matching your query');
                return;
            }
            console.log(`Found ${filteredPackages.length} packages:`);
            if (options.details) {
                await this.displayDetailedResults(filteredPackages);
            }
            else {
                await this.displaySummaryResults(filteredPackages);
            }
        }
        catch (error) {
            console.error('Failed to search packages', error);
            throw error;
        }
    }
    async displaySummaryResults(packages) {
        let skipped = 0;
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            if (!pkg.name || !pkg.version) {
                skipped++;
                console.warn('Skipping package with missing name or version:', pkg);
                continue;
            }
            console.log(`\n${chalk_1.default.cyan(pkg.name)} ${chalk_1.default.yellow(`(${pkg.version})`)}`);
            console.log(`   ${chalk_1.default.italic(pkg.description || 'No description available')}`);
            console.log(`   ${chalk_1.default.green(pkg.endorsements?.length || 0)} endorsements`);
        }
        if (skipped > 0) {
            console.warn(`\n${skipped} package(s) were skipped due to missing name or version.`);
        }
    }
    async displayDetailedResults(packages) {
        let skipped = 0;
        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            if (!pkg.name || !pkg.version) {
                skipped++;
                console.warn('Skipping package with missing name or version:', pkg);
                continue;
            }
            console.log(`${chalk_1.default.gray(`${i + 1}.`)} ${chalk_1.default.cyan.bold(pkg.name)}`);
            console.log(`   Version: ${chalk_1.default.yellow(pkg.version)}`);
            if (pkg.description) {
                console.log(`   Description: ${pkg.description}`);
            }
            if ('homepage' in pkg) {
                console.log(`   Homepage: ${chalk_1.default.blue.underline(pkg.homepage)}`);
            }
            if ('repository' in pkg) {
                console.log(`   Repository: ${chalk_1.default.blue.underline(pkg.repository)}`);
            }
            if ('license' in pkg) {
                console.log(`   License: ${pkg.license}`);
            }
            console.log(`   IPFS: ${chalk_1.default.gray(pkg.ipfsHash)}`);
            console.log(`   Endorsements: ${chalk_1.default.green(pkg.endorsements?.length || 0)}`);
            if (pkg.tags && pkg.tags.length > 0) {
                console.log(`   Tags: ${chalk_1.default.magenta(pkg.tags.map((t) => `#${t}`).join(' '))}`);
            }
            console.log(chalk_1.default.gray('─'.repeat(60)));
        }
        if (skipped > 0) {
            console.warn(`\n${skipped} package(s) were skipped due to missing name or version.`);
        }
    }
}
exports.SearchCommand = SearchCommand;
