import { useEffect } from 'react';
import { useRadarStore } from '../store/radarStore';
import { useMpingStore } from '../store/mpingStore';
import { fetchMpingReports, filterMpingForStation, MPING_ENABLED } from '../lib/mpingData';

const REFRESH_MS = 2 * 60 * 1000;

export function useMpingData() {
  const station = useRadarStore((s) => s.station);
  const setReports = useMpingStore((s) => s.setReports);
  const clearReports = useMpingStore((s) => s.clearReports);

  useEffect(() => {
    clearReports();
    if (!MPING_ENABLED || !station) return;

    const controller = new AbortController();

    async function load() {
      try {
        const all = await fetchMpingReports(controller.signal);
        const local = filterMpingForStation(all, station!);
        setReports(local, new Date());
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.warn('mPING fetch failed', err);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [station?.id]);
}
