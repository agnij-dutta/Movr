"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishCommand = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const errors_1 = require("../utils/errors");
const blockchain_1 = require("../services/blockchain");
const ipfs_1 = require("../services/ipfs");
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const types_1 = require("../services/types");
const readline = __importStar(require("readline"));
class PublishCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        const config = this.config.getConfig();
        this.blockchain = new blockchain_1.AptosBlockchainService(config.currentNetwork || ts_sdk_1.Network.DEVNET);
        // PinataIPFSService now supports JWT authentication if present in config
        this.ipfs = new ipfs_1.PinataIPFSService(config.ipfs);
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
            await this.execute(options);
        });
    }
    async execute(options) {
        try {
            // Validate package directory
            const packageDir = path_1.default.resolve(options.packagePath);
            if (!await fs_extra_1.default.pathExists(packageDir)) {
                throw (0, errors_1.createFileSystemError)('Package directory does not exist');
            }
            // Validate Move.toml exists
            const moveTomlPath = path_1.default.join(packageDir, 'Move.toml');
            if (!await fs_extra_1.default.pathExists(moveTomlPath)) {
                throw (0, errors_1.createFileSystemError)('Move.toml not found in package directory');
            }
            // Read package name from Move.toml
            const moveToml = await fs_extra_1.default.readFile(moveTomlPath, 'utf-8');
            const packageName = this.extractPackageName(moveToml);
            if (!packageName) {
                throw (0, errors_1.createFileSystemError)('Invalid Move.toml: package name not found');
            }
            // Validate version format
            const version = options.pkgVersion || '1.0.0';
            if (!this.isValidSemver(version)) {
                throw (0, errors_1.createFileSystemError)('Invalid version format. Must be semver (e.g., 1.0.0)');
            }
            // Create temporary directory and copy package contents
            const tempDir = await fs_extra_1.default.mkdtemp(path_1.default.join('/tmp', 'apm_publish_'));
            await fs_extra_1.default.copy(packageDir, tempDir);
            // Upload to IPFS
            const uploadResult = await this.ipfs.uploadDirectory(tempDir);
            // Get wallet account
            const walletConfig = this.config.getWallet(options.wallet || '');
            if (!walletConfig || !walletConfig.privateKey) {
                throw (0, errors_1.createFileSystemError)('No wallet configured or private key missing. Run `apm wallet init` first');
            }
            // Create account from private key using blockchain service
            const account = this.blockchain.createAccountFromPrivateKey(walletConfig.privateKey);
            // Check balance and warn about fee
            const balance = await this.blockchain.getAccountBalance(account.accountAddress.toString());
            const feeInAPT = this.blockchain.formatToAPT(blockchain_1.PLATFORM_PUBLISH_FEE);
            const balanceInAPT = this.blockchain.formatToAPT(balance);
            console.log(chalk_1.default.yellow(`\n📋 Platform Fee Information:`));
            console.log(chalk_1.default.yellow(`   Publishing fee: ${feeInAPT} APT`));
            console.log(chalk_1.default.yellow(`   Your balance: ${balanceInAPT} APT`));
            if (balance < blockchain_1.PLATFORM_PUBLISH_FEE) {
                console.log(chalk_1.default.red(`\n❌ Insufficient balance! You need at least ${feeInAPT} APT to publish.`));
                if (this.config.getConfig().currentNetwork !== 'mainnet') {
                    console.log(chalk_1.default.gray(`   💡 Fund your account: aptos account fund-with-faucet --account ${account.accountAddress}`));
                }
                return;
            }
            // Ask for confirmation
            const confirmed = await this.askForConfirmation(`\n💰 Publishing will cost ${feeInAPT} APT. Continue? (y/N): `);
            if (!confirmed) {
                console.log(chalk_1.default.gray('Publishing cancelled.'));
                return;
            }
            // Parse tags
            const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
            // Publish to blockchain
            const result = await this.blockchain.publishPackage(account, {
                name: packageName,
                version,
                ipfsHash: uploadResult.ipfsHash,
                description: options.description || '',
                homepage: options.homepage,
                repository: options.repository,
                license: options.license,
                tags,
                packageType: types_1.PACKAGE_TYPE_LIBRARY,
                publisher: account.accountAddress.toString(),
                endorsements: [],
                timestamp: Math.floor(Date.now() / 1000),
                downloadCount: 0,
                totalTips: 0,
            });
            // Clean up temp directory
            await fs_extra_1.default.remove(tempDir);
            if (result.success) {
                console.log(chalk_1.default.green('✅ Package published successfully!'));
                console.log(chalk_1.default.gray(`Transaction hash: ${result.transactionHash}`));
                console.log(chalk_1.default.gray(`IPFS hash: ${uploadResult.ipfsHash}`));
                console.log(chalk_1.default.gray(`IPFS gateway URL: ${this.config.getIPFSConfig().gatewayUrl}/ipfs/${uploadResult.ipfsHash}`));
                // Verification step: fetch package metadata
                const published = await this.blockchain.getPackageMetadata(packageName, version);
                if (published && published.ipfsHash === uploadResult.ipfsHash) {
                    console.log(chalk_1.default.green('✓') + ' On-chain verification: Package metadata matches published data.');
                }
                else {
                    console.log(chalk_1.default.yellow('!') + ' On-chain verification: Could not verify published package metadata.');
                }
            }
            else {
                console.log(chalk_1.default.red('✗') + ' Failed to publish package.');
                if (result.vmStatus) {
                    console.log(chalk_1.default.red(result.vmStatus));
                }
            }
        }
        catch (error) {
            console.error('Failed to publish package:', error);
            console.log(chalk_1.default.red('✗') + ' Failed to publish package.');
            if (error instanceof Error) {
                console.log(chalk_1.default.red(error.message));
            }
        }
    }
    extractPackageName(moveToml) {
        const nameMatch = moveToml.match(/name\s*=\s*"([^"]+)"/);
        return nameMatch ? nameMatch[1] : null;
    }
    isValidSemver(version) {
        const parts = version.split('.');
        return parts.length === 3 && parts.every(part => /^\d+$/.test(part));
    }
    async askForConfirmation(question) {
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
exports.PublishCommand = PublishCommand;
