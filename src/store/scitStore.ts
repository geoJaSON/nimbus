import { create } from 'zustand';
import type { StormCell } from '../types';

interface ScitState {
  cells: StormCell[];           // cells for current station (already filtered)
  fetchedAt: Date | null;
  selectedCellId: string | null;
  showCells: boolean;
  showMotion: boolean;

  setCells: (cells: StormCell[], at: Date) => void;
  clearCells: () => void;
  selectCell: (id: string | null) => void;
  toggleCells: () => void;
  toggleMotion: () => void;
}

export const useScitStore = create<ScitState>((set) => ({
  cells: [],
  fetchedAt: null,
  selectedCellId: null,
  showCells: true,
  showMotion: true,

  setCells: (cells, at) => set({ cells, fetchedAt: at }),
  clearCells: () => set({ cells: [], fetchedAt: null, selectedCellId: null }),
  selectCell: (id) => set({ selectedCellId: id }),
  toggleCells: () => set((s) => ({ showCells: !s.showCells })),
  toggleMotion: () => set((s) => ({ showMotion: !s.showMotion })),
}));
