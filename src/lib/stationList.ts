import stationsData from '../../data/stations.json';
import type { RadarStation } from '../types';

export const ALL_STATIONS: RadarStation[] = stationsData as RadarStation[];

export const WSR88D_STATIONS: RadarStation[] = ALL_STATIONS.filter(
  (s) => s.stationType === 'WSR-88D'
);

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStation(lat: number, lon: number): RadarStation {
  let nearest = WSR88D_STATIONS[0];
  let minDist = Infinity;
  for (const station of WSR88D_STATIONS) {
    const dist = haversineKm(lat, lon, station.lat, station.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = station;
    }
  }
  return nearest;
}

export function getStationById(id: string): RadarStation | undefined {
  return ALL_STATIONS.find((s) => s.id === id);
}
