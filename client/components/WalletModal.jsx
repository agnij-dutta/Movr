"use client";

import { useWallet, WalletReadyState } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";

export function WalletModal({ isOpen, onClose }) {
  const { wallets, connect } = useWallet();

  if (!isOpen) return null;

  const onConnect = (walletName) => {
    connect(walletName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-slate-800 rounded-lg p-8 max-w-sm w-full">
        <h2 className="text-white text-2xl font-bold mb-4">Connect Wallet</h2>
        <p className="text-gray-400 mb-6">Choose your wallet to connect to apm</p>
        <div className="space-y-4">
          {wallets
            .filter((wallet) => wallet.readyState === WalletReadyState.Installed)
            .map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => onConnect(wallet.name)}
                className="w-full flex justify-between items-center bg-slate-700 hover:bg-slate-600"
              >
                <div className="flex items-center gap-4">
                  <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-full" />
                  <span className="text-white font-medium">{wallet.name}</span>
                </div>
                <span className="text-xs text-teal-400">Detected</span>
              </Button>
            ))}
          {wallets
            .filter((wallet) => wallet.readyState !== WalletReadyState.Installed)
            .map((wallet) => (
              <Button
                key={wallet.name}
                onClick={() => window.open(wallet.url, "_blank")}
                className="w-full flex justify-between items-center bg-slate-900 hover:bg-slate-800"
                variant="outline"
              >
                <div className="flex items-center gap-4">
                  <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-full" />
                  <span className="text-white font-medium">Install {wallet.name}</span>
                </div>
                <span className="text-xs text-gray-500">Not Detected</span>
              </Button>
            ))}
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full mt-6 text-gray-400 hover:text-white"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
} 