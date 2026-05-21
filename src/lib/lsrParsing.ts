import type { LocalStormReport } from '../types';

// NWS LSR product fixed-width format:
//   Col 0-11:  Time+spaces  "HHMM AM     "
//   Col 12-28: Event type   "Marine Tstm Wind"
//   Col 29-52: Location     "1 ENE Quintana          "
//   End of line: "28.94N 95.29W"
//   Line 2 col 0-9:  Date "MM/DD/YYYY"
//   Line 2 col 12-28: Magnitude "M46 MPH         "
//   Line 2 col 53+:   Source

const LAT_LON_RE = /(\d{1,3}\.\d{2})N\s+(\d{1,3}\.\d{2})([EW])\s*$/;
const TIME_RE = /^(\d{4})\s+(AM|PM)/i;
const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})/;

function classifyEvent(type: string): LocalStormReport['type'] {
  const t = type.toUpperCase();
  if (t.includes('TORNADO')) return 'TORNADO';
  if (t.includes('HAIL')) return 'HAIL';
  if (t.includes('WIND') || t.includes('TSTM')) return 'WIND';
  if (t.includes('FLOOD')) return 'FLOOD';
  if (t.includes('SNOW') || t.includes('BLIZZARD') || t.includes('ICE')) return 'SNOW';
  return 'OTHER';
}

export function parseLsrText(text: string, wfo: string): LocalStormReport[] {
  const results: LocalStormReport[] = [];
  // Strip blank/whitespace-only lines so consecutive pairs are adjacent
  const lines = text.split('\n').filter((l) => l.trim().length > 0);

  for (let i = 0; i < lines.length - 1; i++) {
    const line1 = lines[i];
    const line2 = lines[i + 1];

    const latLonMatch = LAT_LON_RE.exec(line1);
    if (!latLonMatch) continue;

    const timeMatch = TIME_RE.exec(line1.trim());
    const dateMatch = DATE_RE.exec(line2.trim());
    if (!timeMatch || !dateMatch) continue;

    const lat = parseFloat(latLonMatch[1]);
    const lonAbs = parseFloat(latLonMatch[2]);
    const lon = latLonMatch[3] === 'W' ? -lonAbs : lonAbs;

    let hours = parseInt(timeMatch[1].slice(0, 2), 10);
    const minutes = parseInt(timeMatch[1].slice(2), 10);
    if (timeMatch[2].toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (timeMatch[2].toUpperCase() === 'AM' && hours === 12) hours = 0;

    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);
    const time = new Date(Date.UTC(year, month, day, hours, minutes));

    const eventType = line1.slice(12, 29).trim();
    const location = line1
      .slice(29)
      .replace(/\s*\d{1,3}\.\d{2}[NS]\s+\d{1,3}\.\d{2}[EW]\s*$/, '')
      .trim();
    const magnitude = line2.slice(12, 29).trim();
    const source = line2.length > 53 ? line2.slice(53).trim() : '';

    results.push({
      id: `${wfo}-${time.getTime()}-${Math.round(lat * 100)}-${Math.round(Math.abs(lon) * 100)}`,
      type: classifyEvent(eventType),
      lat,
      lon,
      time,
      magnitude,
      location,
      remarks: eventType,
      source: source || wfo,
    });

    i++; // consume line2, don't re-process as next line1
  }

  return results;
}

export const LSR_COLORS: Record<LocalStormReport['type'], string> = {
  TORNADO: '#ff2222',
  HAIL: '#00ee66',
  WIND: '#ff8800',
  FLOOD: '#4488ff',
  SNOW: '#88ccff',
  OTHER: '#aaaaaa',
};
