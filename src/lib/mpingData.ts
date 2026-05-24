import type { MpingReport, MpingCategory } from '../types';

// OU/NSSL serves the live mPING report feed as GeoJSON. Returns the recent
// (~1h) global set; we filter to the active radar's range below.
const MPING_URL = 'https://mping.ou.edu/mping/api/v2/reports.geojson';

export async function fetchMpingReports(signal?: AbortSignal): Promise<MpingReport[]> {
  const res = await fetch(MPING_URL, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const features: any[] = data.features ?? [];

  return features
    .filter((f) => f.geometry?.coordinates?.length === 2 && f.properties)
    .map((f): MpingReport => {
      const p = f.properties;
      const description = String(p.description ?? p.category ?? 'Report');
      return {
        id: String(p.id ?? f.id ?? `${p.obtime}-${f.geometry.coordinates.join(',')}`),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        time: new Date(p.obtime ?? p.obs_datetime ?? p.valid ?? Date.now()),
        category: classifyMping(description, p.category),
        description,
      };
    });
}

// Restrict mPING reports to within ~250 nautical miles of the active radar
// to match the LSR/SCIT visual scope. ~463 km radius.
const STATION_RADIUS_KM = 460;

export function filterMpingForStation(
  reports: MpingReport[],
  station: { lat: number; lon: number } | undefined,
): MpingReport[] {
  if (!station) return [];
  return reports.filter((r) => haversineKm(r.lat, r.lon, station.lat, station.lon) <= STATION_RADIUS_KM);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function classifyMping(description: string, category?: string): MpingCategory {
  const d = `${description} ${category ?? ''}`.toLowerCase();
  if (d.includes('tornado') || d.includes('funnel')) return 'TORNADO';
  if (d.includes('hail')) return 'HAIL';
  if (d.includes('wind damage') || d.includes('downburst') || d.includes('gust')) return 'WIND';
  if (d.includes('flood')) return 'FLOOD';
  if (d.includes('mix') || d.includes('sleet') || d.includes('freezing')) return 'MIXED';
  if (d.includes('snow') || d.includes('graupel') || d.includes('blowing snow')) return 'SNOW';
  if (d.includes('rain') || d.includes('drizzle')) return 'RAIN';
  return 'OTHER';
}

export const MPING_COLORS: Record<MpingCategory, string> = {
  RAIN: '#4488ff',
  SNOW: '#ddeeff',
  MIXED: '#cc88ff',
  HAIL: '#00ee66',
  WIND: '#ff8800',
  TORNADO: '#ff2222',
  FLOOD: '#22aaff',
  OTHER: '#aaaaaa',
};
