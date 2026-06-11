import type { SpcOutlookFeature } from '../types';

// SPC publishes the current Day 1 categorical outlook at a stable URL —
// no need to guess archive issuance timestamps (which 404 whenever the
// guess misses or publishing lags).
const SPC_DAY1_LATEST = 'https://www.spc.noaa.gov/products/outlook/day1otlk_cat.lyr.geojson';

export async function fetchSpcDay1Outlook(): Promise<SpcOutlookFeature[]> {
  try {
    const res = await fetch(SPC_DAY1_LATEST);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.features)) return [];

    return data.features
      .map((f: any): SpcOutlookFeature | null => {
        if (!f.geometry || !f.properties) return null;
        return {
          label: f.properties.LABEL ?? '',
          label2: f.properties.LABEL2 ?? '',
          fill: (f.properties.fill ?? f.properties.FILL ?? '#808080').slice(0, 7),
          stroke: (f.properties.stroke ?? f.properties.STROKE ?? '#808080').slice(0, 7),
          geometry: f.geometry,
        };
      })
      .filter((f: SpcOutlookFeature | null): f is SpcOutlookFeature => f !== null);
  } catch {
    return [];
  }
}

// SPC category display order (highest severity first)
export const SPC_CATEGORY_ORDER: Record<string, number> = {
  HIGH: 0,
  MDT: 1,
  ENH: 2,
  SLGT: 3,
  MRGL: 4,
  TSTM: 5,
};

// Terminal-themed badge colors per category (slightly muted from SPC standard)
export const SPC_BADGE_COLORS: Record<string, string> = {
  HIGH: '#ff00ff',
  MDT: '#ff4444',
  ENH: '#ff9933',
  SLGT: '#ddbb00',
  MRGL: '#55aa55',
  TSTM: '#338833',
};

export function highestActiveCategory(features: SpcOutlookFeature[]): string | null {
  let best: string | null = null;
  let bestOrder = Infinity;
  for (const f of features) {
    const order = SPC_CATEGORY_ORDER[f.label];
    if (order !== undefined && order < bestOrder) {
      best = f.label;
      bestOrder = order;
    }
  }
  return best;
}
