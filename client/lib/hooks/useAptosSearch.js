import { useState, useCallback } from 'react';
import { searchPackages, getAllPackages } from '../aptos';

export function useAptosSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchPackages(query);
      setResults(res || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all packages, sorted by endorsements (desc)
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pkgs = await getAllPackages();
      // Sort by endorsements (desc)
      pkgs.sort((a, b) => (b.endorsements?.length || 0) - (a.endorsements?.length || 0));
      setResults(pkgs);
      return pkgs;
    } catch (e) {
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, search, fetchAll, loading, error };
} 