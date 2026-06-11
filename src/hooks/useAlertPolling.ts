import { useEffect, useRef } from 'react';
import { useAlertStore } from '../store/alertStore';
import { parseNWSAlerts } from '../lib/alertParsing';

const POLL_INTERVAL_MS = 60_000;

// Only request the convective/flood/marine events the app actually styles and
// filters on. Without this the API returns every active alert in the US
// (winter, heat, air quality, marine forecasts…) — routinely hundreds of
// features and several MB per poll.
const ALERT_EVENTS = [
  'Tornado Warning',
  'Tornado Watch',
  'Severe Thunderstorm Warning',
  'Severe Thunderstorm Watch',
  'Flash Flood Warning',
  'Flood Watch',
  'Special Marine Warning',
  'Extreme Wind Warning',
];
const NWS_ALERTS_URL =
  'https://api.weather.gov/alerts/active?status=actual&message_type=alert' +
  `&event=${encodeURIComponent(ALERT_EVENTS.join(','))}`;
const USER_AGENT = 'nimbus-weather-radar/1.0 (jasjordan@proton.me)';

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
