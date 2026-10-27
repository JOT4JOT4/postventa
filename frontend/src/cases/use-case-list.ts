import { useCallback, useEffect, useState } from 'react';
import { CaseSummary, listCases } from './case-api';

export function useCaseList() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCases(await listCases());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los casos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  return { cases, loading, error, reload: loadCases };
}
