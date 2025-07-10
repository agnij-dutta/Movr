"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PinataIPFSService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const fs_1 = require("fs");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const pinata_1 = require("pinata");
class PinataIPFSService {
    constructor(config) {
        this.config = config;
        if (config.jwt) {
            this.pinata = new pinata_1.PinataSDK({
                pinataJwt: config.jwt,
                pinataGateway: config.gatewayUrl,
            });
            logger_1.logger.info('Using Pinata SDK with JWT for authentication');
        }
        else {
            this.client = axios_1.default.create({
                baseURL: 'https://api.pinata.cloud',
                timeout: 30000,
                headers: {
                    'pinata_api_key': config.apiKey,
                    'pinata_secret_api_key': config.secretKey,
                },
            });
            logger_1.logger.info('Using Pinata API key/secret for authentication');
        }
        logger_1.logger.info('IPFS service initialized', {
            gatewayUrl: config.gatewayUrl,
        });
    }
    /**
     * Upload a directory to IPFS
     */
    async uploadDirectory(directoryPath, metadata) {
        try {
            logger_1.logger.info('Uploading directory to IPFS', { directoryPath });
            // Create a zip archive of the directory
            const tempZipPath = path_1.default.join(process.cwd(), 'temp', `upload-${Date.now()}.zip`);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(tempZipPath));
            await this.createZipArchive(directoryPath, tempZipPath);
            // Upload the zip file
            const result = await this.uploadFile(tempZipPath, {
                name: path_1.default.basename(directoryPath),
                ...metadata,
            });
            // Clean up temp file
            await fs_extra_1.default.remove(tempZipPath);
            logger_1.logger.info('Directory uploaded successfully', {
                directoryPath,
                ipfsHash: result.ipfsHash,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to upload directory', { directoryPath, error });
            throw (0, errors_1.createIPFSError)(`Failed to upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`, { directoryPath });
        }
    }
    /**
     * Upload a single file to IPFS
     */
    async uploadFile(filePath, metadata) {
        // Always use form-data approach for pkg compatibility
        try {
            logger_1.logger.debug('Uploading file to IPFS', { filePath });
            const formData = new form_data_1.default();
            const fileStream = (0, fs_1.createReadStream)(filePath);
            const fileName = path_1.default.basename(filePath);
            formData.append('file', fileStream, fileName);
            if (metadata) {
                formData.append('pinataMetadata', JSON.stringify({
                    name: metadata['name'] || 'json-content',
                    keyvalues: metadata,
                }));
            }
            const response = await this.client.post('/pinning/pinFileToIPFS', formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
            const result = {
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
            };
            logger_1.logger.debug('File uploaded successfully', {
                filePath,
                ipfsHash: result.ipfsHash,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to upload file', { filePath, error });
            throw (0, errors_1.createIPFSError)(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, { filePath });
        }
    }
    /**
     * Download a file from IPFS
     */
    async downloadFile(ipfsHash, outputPath) {
        try {
            logger_1.logger.info('Downloading file from IPFS', { ipfsHash, outputPath });
            const url = `https://${this.config.gatewayUrl}/ipfs/${ipfsHash}`;
            const response = await axios_1.default.get(url, {
                responseType: 'stream',
                timeout: 60000,
            });
            await fs_extra_1.default.ensureDir(path_1.default.dirname(outputPath));
            const writer = (0, fs_1.createWriteStream)(outputPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            logger_1.logger.info('File downloaded successfully', { ipfsHash, outputPath });
        }
        catch (error) {
            logger_1.logger.error('Failed to download file', { ipfsHash, outputPath, error });
            throw (0, errors_1.createIPFSError)(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash, outputPath });
        }
    }
    /**
     * Download and extract a package from IPFS
     */
    async downloadPackage(ipfsHash, extractPath) {
        try {
            logger_1.logger.info('Downloading and extracting package', { ipfsHash, extractPath });
            const tempZipPath = path_1.default.join(process.cwd(), 'temp', `download-${Date.now()}.zip`);
            await fs_extra_1.default.ensureDir(path_1.default.dirname(tempZipPath));
            // Download the zip file
            await this.downloadFile(ipfsHash, tempZipPath);
            // Extract the zip file
            await fs_extra_1.default.ensureDir(extractPath);
            await (0, extract_zip_1.default)(tempZipPath, { dir: path_1.default.resolve(extractPath) });
            // Clean up temp file
            await fs_extra_1.default.remove(tempZipPath);
            logger_1.logger.info('Package downloaded and extracted successfully', {
                ipfsHash,
                extractPath,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to download package', { ipfsHash, extractPath, error });
            throw (0, errors_1.createIPFSError)(`Failed to download package: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash, extractPath });
        }
    }
    /**
     * Get file content as string from IPFS
     */
    async getFileContent(ipfsHash) {
        try {
            logger_1.logger.debug('Getting file content from IPFS', { ipfsHash });
            const url = `https://${this.config.gatewayUrl}/ipfs/${ipfsHash}`;
            const response = await axios_1.default.get(url, {
                timeout: 30000,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get file content', { ipfsHash, error });
            throw (0, errors_1.createIPFSError)(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash });
        }
    }
    /**
     * Pin content to IPFS using Pinata
     */
    async pinJSON(content, metadata) {
        try {
            logger_1.logger.debug('Pinning JSON to IPFS', { contentKeys: Object.keys(content) });
            const data = {
                pinataContent: content,
                ...(metadata && {
                    pinataMetadata: {
                        name: metadata['name'] || 'json-content',
                        keyvalues: metadata,
                    },
                }),
            };
            const response = await this.client.post('/pinning/pinJSONToIPFS', data);
            const result = {
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
            };
            logger_1.logger.debug('JSON pinned successfully', { ipfsHash: result.ipfsHash });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to pin JSON', { error });
            throw (0, errors_1.createIPFSError)(`Failed to pin JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test connection to Pinata
     */
    async testConnection() {
        try {
            logger_1.logger.debug('Testing Pinata connection');
            const response = await this.client.get('/data/testAuthentication');
            const isAuthenticated = response.data.message === 'Congratulations! You are communicating with the Pinata API!';
            logger_1.logger.info('Pinata connection test', { authenticated: isAuthenticated });
            return isAuthenticated;
        }
        catch (error) {
            logger_1.logger.error('Pinata connection test failed', { error });
            return false;
        }
    }
    /**
     * Create a zip archive of a directory
     */
    async createZipArchive(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const output = (0, fs_1.createWriteStream)(outputPath);
                const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
                output.on('close', () => {
                    logger_1.logger.debug('Zip archive created', {
                        sourceDir,
                        outputPath,
                        size: archive.pointer(),
                    });
                    resolve();
                });
                archive.on('error', (error) => {
                    logger_1.logger.error('Failed to create zip archive', { error });
                    reject((0, errors_1.createFileSystemError)(`Failed to create zip archive: ${error.message}`));
                });
                archive.pipe(output);
                archive.directory(sourceDir, false);
                archive.finalize();
            }
            catch (error) {
                reject((0, errors_1.createFileSystemError)(`Failed to create zip archive: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });
    }
}
exports.PinataIPFSService = PinataIPFSService;
