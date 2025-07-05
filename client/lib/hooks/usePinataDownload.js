import { useState, useCallback } from 'react';
import { downloadFile } from '../ipfs';

export function usePinataDownload() {
  const [fileBlob, setFileBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const download = useCallback(async (ipfsHash) => {
    setLoading(true);
    setError(null);
    setFileBlob(null);
    try {
      const blob = await downloadFile(ipfsHash);
      setFileBlob(blob);
      return blob;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, fileBlob, loading, error };
} 