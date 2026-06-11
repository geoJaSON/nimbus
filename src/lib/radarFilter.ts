import maplibregl from 'maplibre-gl';
import { REFLECTIVITY_RAMP_HEX } from './reflectivityRamp';

// Client-side dBZ noise filter. The opengeo WMS serves pre-colored RGB tiles
// (the GeoServer style has no ColorMap, so there is no raw data band to
// threshold server-side). Instead we register a custom tile protocol that
// decodes each PNG, maps every pixel color back to dBZ via the official
// legend ramp, and makes pixels below the threshold transparent.

const PROTOCOL = 'dbzfilter';
const THRESH_PARAM = 'nimbusThresh';

// Colors farther than this (squared RGB distance) from any ramp entry are
// kept visible — edge antialiasing blends and any palette drift should fail
// open, never erase real echoes.
const MATCH_TOLERANCE_SQ = 2500;
const KEEP = 999;

interface RampEntry { r: number; g: number; b: number; dbz: number }

const RAMP: RampEntry[] = (REFLECTIVITY_RAMP_HEX.match(/.{6}/g) ?? []).map((hex, i, all) => ({
  r: parseInt(hex.slice(0, 2), 16),
  g: parseInt(hex.slice(2, 4), 16),
  b: parseInt(hex.slice(4, 6), 16),
  dbz: -30 + (i / (all.length - 1)) * 105,
}));

// dBZ per distinct color, memoized — a tile only contains a few hundred
// distinct colors, so the nearest-neighbor search runs once per color.
const colorDbz = new Map<number, number>();

function dbzFor(r: number, g: number, b: number): number {
  const key = (r << 16) | (g << 8) | b;
  const hit = colorDbz.get(key);
  if (hit !== undefined) return hit;

  let bestD = Infinity;
  let bestZ = KEEP;
  for (const e of RAMP) {
    const d = (r - e.r) ** 2 + (g - e.g) ** 2 + (b - e.b) ** 2;
    if (d < bestD) {
      bestD = d;
      bestZ = e.dbz;
    }
  }
  const z = bestD <= MATCH_TOLERANCE_SQ ? bestZ : KEEP;
  colorDbz.set(key, z);
  return z;
}

// Wrap a WMS tile URL so it routes through the filter protocol. The
// threshold rides along as a query param the handler strips before fetching
// (it also keys MapLibre's tile cache, so threshold changes refetch cleanly).
export function filteredTileUrl(url: string, thresholdDbz: number): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${PROTOCOL}://${url}${sep}${THRESH_PARAM}=${thresholdDbz}`;
}

let registered = false;

export function ensureDbzFilterProtocol(): void {
  if (registered) return;
  registered = true;

  maplibregl.addProtocol(PROTOCOL, async (params, abortController) => {
    const wrapped = params.url.slice(PROTOCOL.length + 3);
    const match = wrapped.match(new RegExp(`[?&]${THRESH_PARAM}=(-?\\d+)`));
    const threshold = match ? parseInt(match[1], 10) : 0;
    const url = wrapped.replace(new RegExp(`[?&]${THRESH_PARAM}=-?\\d+`), '');

    const resp = await fetch(url, { signal: abortController.signal });
    if (!resp.ok) throw new Error(`dbzfilter: upstream ${resp.status}`);
    const bitmap = await createImageBitmap(await resp.blob());

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = img.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] === 0) continue;
      if (dbzFor(px[i], px[i + 1], px[i + 2]) < threshold) px[i + 3] = 0;
    }
    ctx.putImageData(img, 0, 0);

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return { data: await blob.arrayBuffer() };
  });
}
