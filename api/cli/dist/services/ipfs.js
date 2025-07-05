import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import extractZip from 'extract-zip';
import { createReadStream, createWriteStream } from 'fs';
import { logger } from '../utils/logger.js';
import { createIPFSError, createFileSystemError } from '../utils/errors.js';
import { PinataSDK } from "pinata";
import { File as NodeFile } from "formdata-node";
export class PinataIPFSService {
    client;
    config;
    pinata;
    constructor(config) {
        this.config = config;
        if (config.jwt) {
            this.pinata = new PinataSDK({
                pinataJwt: config.jwt,
                pinataGateway: config.gatewayUrl,
            });
            logger.info('Using Pinata SDK with JWT for authentication');
        }
        else {
            this.client = axios.create({
                baseURL: 'https://api.pinata.cloud',
                timeout: 30000,
                headers: {
                    'pinata_api_key': config.apiKey,
                    'pinata_secret_api_key': config.secretKey,
                },
            });
            logger.info('Using Pinata API key/secret for authentication');
        }
        logger.info('IPFS service initialized', {
            gatewayUrl: config.gatewayUrl,
        });
    }
    /**
     * Upload a directory to IPFS
     */
    async uploadDirectory(directoryPath, metadata) {
        try {
            logger.info('Uploading directory to IPFS', { directoryPath });
            // Create a zip archive of the directory
            const tempZipPath = path.join(process.cwd(), 'temp', `upload-${Date.now()}.zip`);
            await fs.ensureDir(path.dirname(tempZipPath));
            await this.createZipArchive(directoryPath, tempZipPath);
            // Upload the zip file
            const result = await this.uploadFile(tempZipPath, {
                name: path.basename(directoryPath),
                ...metadata,
            });
            // Clean up temp file
            await fs.remove(tempZipPath);
            logger.info('Directory uploaded successfully', {
                directoryPath,
                ipfsHash: result.ipfsHash,
            });
            return result;
        }
        catch (error) {
            logger.error('Failed to upload directory', { directoryPath, error });
            throw createIPFSError(`Failed to upload directory: ${error instanceof Error ? error.message : 'Unknown error'}`, { directoryPath });
        }
    }
    /**
     * Upload a single file to IPFS
     */
    async uploadFile(filePath, metadata) {
        if (this.pinata) {
            // Use Pinata SDK
            try {
                logger.debug('Uploading file to IPFS via Pinata SDK', { filePath });
                const fileBuffer = await fs.readFile(filePath);
                // Pinata SDK expects a browser File, but formdata-node's File is compatible for Node.js
                // We cast as any to satisfy the SDK's type check
                const file = new NodeFile([fileBuffer], path.basename(filePath));
                const upload = await this.pinata.upload.public.file(file);
                // Pinata SDK returns { cid, size, ... }
                return {
                    ipfsHash: upload.cid,
                    pinSize: upload.size || fileBuffer.length,
                    timestamp: new Date().toISOString(),
                };
            }
            catch (error) {
                logger.error('Failed to upload file via Pinata SDK', { filePath, error });
                throw createIPFSError(`Failed to upload file via Pinata SDK: ${error instanceof Error ? error.message : 'Unknown error'}`, { filePath });
            }
        }
        else {
            // Fallback to legacy Axios method
            try {
                logger.debug('Uploading file to IPFS (legacy)', { filePath });
                const formData = new FormData();
                const fileStream = createReadStream(filePath);
                const fileName = path.basename(filePath);
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
                logger.debug('File uploaded successfully', {
                    filePath,
                    ipfsHash: result.ipfsHash,
                });
                return result;
            }
            catch (error) {
                logger.error('Failed to upload file', { filePath, error });
                throw createIPFSError(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`, { filePath });
            }
        }
    }
    /**
     * Download a file from IPFS
     */
    async downloadFile(ipfsHash, outputPath) {
        try {
            logger.info('Downloading file from IPFS', { ipfsHash, outputPath });
            const url = `https://${this.config.gatewayUrl}/ipfs/${ipfsHash}`;
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout: 60000,
            });
            await fs.ensureDir(path.dirname(outputPath));
            const writer = createWriteStream(outputPath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
            logger.info('File downloaded successfully', { ipfsHash, outputPath });
        }
        catch (error) {
            logger.error('Failed to download file', { ipfsHash, outputPath, error });
            throw createIPFSError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash, outputPath });
        }
    }
    /**
     * Download and extract a package from IPFS
     */
    async downloadPackage(ipfsHash, extractPath) {
        try {
            logger.info('Downloading and extracting package', { ipfsHash, extractPath });
            const tempZipPath = path.join(process.cwd(), 'temp', `download-${Date.now()}.zip`);
            await fs.ensureDir(path.dirname(tempZipPath));
            // Download the zip file
            await this.downloadFile(ipfsHash, tempZipPath);
            // Extract the zip file
            await fs.ensureDir(extractPath);
            await extractZip(tempZipPath, { dir: path.resolve(extractPath) });
            // Clean up temp file
            await fs.remove(tempZipPath);
            logger.info('Package downloaded and extracted successfully', {
                ipfsHash,
                extractPath,
            });
        }
        catch (error) {
            logger.error('Failed to download package', { ipfsHash, extractPath, error });
            throw createIPFSError(`Failed to download package: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash, extractPath });
        }
    }
    /**
     * Get file content as string from IPFS
     */
    async getFileContent(ipfsHash) {
        try {
            logger.debug('Getting file content from IPFS', { ipfsHash });
            const url = `https://${this.config.gatewayUrl}/ipfs/${ipfsHash}`;
            const response = await axios.get(url, {
                timeout: 30000,
            });
            return response.data;
        }
        catch (error) {
            logger.error('Failed to get file content', { ipfsHash, error });
            throw createIPFSError(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`, { ipfsHash });
        }
    }
    /**
     * Pin content to IPFS using Pinata
     */
    async pinJSON(content, metadata) {
        try {
            logger.debug('Pinning JSON to IPFS', { contentKeys: Object.keys(content) });
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
            logger.debug('JSON pinned successfully', { ipfsHash: result.ipfsHash });
            return result;
        }
        catch (error) {
            logger.error('Failed to pin JSON', { error });
            throw createIPFSError(`Failed to pin JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Test connection to Pinata
     */
    async testConnection() {
        try {
            logger.debug('Testing Pinata connection');
            const response = await this.client.get('/data/testAuthentication');
            const isAuthenticated = response.data.message === 'Congratulations! You are communicating with the Pinata API!';
            logger.info('Pinata connection test', { authenticated: isAuthenticated });
            return isAuthenticated;
        }
        catch (error) {
            logger.error('Pinata connection test failed', { error });
            return false;
        }
    }
    /**
     * Create a zip archive of a directory
     */
    async createZipArchive(sourceDir, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const output = createWriteStream(outputPath);
                const archive = archiver('zip', { zlib: { level: 9 } });
                output.on('close', () => {
                    logger.debug('Zip archive created', {
                        sourceDir,
                        outputPath,
                        size: archive.pointer(),
                    });
                    resolve();
                });
                archive.on('error', (error) => {
                    logger.error('Failed to create zip archive', { error });
                    reject(createFileSystemError(`Failed to create zip archive: ${error.message}`));
                });
                archive.pipe(output);
                archive.directory(sourceDir, false);
                archive.finalize();
            }
            catch (error) {
                reject(createFileSystemError(`Failed to create zip archive: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        });
    }
}
