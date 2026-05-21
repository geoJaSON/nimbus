import type { MesoscaleDiscussion } from '../types';

// Decode WMO-encoded polygon line from NWS product text:
//   LAT...LON   40629324 40659508 ...
// Each 8-digit token is (lat × 100)(lon × 100). For W of 100°W the leading "1"
// is dropped, so lonRaw < 50 means actual lon = lonRaw + 100.
export function decodeWmoPolygon(text: string): GeoJSON.Polygon | null {
  const match = text.match(/LAT\.\.\.LON([\s\S]+?)(?:\n\s*\n|\n[A-Z]{2,}|\$\$)/);
  if (!match) return null;

  const tokens = match[1].split(/\s+/).filter((t) => /^\d{8}$/.test(t));
  if (tokens.length < 3) return null;

  const coords: number[][] = tokens.map((tok) => {
    const lat = parseInt(tok.slice(0, 4), 10) / 100;
    const lonRaw = parseInt(tok.slice(4, 8), 10) / 100;
    const lonAbs = lonRaw < 50 ? lonRaw + 100 : lonRaw;
    return [-lonAbs, lat];
  });

  // Close ring if needed
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0], first[1]]);

  return { type: 'Polygon', coordinates: [coords] };
}

const IEM_MCD_LIST = 'https://mesonet.agron.iastate.edu/json/spcmcd.py';
const IEM_TEXT = (pid: string) => `https://mesonet.agron.iastate.edu/api/1/nwstext/${pid}`;

export async function fetchActiveMcds(signal?: AbortSignal): Promise<MesoscaleDiscussion[]> {
  const res = await fetch(IEM_MCD_LIST, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const items: any[] = data.mcds ?? [];
  const now = Date.now();

  const active = items
    .filter((m) => new Date(m.utc_expire).getTime() > now)
    .map((m): MesoscaleDiscussion => ({
      productNum: m.product_num,
      year: m.year,
      issued: new Date(m.utc_issue),
      expires: new Date(m.utc_expire),
      concerning: m.concerning ?? '',
      watchConfidence: m.watch_confidence,
      mostProbTornado: m.most_prob_tornado,
      mostProbHail: m.most_prob_hail,
      mostProbGust: m.most_prob_gust,
      spcUrl: m.spcurl ?? '',
      productId: m.product_id ?? '',
      polygon: null,
    }));

  // Fetch polygons in parallel — limit to avoid hammering IEM if many are active
  const withPolygons = await Promise.all(
    active.map(async (m) => {
      if (!m.productId) return m;
      try {
        const r = await fetch(IEM_TEXT(m.productId), { signal });
        if (!r.ok) return m;
        const text = await r.text();
        return { ...m, polygon: decodeWmoPolygon(text) };
      } catch {
        return m;
      }
    }),
  );

  return withPolygons;
}
