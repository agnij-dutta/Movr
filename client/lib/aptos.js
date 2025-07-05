// Aptos contract/module config (hardcoded)
export const CONTRACT_ADDRESS = '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34';
export const MODULE_NAME = 'registry';

import { Aptos, AptosConfig, Network, AccountAddress, MoveString, U8 } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

// Connect wallet (browser extension)
export async function connectWallet() {
  if (window.aptos) {
    await window.aptos.connect();
    return window.aptos.account;
  }
  throw new Error('Aptos wallet not found');
}

// Publish a package (calls publish_package)
export async function publishPackage(signer, metadata) {
  const functionArguments = [
    new MoveString(metadata.name),
    new MoveString(metadata.version),
    new MoveString(metadata.ipfsHash),
    new U8(0), // 0 = library
    (metadata.tags || []).map(t => new MoveString(String(t))),
    new MoveString(metadata.description || ''),
  ];
  const tx = await aptos.transaction.build.simple({
    sender: signer.address,
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::publish_package`,
      functionArguments,
    },
  });
  const signed = await window.aptos.signAndSubmitTransaction(tx);
  return signed.hash;
}

// Search packages (calls search_packages)
export async function searchPackages(query) {
  const res = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::search_packages`,
      functionArguments: [query],
    },
  });
  return res[0];
}

// Endorse a package
export async function endorsePackage(signer, name, version) {
  const tx = await aptos.transaction.build.simple({
    sender: signer.address,
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::endorse_package`,
      functionArguments: [name, version],
    },
  });
  const signed = await window.aptos.signAndSubmitTransaction(tx);
  return signed.hash;
}

// Tip a package
export async function tipPackage(signer, name, version, amount) {
  const tx = await aptos.transaction.build.simple({
    sender: signer.address,
    data: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::tip_package`,
      functionArguments: [name, version, amount],
    },
  });
  const signed = await window.aptos.signAndSubmitTransaction(tx);
  return signed.hash;
}

// Get package metadata
export async function getPackageMetadata(name, version) {
  const res = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_package_metadata`,
      functionArguments: [name, version],
    },
  });
  return res[0];
}

// Fetch all packages (like CLI getAllPackages)
export async function getAllPackages() {
  const res = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::search_packages`,
      functionArguments: [''],
    },
  });
  // Defensive: ensure array of objects
  if (!res || !Array.isArray(res) || !Array.isArray(res[0])) return [];
  // Parse each package metadata (flatten if needed)
  return res[0].map(pkg => ({
    name: pkg.name,
    version: pkg.version,
    publisher: pkg.publisher,
    ipfsHash: pkg.ipfs_hash,
    endorsements: pkg.endorsements,
    timestamp: pkg.timestamp,
    packageType: pkg.package_type,
    downloadCount: pkg.download_count,
    totalTips: pkg.total_tips,
    tags: pkg.tags,
    description: pkg.description,
    homepage: pkg.homepage,
    repository: pkg.repository,
    license: pkg.license,
  }));
}

// Fetch registry stats (like CLI getRegistryStats)
export async function getRegistryStats() {
  const res = await aptos.view({
    payload: {
      function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_registry_stats`,
      functionArguments: [],
    },
  });
  if (!res || !Array.isArray(res) || !res[0]) return null;
  const stats = res[0];
  return {
    totalPackages: stats.total_packages,
    totalEndorsers: stats.total_endorsers,
    totalDownloads: stats.total_downloads,
    totalTips: stats.total_tips,
  };
} 