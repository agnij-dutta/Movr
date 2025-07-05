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
    <div className="fixed inset-0 z-50 flex justify-center items-center" style={{backdropFilter: 'blur(8px)'}}>
      <div className="relative bg-[rgba(15,23,42,0.7)] border border-teal-700/30 rounded-2xl shadow-2xl p-8 max-w-sm w-full overflow-hidden mintlify-card">
        {/* Gradient overlay for glass effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 via-teal-400/5 to-black/10" />
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-extrabold mb-2 tracking-tight logo-font">Connect to Movr</h2>
          <p className="text-teal-200 mb-6 text-sm">Choose your wallet to connect to Movr</p>
          <div className="space-y-4">
            {wallets
              .filter((wallet) => wallet.readyState === WalletReadyState.Installed)
              .map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => onConnect(wallet.name)}
                  className="w-full flex justify-between items-center bg-slate-700/70 hover:bg-slate-700/90 border border-teal-700/30 shadow-sm backdrop-blur rounded-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-full" />
                    <span className="text-white font-semibold text-base">{wallet.name}</span>
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
                  className="w-full flex justify-between items-center bg-slate-900/70 hover:bg-slate-900/90 border border-teal-700/30 shadow-sm backdrop-blur rounded-xl transition-all"
                  variant="outline"
                >
                  <div className="flex items-center gap-4">
                    <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-full" />
                    <span className="text-white font-semibold text-base">Install {wallet.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">Not Detected</span>
                </Button>
              ))}
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full mt-6 text-teal-300 hover:text-white bg-transparent border border-white/10 rounded-xl cancel-gradient-btn"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
} 