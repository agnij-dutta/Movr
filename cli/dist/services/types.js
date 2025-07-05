import { Network as AptosNetwork } from '@aptos-labs/ts-sdk';
// Re-export Network from SDK to ensure compatibility
export { AptosNetwork as Network };
export const NETWORKS = {
    [AptosNetwork.DEVNET]: {
        url: 'https://fullnode.devnet.aptoslabs.com/v1',
        faucetUrl: 'https://faucet.devnet.aptoslabs.com'
    },
    [AptosNetwork.TESTNET]: {
        url: 'https://fullnode.testnet.aptoslabs.com/v1',
        faucetUrl: 'https://faucet.testnet.aptoslabs.com'
    },
    [AptosNetwork.MAINNET]: {
        url: 'https://fullnode.mainnet.aptoslabs.com/v1'
    },
    [AptosNetwork.LOCAL]: {
        url: 'http://localhost:8080/v1',
        faucetUrl: 'http://localhost:8081'
    },
    [AptosNetwork.CUSTOM]: {
        url: ''
    }
};
// Contract constants
export const APM_CONTRACT_ADDRESS = '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34';
export const APM_MODULE_NAME = 'registry';
// Package types from contract
export const PACKAGE_TYPE_LIBRARY = 0;
export const PACKAGE_TYPE_TEMPLATE = 1;
