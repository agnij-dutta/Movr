import { useState, useCallback } from 'react';
import { getPackageMetadata } from '../aptos';

export function useAptosGetMetadata() {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMetadata = useCallback(async (name, version) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPackageMetadata(name, version);
      setMetadata(data);
      return data;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { metadata, fetchMetadata, loading, error };
} 