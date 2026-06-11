import { useEffect } from 'react';
import { useRadarStore } from '../store/radarStore';
import { useSpcStore } from '../store/spcStore';
import { fetchLsrs } from '../lib/lsrParsing';

const REFRESH_MS = 10 * 60 * 1000;
const HOURS_BACK = 12;

export function useLsrFetch() {
  const station = useRadarStore((s) => s.station);
  const setLsrs = useSpcStore((s) => s.setLsrs);
  const clearLsrs = useSpcStore((s) => s.clearLsrs);

  useEffect(() => {
    // Wipe any LSRs from the previous station before doing anything else
    clearLsrs();
    if (!station) return;

    const { lat, lon } = station;
    const controller = new AbortController();

    async function load() {
      try {
        const lsrs = await fetchLsrs(lat, lon, HOURS_BACK, controller.signal);
        setLsrs(lsrs, new Date());
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.warn('LSR fetch failed', err);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [station?.id]);
}
