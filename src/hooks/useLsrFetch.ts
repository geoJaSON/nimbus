import { useEffect } from 'react';
import { useRadarStore } from '../store/radarStore';
import { useSpcStore } from '../store/spcStore';
import { parseLsrText } from '../lib/lsrParsing';

const NWS_API = 'https://api.weather.gov';
const USER_AGENT = 'nimbus-weather-radar/0.1 (jasjordan@proton.me)';
const REFRESH_MS = 10 * 60 * 1000;

export function useLsrFetch() {
  const station = useRadarStore((s) => s.station);
  const setLsrs = useSpcStore((s) => s.setLsrs);
  const clearLsrs = useSpcStore((s) => s.clearLsrs);

  useEffect(() => {
    // Wipe any LSRs from the previous station before doing anything else
    clearLsrs();

    // Only WSR-88D stations map to a WFO identifier (drop leading K)
    if (!station || station.stationType !== 'WSR-88D') return;

    const wfo = station.id.slice(1).toUpperCase();
    const controller = new AbortController();

    async function load() {
      try {
        const listRes = await fetch(
          `${NWS_API}/products?type=LSR&office=${wfo}&limit=10`,
          { headers: { 'User-Agent': USER_AGENT }, signal: controller.signal },
        );
        if (!listRes.ok) {
          setLsrs([], new Date());
          return;
        }
        const listData = await listRes.json();
        const items: any[] = listData['@graph'] ?? [];

        const parsed = await Promise.all(
          items.slice(0, 3).map(async (item: any) => {
            try {
              const r = await fetch(item['@id'], {
                headers: { 'User-Agent': USER_AGENT },
                signal: controller.signal,
              });
              if (!r.ok) return [];
              const d = await r.json();
              return parseLsrText(d.productText ?? '', wfo);
            } catch {
              return [];
            }
          }),
        );

        const all = parsed.flat();
        const seen = new Set<string>();
        const unique = all.filter((l) => {
          if (seen.has(l.id)) return false;
          seen.add(l.id);
          return true;
        });

        setLsrs(unique, new Date());
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.warn('LSR fetch failed', err);
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { controller.abort(); clearInterval(id); };
  }, [station?.id]);
}
