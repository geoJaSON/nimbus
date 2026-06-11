// IP-based approximate geolocation. navigator.geolocation in WebView2 relies
// on Google's network location service, which returns 403 without an API key
// (the console error on every launch). City-level IP accuracy is plenty for
// picking the nearest radar site.
const SERVICES: Array<{ url: string; parse: (d: any) => { lat: number; lon: number } }> = [
  { url: 'https://ipapi.co/json/', parse: (d) => ({ lat: d.latitude, lon: d.longitude }) },
  { url: 'https://ipwho.is/', parse: (d) => ({ lat: d.latitude, lon: d.longitude }) },
];

export async function ipGeolocate(timeoutMs = 6000): Promise<{ lat: number; lon: number } | null> {
  for (const svc of SERVICES) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      const res = await fetch(svc.url, { signal: ac.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const loc = svc.parse(await res.json());
      if (Number.isFinite(loc.lat) && Number.isFinite(loc.lon)) return loc;
    } catch {
      // try next service
    }
  }
  return null;
}
