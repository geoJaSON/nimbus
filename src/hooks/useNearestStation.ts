import { useEffect } from 'react';
import { findNearestStation } from '../lib/stationList';
import { ipGeolocate } from '../lib/geolocate';
import { useRadarStore } from '../store/radarStore';
import { useSettingsStore } from '../store/settingsStore';

// Picks an initial station for first launch. Station and home location both
// persist, so this only does network work once per install.
export function useNearestStation() {
  const station = useRadarStore((s) => s.station);
  const setStation = useRadarStore((s) => s.setStation);
  const homeLocation = useSettingsStore((s) => s.homeLocation);
  const setHomeLocation = useSettingsStore((s) => s.setHomeLocation);

  useEffect(() => {
    if (station) return;

    if (homeLocation) {
      setStation(findNearestStation(homeLocation.lat, homeLocation.lon));
      return;
    }

    let cancelled = false;
    ipGeolocate().then((loc) => {
      if (cancelled) return;
      if (loc) {
        setHomeLocation(loc);
        setStation(findNearestStation(loc.lat, loc.lon));
      } else {
        // Default to Houston area (KHGX) if location unavailable
        setStation(findNearestStation(29.76, -95.37));
      }
    });
    return () => { cancelled = true; };
  }, []);
}
