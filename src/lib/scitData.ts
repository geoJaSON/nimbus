import type { StormCell } from '../types';

const IEM_NEXRAD_ATTR = 'https://mesonet.agron.iastate.edu/geojson/nexrad_attr.py';

export async function fetchStormCells(signal?: AbortSignal): Promise<StormCell[]> {
  const res = await fetch(IEM_NEXRAD_ATTR, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const features: any[] = data.features ?? [];

  return features
    .filter((f) => f.geometry?.coordinates?.length === 2 && f.properties)
    .map((f): StormCell => {
      const p = f.properties;
      return {
        id: String(p.storm_id ?? f.id ?? ''),
        radarId: String(p.nexrad ?? ''),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        azimuth: Number(p.azimuth ?? 0),
        range: Number(p.range ?? 0),
        maxDbz: Number(p.max_dbz ?? 0),
        maxDbzHeight: Number(p.max_dbz_height ?? 0),
        top: Number(p.top ?? 0),
        vil: Number(p.vil ?? 0),
        posh: Number(p.posh ?? 0),
        poh: Number(p.poh ?? 0),
        maxHailSize: Number(p.max_size ?? 0),
        tvs: String(p.tvs ?? 'NONE'),
        meso: String(p.meso ?? 'NONE'),
        motionDir: Number(p.drct ?? 0),
        motionSpeed: Number(p.sknt ?? 0),
        valid: new Date(p.valid),
      };
    });
}

export function filterCellsForStation(cells: StormCell[], stationId: string | undefined): StormCell[] {
  if (!stationId) return [];
  const radarId = stationId.slice(1).toUpperCase(); // KHGX → HGX
  return cells.filter((c) => c.radarId === radarId);
}

// Reflectivity → color (NWS-ish but adjusted for dark terminal)
export function dbzColor(dbz: number): string {
  if (dbz >= 65) return '#ff44ff';
  if (dbz >= 60) return '#ff2222';
  if (dbz >= 55) return '#ff6600';
  if (dbz >= 50) return '#ff9900';
  if (dbz >= 45) return '#ffcc00';
  if (dbz >= 40) return '#ffff00';
  if (dbz >= 35) return '#66ff00';
  if (dbz >= 25) return '#00cc00';
  return '#0088aa';
}

// Cell marker size scales with VIL
export function cellRadius(vil: number): number {
  return Math.max(4, Math.min(12, 4 + vil * 0.25));
}

// Project a position forward along the storm's motion vector.
// motionDir = compass heading the storm is moving TOWARD (deg).
export function projectPosition(
  lat: number,
  lon: number,
  motionDir: number,
  motionSpeedKt: number,
  minutes: number,
): [number, number] {
  const distKm = motionSpeedKt * 1.852 * (minutes / 60);
  const rad = (motionDir * Math.PI) / 180;
  const dLat = (distKm * Math.cos(rad)) / 111;
  const dLon = (distKm * Math.sin(rad)) / (111 * Math.cos((lat * Math.PI) / 180));
  return [lon + dLon, lat + dLat];
}

export function isCellSevere(cell: StormCell): boolean {
  return (
    cell.tvs !== 'NONE' ||
    cell.meso !== 'NONE' ||
    cell.posh >= 50 ||
    cell.maxDbz >= 60 ||
    cell.maxHailSize >= 1
  );
}
