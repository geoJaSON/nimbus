import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MesoscaleDiscussion } from '../types';

interface McdState {
  mcds: MesoscaleDiscussion[];
  fetchedAt: Date | null;
  selectedMcdNum: number | null;
  showMcds: boolean;

  setMcds: (mcds: MesoscaleDiscussion[], at: Date) => void;
  selectMcd: (num: number | null) => void;
  toggleMcds: () => void;
}

export const useMcdStore = create<McdState>()(
  persist(
    (set) => ({
      mcds: [],
      fetchedAt: null,
      selectedMcdNum: null,
      showMcds: true,

      setMcds: (mcds, at) => set({ mcds, fetchedAt: at }),
      selectMcd: (num) => set({ selectedMcdNum: num }),
      toggleMcds: () => set((s) => ({ showMcds: !s.showMcds })),
    }),
    {
      name: 'nimbus-mcd',
      partialize: (s) => ({ showMcds: s.showMcds }),
    }
  )
);
