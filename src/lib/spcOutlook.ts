import type { SpcOutlookFeature } from '../types';

const SPC_ARCHIVE = 'https://www.spc.noaa.gov/products/outlook/archive';

// SPC Day 1 convective outlook is issued at these UTC times each day.
const ISSUANCE_HHMM = [2000, 1630, 1300, 1200, 600, 100];

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function yearStr(d: Date): string {
  return d.toISOString().slice(0, 4);
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

// Compute up to 2 candidate (date, time) pairs to try, based on current UTC.
// We try the most-recently-expected issuance first, then fall back one slot
// (handles the ~5-10 min publishing lag right after a new issuance).
function candidateIssuances(now: Date): Array<{ date: Date; time: string }> {
  const utcHHMM = now.getUTCHours() * 100 + now.getUTCMinutes();
  const yesterday = new Date(now.getTime() - 86400000);

  // Find the index of the most recent issuance time <= utcHHMM (today),
  // or fall back to the last issuance of yesterday.
  const idx = ISSUANCE_HHMM.findIndex((t) => t <= utcHHMM);

  const candidates: Array<{ date: Date; time: string }> = [];
  if (idx === -1) {
    // Before today's first issuance — yesterday's last is current.
    candidates.push({ date: yesterday, time: pad4(ISSUANCE_HHMM[0]) });
    candidates.push({ date: yesterday, time: pad4(ISSUANCE_HHMM[1]) });
  } else {
    candidates.push({ date: now, time: pad4(ISSUANCE_HHMM[idx]) });
    // Fallback: the previous issuance (might be yesterday's 2000z if idx is last).
    if (idx + 1 < ISSUANCE_HHMM.length) {
      candidates.push({ date: now, time: pad4(ISSUANCE_HHMM[idx + 1]) });
    } else {
      candidates.push({ date: yesterday, time: pad4(ISSUANCE_HHMM[0]) });
    }
  }
  return candidates;
}

export async function fetchSpcDay1Outlook(): Promise<SpcOutlookFeature[]> {
  const candidates = candidateIssuances(new Date());

  for (const { date, time } of candidates) {
    const url = `${SPC_ARCHIVE}/${yearStr(date)}/day1otlk_${dateStr(date)}_${time}_cat.lyr.geojson`;
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
      // try next candidate
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
