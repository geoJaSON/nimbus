import { useEffect } from 'react';
import { useRadarStore } from '../store/radarStore';
import { useScitStore } from '../store/scitStore';
import { fetchStormCells, filterCellsForStation } from '../lib/scitData';

// Volume scans complete every ~5 min on WSR-88D; refresh slightly faster
const REFRESH_MS = 3 * 60 * 1000;

export function useScitData() {
  const station = useRadarStore((s) => s.station);
  const setCells = useScitStore((s) => s.setCells);
  const clearCells = useScitStore((s) => s.clearCells);

  useEffect(() => {
    clearCells();
    if (!station) return;

    const controller = new AbortController();

    async function load() {
      try {
        const all = await fetchStormCells(controller.signal);
        const local = filterCellsForStation(all, station!.id);
        setCells(local, new Date());
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.warn('SCIT fetch failed', err);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [station?.id]);
}
