import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorTableKey } from '../types';

interface SettingsState {
  homeLocation: { lat: number; lon: number } | null;
  colorTable: ColorTableKey;
  showAlerts: boolean;
  showLsr: boolean;
  showMd: boolean;
  showOutlooks: boolean;
  loopDepth: number;

  setHomeLocation: (loc: { lat: number; lon: number } | null) => void;
  setColorTable: (table: ColorTableKey) => void;
  setShowAlerts: (v: boolean) => void;
  setShowLsr: (v: boolean) => void;
  setShowMd: (v: boolean) => void;
  setShowOutlooks: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      homeLocation: null,
      colorTable: 'NWS_REF',
      showAlerts: true,
      showLsr: true,
      showMd: true,
      showOutlooks: false,
      loopDepth: 10,

      setHomeLocation: (loc) => set({ homeLocation: loc }),
      setColorTable: (table) => set({ colorTable: table }),
      setShowAlerts: (v) => set({ showAlerts: v }),
      setShowLsr: (v) => set({ showLsr: v }),
      setShowMd: (v) => set({ showMd: v }),
      setShowOutlooks: (v) => set({ showOutlooks: v }),
    }),
    { name: 'nimbus-settings' }
  )
);
