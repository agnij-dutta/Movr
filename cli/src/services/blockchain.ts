import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  AccountAddress,
  Ed25519PrivateKey,
  MoveValue,
  U64,
  U128,
  Bool,
  MoveString,
  MoveVector,
  AnyNumber,
  Event,
  Serializer,
  U8,
} from '@aptos-labs/ts-sdk';
import { logger } from '../utils/logger.js';
import { createBlockchainError, createConfigError } from '../utils/errors.js';
import {
  APM_CONTRACT_ADDRESS,
  APM_MODULE_NAME,
  PackageMetadata,
  EndorserInfo,
  RegistryStats,
  TransactionResult,
  PACKAGE_TYPE_LIBRARY,
  PACKAGE_TYPE_TEMPLATE,
  PackagePublishedEvent,
  PackageEndorsedEvent,
  PackageTippedEvent,
  EndorserRegisteredEvent,
} from './types.js';

// Fee constants (in octas)
export const PLATFORM_PUBLISH_FEE = 100000000; // 1 APT
export const PLATFORM_ENDORSER_FEE = 100000000; // 1 APT

export class AptosBlockchainService {
  private aptos: Aptos;
  private config: AptosConfig;

  constructor(network: Network = Network.TESTNET, nodeUrl?: string) {
    this.config = new AptosConfig({ 
      network,
      ...(nodeUrl && { fullnode: nodeUrl })
    });
    
    this.aptos = new Aptos(this.config);
    
    logger.info('Blockchain service initialized', {
      network,
      contractAddress: APM_CONTRACT_ADDRESS,
    });
  }

