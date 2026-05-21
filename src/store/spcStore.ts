import { create } from 'zustand';
import type { SpcOutlookFeature, LocalStormReport } from '../types';

interface SpcState {
  outlookFeatures: SpcOutlookFeature[];
  outlookFetchedAt: Date | null;
  showOutlook: boolean;

  lsrs: LocalStormReport[];
  lsrFetchedAt: Date | null;
  selectedLsrId: string | null;
  showLsrs: boolean;

  setOutlook: (features: SpcOutlookFeature[], at: Date) => void;
  setLsrs: (lsrs: LocalStormReport[], at: Date) => void;
  clearLsrs: () => void;
  selectLsr: (id: string | null) => void;
  toggleOutlook: () => void;
  toggleLsrs: () => void;
}

export const useSpcStore = create<SpcState>((set) => ({
  outlookFeatures: [],
  outlookFetchedAt: null,
  showOutlook: true,

  lsrs: [],
  lsrFetchedAt: null,
  selectedLsrId: null,
  showLsrs: true,

  setOutlook: (features, at) => set({ outlookFeatures: features, outlookFetchedAt: at }),
  setLsrs: (lsrs, at) => set({ lsrs, lsrFetchedAt: at }),
  clearLsrs: () => set({ lsrs: [], lsrFetchedAt: null, selectedLsrId: null }),
  selectLsr: (id) => set({ selectedLsrId: id }),
  toggleOutlook: () => set((s) => ({ showOutlook: !s.showOutlook })),
  toggleLsrs: () => set((s) => ({ showLsrs: !s.showLsrs })),
}));
