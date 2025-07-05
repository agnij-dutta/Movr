"use client";

import { PetraWallet } from "petra-plugin-wallet-adapter";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
 
const wallets = [new PetraWallet()];

export const WalletProvider = ({ children }) => {
 
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{ network: Network.MAINNET }}
      onError={(error) => {
    console.log("error", error);
  }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};