"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AptosBlockchainService = exports.PLATFORM_ENDORSER_FEE = exports.PLATFORM_PUBLISH_FEE = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const types_1 = require("./types");
// Fee constants (in octas)
exports.PLATFORM_PUBLISH_FEE = 100000000; // 1 APT
exports.PLATFORM_ENDORSER_FEE = 100000000; // 1 APT
class AptosBlockchainService {
    constructor(network = ts_sdk_1.Network.TESTNET, nodeUrl) {
        this.config = new ts_sdk_1.AptosConfig({
            network,
            ...(nodeUrl && { fullnode: nodeUrl })
        });
        this.aptos = new ts_sdk_1.Aptos(this.config);
        logger_1.logger.info('Blockchain service initialized', {
            network,
            contractAddress: types_1.APM_CONTRACT_ADDRESS,
        });
    }
    /**
     * Get account information
     */
    async getAccountInfo(address) {
        try {
            const accountAddress = ts_sdk_1.AccountAddress.from(address);
            const accountInfo = await this.aptos.getAccountInfo({
                accountAddress,
            });
            logger_1.logger.debug('Retrieved account info', {
                address,
                sequenceNumber: accountInfo.sequence_number,
            });
            return accountInfo;
        }
        catch (error) {
            logger_1.logger.error('Failed to get account info', { address, error });
            throw (0, errors_1.createBlockchainError)(`Failed to get account info for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`, { address });
        }
    }
    /**
     * Fund account with APT (testnet/devnet only)
     */
    async fundAccount(address, amount = 100000000) {
        try {
            if (this.config.network === ts_sdk_1.Network.MAINNET) {
                throw (0, errors_1.createConfigError)('Cannot fund account on mainnet');
            }
            const accountAddress = ts_sdk_1.AccountAddress.from(address);
            await this.aptos.fundAccount({
                accountAddress,
                amount,
            });
            logger_1.logger.info('Account funded successfully', { address, amount });
        }
        catch (error) {
            logger_1.logger.error('Failed to fund account', { address, amount, error });
            throw (0, errors_1.createBlockchainError)(`Failed to fund account ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`, { address, amount });
        }
    }
    /**
     * Get account balance in APT (octas / 100000000)
     */
    async getAccountBalance(address) {
        try {
            const accountAddress = ts_sdk_1.AccountAddress.from(address);
            const balance = await this.aptos.getAccountAPTAmount({
                accountAddress,
            });
            logger_1.logger.debug('Retrieved account balance', { address, balance });
            return balance;
        }
        catch (error) {
            logger_1.logger.error('Failed to get account balance', { address, error });
            throw (0, errors_1.createBlockchainError)(`Failed to get account balance for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`, { address });
        }
    }
    /**
     * Check if account has sufficient balance for a fee
     */
    async checkSufficientBalance(address, feeAmount) {
        const balance = await this.getAccountBalance(address);
        return balance >= feeAmount;
    }
    /**
     * Format octas to APT for display
     */
    formatToAPT(octas) {
        return (octas / 100000000).toFixed(8).replace(/\.?0+$/, '');
    }
    /**
     * Publish a package to the registry
     */
    async publishPackage(signer, metadata) {
        try {
            logger_1.logger.info('Publishing package to registry', {
                packageName: metadata.name,
                version: metadata.version,
                ipfsHash: metadata.ipfsHash,
            });
            // Ensure tags is always an array of MoveString
            const tags = Array.isArray(metadata.tags) ? metadata.tags.map(tag => new ts_sdk_1.MoveString(String(tag))) : [];
            // Build function arguments in the exact order as the Move ABI, wrapping all strings in MoveString
            const functionArguments = [
                new ts_sdk_1.MoveString(metadata.name),
                new ts_sdk_1.MoveString(metadata.version),
                new ts_sdk_1.MoveString(metadata.ipfsHash),
                new ts_sdk_1.U8(0), // 0 = library, 1 = template
                tags,
                new ts_sdk_1.MoveString(metadata.description || ''),
            ];
            const transaction = await this.aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::publish_package`,
                    functionArguments,
                },
            });
            const senderAuthenticator = this.aptos.transaction.sign({
                signer,
                transaction,
            });
            const submittedTx = await this.aptos.transaction.submit.simple({
                transaction,
                senderAuthenticator,
            });
            logger_1.logger.info('Submitted transaction', { hash: submittedTx.hash });
            const txResult = await this.aptos.waitForTransaction({
                transactionHash: submittedTx.hash,
            });
            logger_1.logger.info('Transaction result', {
                transactionHash: submittedTx.hash,
                success: txResult.success,
                vmStatus: txResult.vm_status,
            });
            return {
                transactionHash: submittedTx.hash,
                success: txResult.success,
                vmStatus: txResult.vm_status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to publish package', {
                packageName: metadata.name,
                error,
            });
            throw (0, errors_1.createBlockchainError)(`Failed to publish package ${metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, { packageName: metadata.name });
        }
    }
    /**
     * Get package metadata
     */
    async getPackageMetadata(name, version) {
        try {
            logger_1.logger.debug('Getting package metadata', { name, version });
            let actualVersion = version;
            if (!actualVersion) {
                // Fetch latest version if not provided
                const versions = await this.getPackageVersions(name);
                if (!versions || versions.length === 0) {
                    logger_1.logger.error('No versions found for package', { name });
                    return null;
                }
                actualVersion = versions[versions.length - 1]; // Use the latest version
                logger_1.logger.debug('No version specified, using latest', { name, actualVersion });
            }
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::get_package_metadata`,
                    functionArguments: [name, actualVersion],
                },
            });
            if (!response || response.length === 0) {
                logger_1.logger.error('No metadata found for package', { name, version: actualVersion });
                return null;
            }
            // The response is a struct representing the package metadata
            const metadata = response[0];
            if (!metadata || typeof metadata !== 'object') {
                logger_1.logger.error('Invalid metadata response', { name, version: actualVersion });
                return null;
            }
            return this.parsePackageMetadata(metadata);
        }
        catch (error) {
            logger_1.logger.error('Failed to get package metadata', { name, version, error });
            throw (0, errors_1.createBlockchainError)(`Failed to get package metadata for ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, { name, version });
        }
    }
    /**
     * Get package versions
     */
    async getPackageVersions(name) {
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::get_package_versions`,
                    functionArguments: [name],
                },
            });
            const result = response && response[0];
            let versions = [];
            if (result && Array.isArray(result)) {
                versions = result;
            }
            else if (result && typeof result === 'object' && 'values' in result && Array.isArray(result.values)) {
                versions = result.values.map((v) => v.value);
                return versions;
            }
            else {
                return [];
            }
            // If plain array, just return as is
            return versions;
        }
        catch (error) {
            logger_1.logger.error('Failed to get package versions', { name, error });
            throw (0, errors_1.createBlockchainError)(`Failed to get versions for package ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`, { name });
        }
    }
    /**
     * Search packages
     */
    async searchPackages(query) {
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::search_packages`,
                    functionArguments: [query],
                },
            });
            if (!response || response.length === 0) {
                return [];
            }
            const results = response[0];
            if (!results || !(results instanceof ts_sdk_1.MoveVector)) {
                return [];
            }
            return results.values.map(result => {
                if (!result || typeof result !== 'object') {
                    return null;
                }
                const values = Object.values(result).map(value => value);
                return this.parsePackageMetadata(values);
            }).filter((pkg) => pkg !== null);
        }
        catch (error) {
            logger_1.logger.error('Failed to search packages', { query, error });
            throw (0, errors_1.createBlockchainError)(`Failed to search packages: ${error instanceof Error ? error.message : 'Unknown error'}`, { query });
        }
    }
    /**
     * Get registry stats
     */
    async getRegistryStats() {
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::get_registry_stats`,
                    functionArguments: [],
                },
            });
            if (!response || response.length === 0) {
                throw new Error('Invalid registry stats response');
            }
            const stats = response[0];
            if (!stats || typeof stats !== 'object') {
                throw new Error('Invalid registry stats response');
            }
            const values = Object.values(stats).map(value => value);
            return this.parseRegistryStats(values);
        }
        catch (error) {
            logger_1.logger.error('Failed to get registry stats', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get registry stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get endorser info
     */
    async getEndorserInfo(address) {
        try {
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::get_endorser_info`,
                    functionArguments: [address],
                },
            });
            if (!response || response.length === 0) {
                return null;
            }
            const info = response[0];
            if (!info || typeof info !== 'object') {
                return null;
            }
            const values = Object.values(info).map(value => value);
            return this.parseEndorserInfo(values);
        }
        catch (error) {
            logger_1.logger.error('Failed to get endorser info', { address, error });
            throw (0, errors_1.createBlockchainError)(`Failed to get endorser info for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`, { address });
        }
    }
    /**
     * Register as an endorser
     */
    async registerEndorser(signer, stakeAmount) {
        try {
            const transaction = await this.aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::register_endorser`,
                    functionArguments: [stakeAmount],
                },
            });
            const senderAuthenticator = this.aptos.transaction.sign({
                signer,
                transaction,
            });
            const submittedTx = await this.aptos.transaction.submit.simple({
                transaction,
                senderAuthenticator,
            });
            const txResult = await this.aptos.waitForTransaction({
                transactionHash: submittedTx.hash,
            });
            return {
                transactionHash: submittedTx.hash,
                success: txResult.success,
                vmStatus: txResult.vm_status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to register endorser', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to register endorser: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Endorse a package
     */
    async endorsePackage(signer, name, version) {
        try {
            const transaction = await this.aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::endorse_package`,
                    functionArguments: [name, version],
                },
            });
            const senderAuthenticator = this.aptos.transaction.sign({
                signer,
                transaction,
            });
            const submittedTx = await this.aptos.transaction.submit.simple({
                transaction,
                senderAuthenticator,
            });
            const txResult = await this.aptos.waitForTransaction({
                transactionHash: submittedTx.hash,
            });
            return {
                transactionHash: submittedTx.hash,
                success: txResult.success,
                vmStatus: txResult.vm_status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to endorse package', { name, version, error });
            throw (0, errors_1.createBlockchainError)(`Failed to endorse package ${name}@${version}: ${error instanceof Error ? error.message : 'Unknown error'}`, { name, version });
        }
    }
    /**
     * Tip a package
     */
    async tipPackage(signer, name, version, amount) {
        try {
            const transaction = await this.aptos.transaction.build.simple({
                sender: signer.accountAddress,
                data: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::tip_package`,
                    functionArguments: [name, version, amount],
                },
            });
            const senderAuthenticator = this.aptos.transaction.sign({
                signer,
                transaction,
            });
            const submittedTx = await this.aptos.transaction.submit.simple({
                transaction,
                senderAuthenticator,
            });
            const txResult = await this.aptos.waitForTransaction({
                transactionHash: submittedTx.hash,
            });
            return {
                transactionHash: submittedTx.hash,
                success: txResult.success,
                vmStatus: txResult.vm_status,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to tip package', { name, version, amount, error });
            throw (0, errors_1.createBlockchainError)(`Failed to tip package ${name}@${version}: ${error instanceof Error ? error.message : 'Unknown error'}`, { name, version, amount });
        }
    }
    /**
     * Create account from private key
     */
    createAccountFromPrivateKey(privateKeyString) {
        try {
            const privateKey = new ts_sdk_1.Ed25519PrivateKey(privateKeyString);
            return ts_sdk_1.Account.fromPrivateKey({ privateKey });
        }
        catch (error) {
            throw (0, errors_1.createBlockchainError)(`Failed to create account from private key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate new account
     */
    generateAccount() {
        return ts_sdk_1.Account.generate();
    }
    /**
     * Parse Move values into TypeScript types
     */
    parseMoveValue(value) {
        if (value instanceof ts_sdk_1.U64 || value instanceof ts_sdk_1.U128) {
            return Number(value.value);
        }
        else if (value instanceof ts_sdk_1.Bool) {
            return value.value;
        }
        else if (value instanceof ts_sdk_1.MoveString) {
            return value.value;
        }
        else if (value instanceof ts_sdk_1.MoveVector) {
            return value.values.map(v => this.parseMoveValue(v));
        }
        else if (value === null || value === undefined) {
            return null;
        }
        else {
            return value;
        }
    }
    /**
     * Parse package metadata from Move values
     */
    parsePackageMetadata(response) {
        return {
            name: this.parseMoveValue(response.name),
            version: this.parseMoveValue(response.version),
            publisher: this.parseMoveValue(response.publisher),
            ipfsHash: this.parseMoveValue(response.ipfs_hash),
            endorsements: this.parseMoveValue(response.endorsements),
            timestamp: this.parseMoveValue(response.timestamp),
            packageType: this.parseMoveValue(response.package_type),
            downloadCount: this.parseMoveValue(response.download_count),
            totalTips: this.parseMoveValue(response.total_tips),
            tags: this.parseMoveValue(response.tags),
            description: this.parseMoveValue(response.description),
        };
    }
    /**
     * Parse endorser info from Move values
     */
    parseEndorserInfo(response) {
        if (!response || response.length < 6) {
            throw new Error('Invalid endorser info response');
        }
        return {
            endorser: this.parseMoveValue(response[0]),
            stakeAmount: this.parseMoveValue(response[1]),
            isActive: this.parseMoveValue(response[2]),
            reputation: this.parseMoveValue(response[3]),
            packagesEndorsed: this.parseMoveValue(response[4]),
            registeredAt: this.parseMoveValue(response[5]),
        };
    }
    /**
     * Parse registry stats from Move values
     */
    parseRegistryStats(response) {
        if (!response || response.length < 4) {
            throw new Error('Invalid registry stats response');
        }
        return {
            totalPackages: this.parseMoveValue(response[0]),
            totalEndorsers: this.parseMoveValue(response[1]),
            totalDownloads: this.parseMoveValue(response[2]),
            totalTips: this.parseMoveValue(response[3]),
        };
    }
    /**
     * Get package published events
     */
    async getPackagePublishedEvents(limit = 10) {
        try {
            const events = await this.aptos.getEvents({
                options: {
                    limit,
                    where: {
                        account_address: { _eq: types_1.APM_CONTRACT_ADDRESS },
                        creation_number: { _eq: 0 }, // Assuming this is the first event stream
                    },
                },
            });
            return events.map(event => ({
                name: this.parseMoveValue(event.data.name),
                version: this.parseMoveValue(event.data.version),
                publisher: this.parseMoveValue(event.data.publisher),
                packageType: this.parseMoveValue(event.data.package_type),
                timestamp: Number(event.sequence_number),
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get package published events', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get package published events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get package endorsed events
     */
    async getPackageEndorsedEvents(limit = 10) {
        try {
            const events = await this.aptos.getEvents({
                options: {
                    limit,
                    where: {
                        account_address: { _eq: types_1.APM_CONTRACT_ADDRESS },
                        creation_number: { _eq: 1 }, // Assuming this is the second event stream
                    },
                },
            });
            return events.map(event => ({
                name: this.parseMoveValue(event.data.name),
                version: this.parseMoveValue(event.data.version),
                endorser: this.parseMoveValue(event.data.endorser),
                timestamp: Number(event.sequence_number),
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get package endorsed events', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get package endorsed events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get package tipped events
     */
    async getPackageTippedEvents(limit = 10) {
        try {
            const events = await this.aptos.getEvents({
                options: {
                    limit,
                    where: {
                        account_address: { _eq: types_1.APM_CONTRACT_ADDRESS },
                        creation_number: { _eq: 2 }, // Assuming this is the third event stream
                    },
                },
            });
            return events.map(event => ({
                name: this.parseMoveValue(event.data.name),
                version: this.parseMoveValue(event.data.version),
                tipper: this.parseMoveValue(event.data.tipper),
                amount: this.parseMoveValue(event.data.amount),
                timestamp: Number(event.sequence_number),
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get package tipped events', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get package tipped events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get endorser registered events
     */
    async getEndorserRegisteredEvents(limit = 10) {
        try {
            const events = await this.aptos.getEvents({
                options: {
                    limit,
                    where: {
                        account_address: { _eq: types_1.APM_CONTRACT_ADDRESS },
                        creation_number: { _eq: 3 }, // Assuming this is the fourth event stream
                    },
                },
            });
            return events.map(event => ({
                endorser: this.parseMoveValue(event.data.endorser),
                stakeAmount: this.parseMoveValue(event.data.stake_amount),
                timestamp: Number(event.sequence_number),
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to get endorser registered events', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get endorser registered events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get all packages (off-chain aggregation)
     */
    async getAllPackages() {
        try {
            // Fetch all package IDs from package_list
            const response = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::get_total_packages`,
                    functionArguments: [],
                },
            });
            // If total is 0, return empty
            if (!response || response.length === 0 || response[0] === 0) {
                return [];
            }
            // Fetch the package_list vector
            const listResponse = await this.aptos.view({
                payload: {
                    function: `${types_1.APM_CONTRACT_ADDRESS}::${types_1.APM_MODULE_NAME}::search_packages`,
                    functionArguments: [''], // empty string returns all
                },
            });
            if (!listResponse || listResponse.length === 0) {
                return [];
            }
            // Correctly unwrap the nested array
            const results = Array.isArray(listResponse) && Array.isArray(listResponse[0]) ? listResponse[0] : [];
            return results.map(result => {
                if (!result || typeof result !== 'object') {
                    return null;
                }
                return this.parsePackageMetadata(result);
            }).filter((pkg) => pkg !== null);
        }
        catch (error) {
            logger_1.logger.error('Failed to get all packages', { error });
            throw (0, errors_1.createBlockchainError)(`Failed to get all packages: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.AptosBlockchainService = AptosBlockchainService;
