import { useEffect } from 'react';
import { useMcdStore } from '../store/mcdStore';
import { fetchActiveMcds } from '../lib/mcdParsing';

const REFRESH_MS = 5 * 60 * 1000;

export function useMcdData() {
  const setMcds = useMcdStore((s) => s.setMcds);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const mcds = await fetchActiveMcds(controller.signal);
        setMcds(mcds, new Date());
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.warn('MCD fetch failed', err);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, []);
}
