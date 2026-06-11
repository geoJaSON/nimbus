import type { LocalStormReport } from '../types';
import { haversineKm } from './stationList';

// Iowa State IEM re-serves NWS Local Storm Reports as parsed GeoJSON —
// no fixed-width text parsing, and reports come from every WFO (the old
// per-WFO product fetch missed neighboring offices' reports within radar
// range, and radar site IDs don't reliably map to WFO IDs anyway).
const IEM_LSR_URL = 'https://mesonet.agron.iastate.edu/geojson/lsr.geojson';

// WSR-88D long-range reflectivity reaches ~460 km from the site
const LSR_RANGE_KM = 460;

function classifyEvent(type: string): LocalStormReport['type'] {
  const t = type.toUpperCase();
  if (t.includes('TORNADO') || t.includes('FUNNEL') || t.includes('WATERSPOUT')) return 'TORNADO';
  if (t.includes('HAIL')) return 'HAIL';
  if (t.includes('WIND') || t.includes('TSTM')) return 'WIND';
  if (t.includes('FLOOD')) return 'FLOOD';
  if (t.includes('SNOW') || t.includes('BLIZZARD') || t.includes('ICE')) return 'SNOW';
  return 'OTHER';
}

export async function fetchLsrs(
  stationLat: number,
  stationLon: number,
  hours: number,
  signal?: AbortSignal,
): Promise<LocalStormReport[]> {
  const res = await fetch(`${IEM_LSR_URL}?hours=${hours}`, { signal });
  if (!res.ok) throw new Error(`IEM LSR fetch failed: ${res.status}`);
  const data = await res.json();
  const features: any[] = data.features ?? [];

  return features
    .filter((f) => f.geometry?.coordinates?.length === 2 && f.properties)
    .map((f): LocalStormReport => {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      const typetext = String(p.typetext ?? '');
      const magnitude = p.magnitude
        ? `${p.magnitude} ${p.unit ?? ''}`.trim().toUpperCase()
        : '';
      const location = [p.city, p.st].filter(Boolean).join(', ');
      return {
        id: `${p.product_id ?? p.wfo}-${p.valid}-${lon}-${lat}-${p.type}`,
        type: classifyEvent(typetext),
        lat,
        lon,
        time: new Date(p.valid),
        magnitude,
        location,
        remarks: p.remark || typetext,
        source: p.source ?? p.wfo ?? '',
      };
    })
    .filter((l) => haversineKm(stationLat, stationLon, l.lat, l.lon) <= LSR_RANGE_KM);
}

export const LSR_COLORS: Record<LocalStormReport['type'], string> = {
  TORNADO: '#ff2222',
  HAIL: '#00ee66',
  WIND: '#ff8800',
  FLOOD: '#4488ff',
  SNOW: '#88ccff',
  OTHER: '#aaaaaa',
};
