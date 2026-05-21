import { useEffect, useRef } from 'react';
import { useRadarStore } from '../store/radarStore';
import { fetchScanTimestamps } from '../lib/wmsCapabilities';
import type { LoopFrame } from '../types';

const LOOP_DEPTHS = 10;

// Maps loopSpeed (1–10) to ms delay between frames
function speedToMs(speed: number): number {
  // speed 1 = 1400ms, speed 5 = 600ms, speed 10 = 150ms
  return Math.round(1500 - speed * 135);
}

export function useRadarLoop() {
  const station = useRadarStore((s) => s.station);
  const productCode = useRadarStore((s) => s.productCode);
  const isLoopPlaying = useRadarStore((s) => s.isLoopPlaying);
  const loopSpeed = useRadarStore((s) => s.loopSpeed);
  const loopFrames = useRadarStore((s) => s.loopFrames);
  const setLoopFrames = useRadarStore((s) => s.setLoopFrames);
  const setLoadingTiles = useRadarStore((s) => s.setLoadingTiles);
  const stepFrame = useRadarStore((s) => s.stepFrame);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch timestamps whenever station or product changes
  useEffect(() => {
    if (!station) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoadingTiles(true);

    fetchScanTimestamps(station.id, productCode, LOOP_DEPTHS)
      .then((timestamps) => {
        if (ac.signal.aborted) return;
        const frames: LoopFrame[] = timestamps.map((t) => ({
          timestamp: t,
          scanAngle: 0.5,
        }));
        setLoopFrames(frames);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        console.warn('Failed to fetch scan timestamps:', err);
        setLoopFrames([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingTiles(false);
      });

    return () => ac.abort();
  }, [station?.id, productCode]);

  // Playback timer
  useEffect(() => {
    if (!isLoopPlaying || !loopFrames.length) return;
    const delay = speedToMs(loopSpeed);
    const id = setInterval(() => stepFrame(1), delay);
    return () => clearInterval(id);
  }, [isLoopPlaying, loopSpeed, loopFrames.length]);
}
