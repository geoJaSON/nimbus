import { useEffect, useRef } from 'react';
import { useRadarStore } from '../store/radarStore';
import { useSettingsStore } from '../store/settingsStore';
import { fetchScanTimestamps } from '../lib/wmsCapabilities';
import type { LoopFrame } from '../types';

// WSR-88D volume scans complete every ~5 min. Poll a bit faster so we usually
// catch a new scan within a couple of minutes of it being available.
const REFRESH_MS = 3 * 60 * 1000;

// Maps loopSpeed (1–10) to ms delay between frames
function speedToMs(speed: number): number {
  // speed 1 = 1400ms, speed 5 = 600ms, speed 10 = 150ms
  return Math.round(1500 - speed * 135);
}

function framesFromTimestamps(timestamps: Date[]): LoopFrame[] {
  return timestamps.map((t) => ({ timestamp: t, scanAngle: 0.5 }));
}

export function useRadarLoop() {
  const station = useRadarStore((s) => s.station);
  const productCode = useRadarStore((s) => s.productCode);
  const loopDepth = useSettingsStore((s) => s.loopDepth);
  const isLoopPlaying = useRadarStore((s) => s.isLoopPlaying);
  const loopSpeed = useRadarStore((s) => s.loopSpeed);
  const loopFrames = useRadarStore((s) => s.loopFrames);
  const setLoopFrames = useRadarStore((s) => s.setLoopFrames);
  const refreshLoopFrames = useRadarStore((s) => s.refreshLoopFrames);
  const setLoadingTiles = useRadarStore((s) => s.setLoadingTiles);
  const stepFrame = useRadarStore((s) => s.stepFrame);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch timestamps whenever station or product changes — and periodically
  // re-fetch to pick up new scans without the user reloading.
  useEffect(() => {
    if (!station) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoadingTiles(true);

    // Drop the previous product/station's frames right away. The map renders
    // a single no-TIME frame (GeoServer serves the latest scan) while the
    // timestamp fetch is in flight, so switching products shows imagery
    // immediately instead of holding stale layers until the fetch lands.
    setLoopFrames([]);

    // Initial load: jump to latest frame.
    fetchScanTimestamps(station.id, productCode, loopDepth)
      .then((timestamps) => {
        if (ac.signal.aborted) return;
        setLoopFrames(framesFromTimestamps(timestamps));
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.warn('Failed to fetch scan timestamps:', err);
        setLoopFrames([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingTiles(false);
      });

    // Periodic refresh: preserve user's scrub position.
    const intervalId = setInterval(async () => {
      if (ac.signal.aborted) return;
      try {
        const timestamps = await fetchScanTimestamps(station.id, productCode, loopDepth);
        if (ac.signal.aborted) return;
        refreshLoopFrames(framesFromTimestamps(timestamps));
      } catch {
        // Silent — keep showing existing frames, try again next tick.
      }
    }, REFRESH_MS);

    return () => {
      ac.abort();
      clearInterval(intervalId);
    };
  }, [station?.id, productCode, loopDepth]);

  // Playback timer
  useEffect(() => {
    if (!isLoopPlaying || !loopFrames.length) return;
    const delay = speedToMs(loopSpeed);
    const id = setInterval(() => stepFrame(1), delay);
    return () => clearInterval(id);
  }, [isLoopPlaying, loopSpeed, loopFrames.length]);
}
