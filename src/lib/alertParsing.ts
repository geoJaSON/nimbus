import type { WeatherAlert } from '../types';

export function parseNWSAlerts(data: any): WeatherAlert[] {
  if (!Array.isArray(data?.features)) return [];

  return data.features
    .map((f: any): WeatherAlert | null => {
      const p = f.properties;
      if (!p) return null;

      let polygon: WeatherAlert['polygon'] = null;
      const geom = f.geometry;
      if (geom?.type === 'Polygon' || geom?.type === 'MultiPolygon') {
        polygon = geom;
      }

      return {
        id: p.id ?? f.id ?? crypto.randomUUID(),
        event: p.event ?? 'Unknown',
        severity: normalizeSeverity(p.severity),
        polygon,
        issued: new Date(p.sent ?? p.effective ?? Date.now()),
        expires: new Date(p.expires ?? p.ends ?? Date.now() + 3600000),
        headline: p.headline ?? p.event ?? '',
        description: p.description ?? '',
        instruction: p.instruction ?? '',
        wfo: p.senderName ?? '',
      };
    })
    .filter((a: WeatherAlert | null): a is WeatherAlert => a !== null)
    .sort(severitySort);
}

function normalizeSeverity(s: string): WeatherAlert['severity'] {
  const map: Record<string, WeatherAlert['severity']> = {
    Extreme: 'Extreme',
    Severe: 'Severe',
    Moderate: 'Moderate',
    Minor: 'Minor',
  };
  return map[s] ?? 'Unknown';
}

const SEVERITY_ORDER: Record<WeatherAlert['severity'], number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

function severitySort(a: WeatherAlert, b: WeatherAlert): number {
  const sevDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  if (sevDiff !== 0) return sevDiff;
  return b.issued.getTime() - a.issued.getTime();
}

// Alert event → fill/outline color
export const ALERT_COLORS: Record<string, string> = {
  'Tornado Warning': '#ff0000',
  'Tornado Watch': '#ff6600',
  'Severe Thunderstorm Warning': '#ff8800',
  'Severe Thunderstorm Watch': '#ffaa00',
  'Flash Flood Warning': '#00ff00',
  'Flash Flood Watch': '#00cc00',
  'Flash Flood Emergency': '#ff00ff',
  'Special Marine Warning': '#ffa500',
};

export function alertColor(event: string): string {
  return ALERT_COLORS[event] ?? '#ffb000';
}

export function isWatch(event: string): boolean {
  return event.toLowerCase().includes('watch');
}

export function isTornado(event: string): boolean {
  return event.toLowerCase().includes('tornado warning');
}

// "Severe" = the high-impact convective/flood emergencies. Tornado warnings,
// severe thunderstorm warnings, flash flood emergencies, special marine warnings.
export function isSevere(event: string): boolean {
  const e = event.toLowerCase();
  if (e.includes('watch')) return false;
  return (
    e.includes('tornado warning') ||
    e.includes('severe thunderstorm warning') ||
    e.includes('flash flood emergency') ||
    e.includes('special marine warning') ||
    e.includes('extreme wind warning')
  );
}
