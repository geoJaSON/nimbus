import { useEffect } from 'react';
import { findNearestStation } from '../lib/stationList';
import { useRadarStore } from '../store/radarStore';
import { useSettingsStore } from '../store/settingsStore';

export function useNearestStation() {
  const station = useRadarStore((s) => s.station);
  const setStation = useRadarStore((s) => s.setStation);
  const homeLocation = useSettingsStore((s) => s.homeLocation);
  const setHomeLocation = useSettingsStore((s) => s.setHomeLocation);

  useEffect(() => {
    if (station) return;

    if (homeLocation) {
      const nearest = findNearestStation(homeLocation.lat, homeLocation.lon);
      setStation(nearest);
      return;
    }

    if (!navigator.geolocation) {
      fallbackToDefault();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setHomeLocation({ lat: latitude, lon: longitude });
        const nearest = findNearestStation(latitude, longitude);
        setStation(nearest);
      },
      () => fallbackToDefault(),
      { timeout: 8000 }
    );

    function fallbackToDefault() {
      // Default to Houston area (KHGX) if location unavailable
      const nearest = findNearestStation(29.76, -95.37);
      setStation(nearest);
    }
  }, []);
}
