import { useState, useCallback } from 'react';
import { pinJSON } from '../ipfs';

export function usePinataPinJSON() {
  const [ipfsHash, setIpfsHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pin = useCallback(async (obj, metadata) => {
    setLoading(true);
    setError(null);
    setIpfsHash(null);
    try {
      const hash = await pinJSON(obj, metadata);
      setIpfsHash(hash);
      return hash;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { pin, ipfsHash, loading, error };
} 