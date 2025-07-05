import { useState, useCallback } from 'react';
import { uploadFile } from '../ipfs';

export function usePinataUpload() {
  const [ipfsHash, setIpfsHash] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file, metadata) => {
    setLoading(true);
    setError(null);
    setIpfsHash(null);
    try {
      const hash = await uploadFile(file, metadata);
      setIpfsHash(hash);
      return hash;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { upload, ipfsHash, loading, error };
} 