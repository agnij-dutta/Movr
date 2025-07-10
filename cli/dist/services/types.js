"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_TYPE_TEMPLATE = exports.PACKAGE_TYPE_LIBRARY = exports.APM_MODULE_NAME = exports.APM_CONTRACT_ADDRESS = exports.NETWORKS = exports.Network = void 0;
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
Object.defineProperty(exports, "Network", { enumerable: true, get: function () { return ts_sdk_1.Network; } });
exports.NETWORKS = {
    [ts_sdk_1.Network.DEVNET]: {
        url: 'https://fullnode.devnet.aptoslabs.com/v1',
        faucetUrl: 'https://faucet.devnet.aptoslabs.com'
    },
    [ts_sdk_1.Network.TESTNET]: {
        url: 'https://fullnode.testnet.aptoslabs.com/v1',
        faucetUrl: 'https://faucet.testnet.aptoslabs.com'
    },
    [ts_sdk_1.Network.MAINNET]: {
        url: 'https://fullnode.mainnet.aptoslabs.com/v1'
    },
    [ts_sdk_1.Network.LOCAL]: {
        url: 'http://localhost:8080/v1',
        faucetUrl: 'http://localhost:8081'
    },
    [ts_sdk_1.Network.CUSTOM]: {
        url: ''
    }
};
// Contract constants
exports.APM_CONTRACT_ADDRESS = '0xba495e6bb22cdbdf25d0be1dd900eb508e3132598d87b3d98ae705cae36aba34';
exports.APM_MODULE_NAME = 'registry';
// Package types from contract
exports.PACKAGE_TYPE_LIBRARY = 0;
exports.PACKAGE_TYPE_TEMPLATE = 1;
