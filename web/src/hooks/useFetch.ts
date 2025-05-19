import { useState, useEffect } from 'react';

interface CacheItem {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheItem>();
const CACHE_TTL = 5000; // 5 segundos
const inFlightRequests = new Map<string, Promise<any>>();

interface UseFetchOptions {
  cacheTime?: number;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export function useFetch<T>(url: string, options: UseFetchOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { cacheTime = CACHE_TTL, headers = {}, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        // Verificar cache
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < cacheTime) {
          if (isMounted) {
            setData(cached.data);
            setLoading(false);
          }
          return;
        }

        // Se já existe uma requisição em andamento para esta URL, reutilizar
        if (inFlightRequests.has(url)) {
          const data = await inFlightRequests.get(url);
          if (isMounted) {
            setData(data);
            setLoading(false);
          }
          return;
        }

        // Criar nova requisição
        const promise = fetch(url, { headers })
          .then(res => {
            if (!res.ok) {
              if (res.status === 429) {
                throw new Error('Muitas requisições. Por favor, aguarde um momento.');
              }
              throw new Error('Erro na requisição');
            }
            return res.json();
          })
          .finally(() => {
            inFlightRequests.delete(url);
          });

        inFlightRequests.set(url, promise);
        
        const data = await promise;
        
        // Atualizar cache
        cache.set(url, {
          data,
          timestamp: Date.now()
        });

        if (isMounted) {
          setData(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, cacheTime, enabled, JSON.stringify(headers)]);

  return { data, error, loading };
}
