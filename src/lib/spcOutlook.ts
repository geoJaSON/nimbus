import type { SpcOutlookFeature } from '../types';

const SPC_ARCHIVE = 'https://www.spc.noaa.gov/products/outlook/archive';
const ISSUANCE_TIMES = ['2000', '1630', '1300', '1200', '0600', '0100'];

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function yearStr(d: Date): string {
  return d.toISOString().slice(0, 4);
}

export async function fetchSpcDay1Outlook(): Promise<SpcOutlookFeature[]> {
  const now = new Date();
  // Try today then yesterday — early UTC morning the day's outlook may not exist yet
  const dates = [now, new Date(now.getTime() - 86400000)];

  for (const d of dates) {
    const date = dateStr(d);
    const year = yearStr(d);
    for (const time of ISSUANCE_TIMES) {
      const url = `${SPC_ARCHIVE}/${year}/day1otlk_${date}_${time}_cat.lyr.geojson`;
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        if (!Array.isArray(data?.features) || data.features.length === 0) continue;

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
        // try next time slot
      }
    }
  }

  return [];
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
