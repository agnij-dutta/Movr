import { useState, useCallback } from 'react';
import { tipPackage } from '../aptos';

export function useAptosTip() {
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tip = useCallback(async (signer, name, version, amount) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await tipPackage(signer, name, version, amount);
      setTxHash(hash);
      return hash;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { tip, txHash, loading, error };
} 