"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFSCommand = void 0;
const logger_1 = require("../utils/logger");
const ipfs_1 = require("../services/ipfs");
class IPFSCommand {
    constructor(configService, parentProgram) {
        this.config = configService;
        // Register command with Commander
        this.program = parentProgram
            .command('ipfs')
            .description('IPFS operations for movr');
        this.program
            .command('upload')
            .description('Upload a file to IPFS')
            .argument('<path>', 'Path to file or directory')
            .option('-m, --metadata <json>', 'Optional metadata as JSON')
            .action(async (path, options) => {
            await this.executeUpload({ path, ...options });
        });
        this.program
            .command('download')
            .description('Download a file from IPFS')
            .argument('<hash>', 'IPFS hash')
            .argument('<output>', 'Output path')
            .action(async (hash, output) => {
            await this.executeDownload({ hash, output });
        });
        this.program
            .command('test')
            .description('Test IPFS connection')
            .action(async () => {
            await this.executeTest();
        });
    }
    async executeUpload(options) {
        try {
            await this.config.initialize();
            const ipfsConfig = this.config.getIPFSConfig();
            // PinataIPFSService now supports JWT authentication if present in config
            const ipfsService = new ipfs_1.PinataIPFSService(ipfsConfig);
            logger_1.logger.info('Uploading to IPFS...', { path: options.path });
            const result = await ipfsService.uploadFile(options.path, options.metadata ? JSON.parse(options.metadata) : undefined);
            console.log('File uploaded successfully!');
            console.log('IPFS Hash:', result.ipfsHash);
            console.log('Size:', result.pinSize, 'bytes');
            console.log('Timestamp:', result.timestamp);
        }
        catch (error) {
            logger_1.logger.error('Failed to upload file', { error });
            throw error;
        }
    }
    async executeDownload(options) {
        try {
            await this.config.initialize();
            const ipfsConfig = this.config.getIPFSConfig();
            const ipfsService = new ipfs_1.PinataIPFSService(ipfsConfig);
            logger_1.logger.info('Downloading from IPFS...', { hash: options.hash });
            await ipfsService.downloadFile(options.hash, options.output);
            console.log('File downloaded successfully!');
            console.log('Output path:', options.output);
        }
        catch (error) {
            logger_1.logger.error('Failed to download file', { error });
            throw error;
        }
    }
    async executeTest() {
        try {
            await this.config.initialize();
            const ipfsConfig = this.config.getIPFSConfig();
            const ipfsService = new ipfs_1.PinataIPFSService(ipfsConfig);
            logger_1.logger.info('Testing IPFS connection...');
            const isConnected = await ipfsService.testConnection();
            if (isConnected) {
                console.log('✅ IPFS connection successful!');
                console.log('Gateway URL:', ipfsConfig.gatewayUrl);
            }
            else {
                console.log('❌ IPFS connection failed!');
                console.log('Please check your configuration and try again.');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to test IPFS connection', { error });
            throw error;
        }
    }
}
exports.IPFSCommand = IPFSCommand;
