import { useEffect, useRef } from 'react';
import { useAlertStore } from '../store/alertStore';
import { parseNWSAlerts } from '../lib/alertParsing';

const POLL_INTERVAL_MS = 60_000;
const NWS_ALERTS_URL =
  'https://api.weather.gov/alerts/active?status=actual&message_type=alert';
const USER_AGENT = 'nimbus-weather-radar/0.1 (jasjordan@proton.me)';

export function useAlertPolling() {
  const setAlerts = useAlertStore((s) => s.setAlerts);
  const setLastFetched = useAlertStore((s) => s.setLastFetched);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchAlerts() {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const resp = await fetch(NWS_ALERTS_URL, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' },
        signal: ac.signal,
      });
      if (!resp.ok) throw new Error(`NWS alerts ${resp.status}`);
      const data = await resp.json();
      setAlerts(parseNWSAlerts(data));
      setLastFetched(new Date());
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Alert fetch failed:', err?.message);
      }
    }
  }

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, []);
}
