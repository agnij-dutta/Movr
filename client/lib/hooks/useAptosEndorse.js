import { useState, useCallback } from 'react';
import { endorsePackage } from '../aptos';

export function useAptosEndorse() {
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const endorse = useCallback(async (signer, name, version) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await endorsePackage(signer, name, version);
      setTxHash(hash);
      return hash;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { endorse, txHash, loading, error };
}