  /**
   * Get account information
   */
  async getAccountInfo(address: string) {
    try {
      const accountAddress = AccountAddress.from(address);
      const accountInfo = await this.aptos.getAccountInfo({
        accountAddress,
      });
      
      logger.debug('Retrieved account info', {
        address,
        sequenceNumber: accountInfo.sequence_number,
      });
      
      return accountInfo;
    } catch (error) {
      logger.error('Failed to get account info', { address, error });
      throw createBlockchainError(
        `Failed to get account info for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address }
      );
    }
  }

  /**
   * Fund account with APT (testnet/devnet only)
   */
  async fundAccount(address: string, amount: number = 100_000_000): Promise<void> {
    try {
      if (this.config.network === Network.MAINNET) {
        throw createConfigError('Cannot fund account on mainnet');
      }

      const accountAddress = AccountAddress.from(address);
      await this.aptos.fundAccount({
        accountAddress,
        amount,
      });
      
      logger.info('Account funded successfully', { address, amount });
    } catch (error) {
      logger.error('Failed to fund account', { address, amount, error });
      throw createBlockchainError(
        `Failed to fund account ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address, amount }
      );
    }
  }

  /**
   * Get account balance in APT (octas / 100000000)
   */
  async getAccountBalance(address: string): Promise<number> {
    try {
      const accountAddress = AccountAddress.from(address);
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress,
      });
      
      logger.debug('Retrieved account balance', { address, balance });
      return balance;
    } catch (error) {
      logger.error('Failed to get account balance', { address, error });
      throw createBlockchainError(
        `Failed to get account balance for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address }
      );
    }
  }

  /**
   * Check if account has sufficient balance for a fee
   */
  async checkSufficientBalance(address: string, feeAmount: number): Promise<boolean> {
    const balance = await this.getAccountBalance(address);
    return balance >= feeAmount;
  }

  /**
   * Format octas to APT for display
   */
  formatToAPT(octas: number): string {
    return (octas / 100000000).toFixed(8).replace(/\.?0+$/, '');
  }

  /**
   * Publish a package to the registry
   */
  async publishPackage(
    signer: Account,
    metadata: PackageMetadata
  ): Promise<TransactionResult> {
    try {
      logger.info('Publishing package to registry', {
        packageName: metadata.name,
        version: metadata.version,
        ipfsHash: metadata.ipfsHash,
      });

      console.log('DEBUG: publishPackage args:', {
        name: metadata.name,
        version: metadata.version,
        ipfsHash: metadata.ipfsHash,
        package_type: 1,
        tags: metadata.tags,
        description: metadata.description,
      });

      // Ensure tags is always an array of MoveString
      const tags: MoveString[] = Array.isArray(metadata.tags) ? metadata.tags.map(tag => new MoveString(String(tag))) : [];
      // Enhanced debug logging for all arguments
      console.log('DEBUG: publishPackage argument details:');
      console.log('  name:', metadata.name, '| type:', typeof metadata.name, '| length:', typeof metadata.name === 'string' ? metadata.name.length : 'N/A');
      console.log('  version:', metadata.version, '| type:', typeof metadata.version, '| length:', typeof metadata.version === 'string' ? metadata.version.length : 'N/A');
      console.log('  ipfsHash:', metadata.ipfsHash, '| type:', typeof metadata.ipfsHash, '| length:', typeof metadata.ipfsHash === 'string' ? metadata.ipfsHash.length : 'N/A');
      console.log('  package_type:', 0, '| type:', typeof 0);
      console.log('  tags:', tags, '| type:', Array.isArray(tags) ? 'array' : typeof tags, '| length:', tags.length);
      console.log('  description:', metadata.description, '| type:', typeof metadata.description, '| length:', typeof metadata.description === 'string' ? metadata.description.length : 'N/A');
      // Build function arguments in the exact order as the Move ABI, wrapping all strings in MoveString
      const functionArguments = [
        new MoveString(metadata.name),
        new MoveString(metadata.version),
        new MoveString(metadata.ipfsHash),
        new U8(0), // 0 = library, 1 = template
        tags,
        new MoveString(metadata.description || ''),
      ];
      // --- DEBUG LOGGING ---
      console.log('DEBUG: functionArguments:', functionArguments);
      functionArguments.forEach((arg, i) => {
        console.log(`Arg ${i}:`, arg, '| type:', Array.isArray(arg) ? 'array' : typeof arg, '| length:', typeof arg === 'string' ? arg : Array.isArray(arg) ? Array.prototype.slice.call(arg).length : 'N/A');
      });
      // --- END DEBUG LOGGING ---
      const transaction = await this.aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::publish_package`,
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

      logger.info('Submitted transaction', { hash: submittedTx.hash });

      const txResult = await this.aptos.waitForTransaction({
        transactionHash: submittedTx.hash,
      });

      logger.info('Transaction result', {
        transactionHash: submittedTx.hash,
        success: txResult.success,
        vmStatus: txResult.vm_status,
      });

      return {
        transactionHash: submittedTx.hash,
        success: txResult.success,
        vmStatus: txResult.vm_status,
      };
    } catch (error) {
      logger.error('Failed to publish package', {
        packageName: metadata.name,
        error,
      });
      throw createBlockchainError(
        `Failed to publish package ${metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { packageName: metadata.name }
      );
    }
  }

  /**
   * Get package metadata
   */
  async getPackageMetadata(name: string, version?: string): Promise<PackageMetadata | null> {
    try {
      logger.debug('Getting package metadata', { name, version });

      let actualVersion = version;
      if (!actualVersion) {
        // Fetch latest version if not provided
        const versions = await this.getPackageVersions(name);
        if (!versions || versions.length === 0) {
          logger.error('No versions found for package', { name });
          return null;
        }
        actualVersion = versions[versions.length - 1]; // Use the latest version
        logger.debug('No version specified, using latest', { name, actualVersion });
      }

      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::get_package_metadata`,
          functionArguments: [name, actualVersion],
        },
      });

      if (!response || response.length === 0) {
        logger.error('No metadata found for package', { name, version: actualVersion });
        return null;
      }

      // The response is a struct representing the package metadata
      const metadata = response[0];
      if (!metadata || typeof metadata !== 'object') {
        logger.error('Invalid metadata response', { name, version: actualVersion });
        return null;
      }

      return this.parsePackageMetadata(metadata);
    } catch (error) {
      logger.error('Failed to get package metadata', { name, version, error });
      throw createBlockchainError(
        `Failed to get package metadata for ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name, version }
      );
    }
  }

  /**
   * Get package versions
   */
  async getPackageVersions(name: string): Promise<string[]> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::get_package_versions`,
          functionArguments: [name],
        },
      });

      const result = response && response[0];
      let versions: any[] = [];
      if (result && Array.isArray(result)) {
        versions = result;
      } else if (result && typeof result === 'object' && 'values' in result && Array.isArray(result.values)) {
        versions = result.values.map((v: any) => v.value);
        return versions;
      } else {
        return [];
      }
      // If plain array, just return as is
      return versions;
    } catch (error) {
      logger.error('Failed to get package versions', { name, error });
      throw createBlockchainError(
        `Failed to get versions for package ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name }
      );
    }
  }

  /**
   * Search packages
   */
  async searchPackages(query: string): Promise<PackageMetadata[]> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::search_packages`,
          functionArguments: [query],
        },
      });

      if (!response || response.length === 0) {
        return [];
      }

      const results = response[0];
      if (!results || !(results instanceof MoveVector)) {
        return [];
      }

      return results.values.map(result => {
        if (!result || typeof result !== 'object') {
          return null;
        }
        const values = Object.values(result).map(value => value as MoveValue);
        return this.parsePackageMetadata(values);
      }).filter((pkg): pkg is PackageMetadata => pkg !== null);
    } catch (error) {
      logger.error('Failed to search packages', { query, error });
      throw createBlockchainError(
        `Failed to search packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { query }
      );
    }
  }

  /**
   * Get registry stats
   */
  async getRegistryStats(): Promise<RegistryStats> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::get_registry_stats`,
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

      const values = Object.values(stats).map(value => value as MoveValue);
      return this.parseRegistryStats(values);
    } catch (error) {
      logger.error('Failed to get registry stats', { error });
      throw createBlockchainError(
        `Failed to get registry stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get endorser info
   */
  async getEndorserInfo(address: string): Promise<EndorserInfo | null> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::get_endorser_info`,
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

      const values = Object.values(info).map(value => value as MoveValue);
      return this.parseEndorserInfo(values);
    } catch (error) {
      logger.error('Failed to get endorser info', { address, error });
      throw createBlockchainError(
        `Failed to get endorser info for ${address}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address }
      );
    }
  }

  /**
   * Register as an endorser
   */
  async registerEndorser(signer: Account, stakeAmount: number): Promise<TransactionResult> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::register_endorser`,
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
    } catch (error) {
      logger.error('Failed to register endorser', { error });
      throw createBlockchainError(
        `Failed to register endorser: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Endorse a package
   */
  async endorsePackage(
    signer: Account,
    name: string,
    version: string
  ): Promise<TransactionResult> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::endorse_package`,
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
    } catch (error) {
      logger.error('Failed to endorse package', { name, version, error });
      throw createBlockchainError(
        `Failed to endorse package ${name}@${version}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name, version }
      );
    }
  }

  /**
   * Tip a package
   */
  async tipPackage(
    signer: Account,
    name: string,
    version: string,
    amount: number
  ): Promise<TransactionResult> {
    try {
      const transaction = await this.aptos.transaction.build.simple({
        sender: signer.accountAddress,
        data: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::tip_package`,
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
    } catch (error) {
      logger.error('Failed to tip package', { name, version, amount, error });
      throw createBlockchainError(
        `Failed to tip package ${name}@${version}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { name, version, amount }
      );
    }
  }

  /**
   * Create account from private key
   */
  createAccountFromPrivateKey(privateKeyString: string): Account {
    try {
      const privateKey = new Ed25519PrivateKey(privateKeyString);
      return Account.fromPrivateKey({ privateKey });
    } catch (error) {
      throw createBlockchainError(
        `Failed to create account from private key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate new account
   */
  generateAccount(): Account {
    return Account.generate();
  }

  /**
   * Parse Move values into TypeScript types
   */
  private parseMoveValue(value: MoveValue): any {
    if (value instanceof U64 || value instanceof U128) {
      return Number(value.value);
    } else if (value instanceof Bool) {
      return value.value;
    } else if (value instanceof MoveString) {
      return value.value;
    } else if (value instanceof MoveVector) {
      return value.values.map(v => this.parseMoveValue(v));
    } else if (value === null || value === undefined) {
      return null;
    } else {
      return value;
    }
  }

  /**
   * Parse package metadata from Move values
   */
  private parsePackageMetadata(response: any): PackageMetadata {
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
  private parseEndorserInfo(response: MoveValue[]): EndorserInfo {
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
  private parseRegistryStats(response: MoveValue[]): RegistryStats {
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
  async getPackagePublishedEvents(limit: number = 10): Promise<PackagePublishedEvent[]> {
    try {
      const events = await this.aptos.getEvents({
        options: {
          limit,
          where: {
            account_address: { _eq: APM_CONTRACT_ADDRESS },
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
    } catch (error) {
      logger.error('Failed to get package published events', { error });
      throw createBlockchainError(
        `Failed to get package published events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get package endorsed events
   */
  async getPackageEndorsedEvents(limit: number = 10): Promise<PackageEndorsedEvent[]> {
    try {
      const events = await this.aptos.getEvents({
        options: {
          limit,
          where: {
            account_address: { _eq: APM_CONTRACT_ADDRESS },
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
    } catch (error) {
      logger.error('Failed to get package endorsed events', { error });
      throw createBlockchainError(
        `Failed to get package endorsed events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get package tipped events
   */
  async getPackageTippedEvents(limit: number = 10): Promise<PackageTippedEvent[]> {
    try {
      const events = await this.aptos.getEvents({
        options: {
          limit,
          where: {
            account_address: { _eq: APM_CONTRACT_ADDRESS },
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
    } catch (error) {
      logger.error('Failed to get package tipped events', { error });
      throw createBlockchainError(
        `Failed to get package tipped events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get endorser registered events
   */
  async getEndorserRegisteredEvents(limit: number = 10): Promise<EndorserRegisteredEvent[]> {
    try {
      const events = await this.aptos.getEvents({
        options: {
          limit,
          where: {
            account_address: { _eq: APM_CONTRACT_ADDRESS },
            creation_number: { _eq: 3 }, // Assuming this is the fourth event stream
          },
        },
      });

      return events.map(event => ({
        endorser: this.parseMoveValue(event.data.endorser),
        stakeAmount: this.parseMoveValue(event.data.stake_amount),
        timestamp: Number(event.sequence_number),
      }));
    } catch (error) {
      logger.error('Failed to get endorser registered events', { error });
      throw createBlockchainError(
        `Failed to get endorser registered events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all packages (off-chain aggregation)
   */
  async getAllPackages(): Promise<PackageMetadata[]> {
    try {
      // Fetch all package IDs from package_list
      const response = await this.aptos.view({
        payload: {
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::get_total_packages`,
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
          function: `${APM_CONTRACT_ADDRESS}::${APM_MODULE_NAME}::search_packages`,
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
      }).filter((pkg): pkg is PackageMetadata => pkg !== null);
    } catch (error) {
      logger.error('Failed to get all packages', { error });
      throw createBlockchainError(
        `Failed to get all packages: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
} 