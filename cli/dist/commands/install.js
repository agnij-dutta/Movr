"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallCommand = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../utils/logger");
const blockchain_1 = require("../services/blockchain");
const ipfs_1 = require("../services/ipfs");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
class InstallCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.TESTNET);
        // PinataIPFSService now supports JWT authentication if present in config
        this.ipfs = new ipfs_1.PinataIPFSService(config.ipfs);
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
    async execute(options) {
        try {
            console.log(chalk_1.default.gray(`📦 Installing package '${options.name}'...`));
            logger_1.logger.info('Installing package', { name: options.name });
            // Get package metadata
            console.log(chalk_1.default.gray('🔍 Fetching package metadata...'));
            const packageInfo = await this.blockchain.getPackageMetadata(options.name, options.version);
            if (!packageInfo) {
                console.log(chalk_1.default.red(`✗ Package '${options.name}' not found`));
                if (options.version) {
                    console.log(chalk_1.default.gray(`   Version '${options.version}' does not exist`));
                }
                console.log(chalk_1.default.gray('   Use "movr search" to find available packages'));
                return;
            }
            console.log(chalk_1.default.green(`✅ Found package: ${packageInfo.name} v${packageInfo.version}`));
            if (packageInfo.description) {
                console.log(chalk_1.default.gray(`   ${packageInfo.description}`));
            }
            // Create output directory if it doesn't exist
            const outputDir = options.outputDir || path_1.default.join(process.cwd(), 'packages', options.name);
            await fs_extra_1.default.ensureDir(outputDir);
            // Download and extract package from IPFS
            console.log(chalk_1.default.gray('📥 Downloading package from IPFS...'));
            logger_1.logger.info('Downloading package from IPFS...', { ipfsHash: packageInfo.ipfsHash });
            try {
                await this.ipfs.downloadPackage(packageInfo.ipfsHash, outputDir);
                console.log(chalk_1.default.green(`✅ Package '${options.name}' installed successfully!`));
                console.log(chalk_1.default.gray(`   Location: ${outputDir}`));
                console.log(chalk_1.default.gray(`   IPFS hash: ${packageInfo.ipfsHash}`));
                // Show additional info if available
                if (packageInfo.endorsements && packageInfo.endorsements.length > 0) {
                    console.log(chalk_1.default.gray(`   Endorsements: ${packageInfo.endorsements.length}`));
                }
            }
            catch (ipfsError) {
                console.log(chalk_1.default.red('✗ Failed to download package from IPFS'));
                console.log(chalk_1.default.gray('   This could be due to network issues or package unavailability'));
                console.log(chalk_1.default.gray(`   IPFS hash: ${packageInfo.ipfsHash}`));
                logger_1.logger.error('Failed to download package from IPFS', { ipfsHash: packageInfo.ipfsHash, error: ipfsError });
                return;
            }
        }
        catch (error) {
            console.log(chalk_1.default.red(`✗ Failed to install package '${options.name}'`));
            logger_1.logger.error('Failed to install package', { error });
            if (error instanceof Error) {
                console.log(chalk_1.default.gray(`   ${error.message}`));
            }
        }
    }
}
exports.InstallCommand = InstallCommand;
