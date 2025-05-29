import { useEffect, useState } from 'react';

export function useMaintenanceStatus() {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/maintenance/status', { credentials: 'include' });
        const data = await res.json();
        if (isMounted) setMaintenance(!!data.enabled);
      } catch {
        if (isMounted) setMaintenance(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    // Opcional: polling a cada 30s
    const interval = setInterval(fetchStatus, 30000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return { maintenance, loading };
}
