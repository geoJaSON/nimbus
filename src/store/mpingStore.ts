import { create } from 'zustand';
import type { MpingReport } from '../types';

interface MpingState {
  reports: MpingReport[];
  fetchedAt: Date | null;
  showReports: boolean;

  setReports: (reports: MpingReport[], at: Date) => void;
  clearReports: () => void;
  toggleReports: () => void;
}

export const useMpingStore = create<MpingState>((set) => ({
  reports: [],
  fetchedAt: null,
  showReports: true,

  setReports: (reports, at) => set({ reports, fetchedAt: at }),
  clearReports: () => set({ reports: [], fetchedAt: null }),
  toggleReports: () => set((s) => ({ showReports: !s.showReports })),
}));
