import { useCallback, useEffect, useRef, useState } from 'react';
import { apiMessage, vasApi, type VasAccess } from './vasApi';

/** Loads the seller's access state for a set of services and lets the screen replace a single one after an action. */
export function useVasServices(keys: string[]) {
  const [services, setServices] = useState<Record<string, VasAccess>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const keysRef = useRef(keys);

  const reload = useCallback(async () => {
    try {
      setError('');
      const list = await Promise.all(keysRef.current.map((k) => vasApi.mine(k)));
      setServices(Object.fromEntries(list.map((s) => [s.key, s])));
    } catch (err) {
      setError(apiMessage(err, 'Could not load this service. Please refresh and try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const put = useCallback((s: VasAccess) => setServices((prev) => ({ ...prev, [s.key]: s })), []);

  return { services, loading, error, reload, put };
}
