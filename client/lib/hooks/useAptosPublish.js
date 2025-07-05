import { useState, useCallback } from 'react';
import { publishPackage } from '../aptos';

export function useAptosPublish() {
  const [txHash, setTxHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const publish = useCallback(async (signer, metadata) => {
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const hash = await publishPackage(signer, metadata);
      setTxHash(hash);
      return hash;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { publish, txHash, loading, error };
}
