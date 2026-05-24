import { create } from 'zustand';
import type { RadarStation, LoopFrame } from '../types';
import { DEFAULT_PRODUCT } from '../lib/radarProducts';

interface RadarState {
  station: RadarStation | null;
  productCode: string;
  tilt: number;
  loopFrames: LoopFrame[];
  currentFrameIndex: number;
  isLoopPlaying: boolean;
  loopSpeed: number;
  scanTime: Date | null;
  isLoadingTiles: boolean;

  setStation: (station: RadarStation) => void;
  setProduct: (code: string) => void;
  setTilt: (tilt: number) => void;
  setLoopFrames: (frames: LoopFrame[]) => void;
  refreshLoopFrames: (frames: LoopFrame[]) => void;
  setCurrentFrame: (index: number) => void;
  setLoopPlaying: (playing: boolean) => void;
  setLoopSpeed: (speed: number) => void;
  setScanTime: (time: Date | null) => void;
  setLoadingTiles: (loading: boolean) => void;
  stepFrame: (delta: 1 | -1) => void;
}

export const useRadarStore = create<RadarState>((set, get) => ({
  station: null,
  productCode: DEFAULT_PRODUCT.code,
  tilt: 0.5,
  loopFrames: [],
  currentFrameIndex: 0,
  isLoopPlaying: false,
  loopSpeed: 6,
  scanTime: null,
  isLoadingTiles: false,

  setStation: (station) => set({ station }),
  setProduct: (code) => set({ productCode: code }),
  setTilt: (tilt) => set({ tilt }),
  setLoopFrames: (frames) =>
    set({ loopFrames: frames, currentFrameIndex: frames.length - 1, scanTime: frames[frames.length - 1]?.timestamp ?? null }),

  // Like setLoopFrames, but preserves user's scrub position:
  //   - If they were viewing the latest frame, advance to the new latest.
  //   - Else if their current timestamp is still in the new loop, jump to it.
  //   - Else clamp index.
  refreshLoopFrames: (frames) => {
    const { loopFrames: oldFrames, currentFrameIndex: oldIdx } = get();

    if (frames.length === 0) {
      set({ loopFrames: [], currentFrameIndex: 0, scanTime: null });
      return;
    }

    const wasAtLatest = oldFrames.length > 0 && oldIdx === oldFrames.length - 1;
    if (wasAtLatest) {
      const newIdx = frames.length - 1;
      set({ loopFrames: frames, currentFrameIndex: newIdx, scanTime: frames[newIdx]?.timestamp ?? null });
      return;
    }

    const currentTs = oldFrames[oldIdx]?.timestamp?.getTime();
    if (currentTs !== undefined) {
      const matchIdx = frames.findIndex((f) => f.timestamp?.getTime() === currentTs);
      if (matchIdx !== -1) {
        set({ loopFrames: frames, currentFrameIndex: matchIdx, scanTime: frames[matchIdx].timestamp });
        return;
      }
    }

    const clampedIdx = Math.min(oldIdx, frames.length - 1);
    set({ loopFrames: frames, currentFrameIndex: clampedIdx, scanTime: frames[clampedIdx]?.timestamp ?? null });
  },
  setCurrentFrame: (index) =>
    set((s) => ({ currentFrameIndex: index, scanTime: s.loopFrames[index]?.timestamp ?? s.scanTime })),
  setLoopPlaying: (playing) => set({ isLoopPlaying: playing }),
  setLoopSpeed: (speed) => set({ loopSpeed: speed }),
  setScanTime: (time) => set({ scanTime: time }),
  setLoadingTiles: (loading) => set({ isLoadingTiles: loading }),

  stepFrame: (delta) => {
    const { loopFrames, currentFrameIndex } = get();
    if (!loopFrames.length) return;
    const next = (currentFrameIndex + delta + loopFrames.length) % loopFrames.length;
    set({ currentFrameIndex: next, scanTime: loopFrames[next]?.timestamp ?? null });
  },
}));
