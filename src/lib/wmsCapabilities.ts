import { getProduct } from './radarProducts';

const CAPS_CACHE = new Map<string, { timestamps: Date[]; fetchedAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // re-fetch every 2 minutes

export async function fetchScanTimestamps(
  stationId: string,
  productCode: string,
  maxFrames = 10
): Promise<Date[]> {
  const product = getProduct(productCode);
  const workspace = product.scope === 'station' ? stationId.toLowerCase() : 'conus';
  const layerName =
    product.scope === 'station'
      ? `${stationId.toLowerCase()}_${product.layerSuffix}`
      : product.layerSuffix;

  const cacheKey = `${workspace}:${layerName}`;
  const cached = CAPS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.timestamps;
  }

  const url =
    `https://opengeo.ncep.noaa.gov/geoserver/${workspace}/ows` +
    `?service=wms&version=1.3.0&request=GetCapabilities`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Capabilities fetch failed: ${resp.status}`);
  const xml = await resp.text();

  const timestamps = parseTimeDimension(xml, layerName, maxFrames);
  CAPS_CACHE.set(cacheKey, { timestamps, fetchedAt: Date.now() });
  return timestamps;
}

function parseTimeDimension(xml: string, layerName: string, maxFrames: number): Date[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');

  for (const layer of doc.querySelectorAll('Layer')) {
    const nameEl = layer.querySelector('Name');
    if (nameEl?.textContent !== layerName) continue;

    const dim = layer.querySelector('Dimension[name="time"]');
    if (!dim?.textContent) break;

    return dim.textContent
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => new Date(s))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
      .slice(-maxFrames);
  }

  return [];
}
