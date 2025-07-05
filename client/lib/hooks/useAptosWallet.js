import { useState, useCallback } from 'react';
import { connectWallet } from '../aptos';

export function useAptosWallet() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const acc = await connectWallet();
      setAccount(acc);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  return { account, connect, disconnect, loading, error };
} 