import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorTableKey } from '../types';
import type { ThemeKey, FontSizeKey } from '../theme/themes';

interface SettingsState {
  homeLocation: { lat: number; lon: number } | null;
  colorTable: ColorTableKey;
  loopDepth: number;
  theme: ThemeKey;
  fontSize: FontSizeKey;
  noiseFloorDbz: number; // hide reflectivity below this dBZ; 0 = off

  setHomeLocation: (loc: { lat: number; lon: number } | null) => void;
  setColorTable: (table: ColorTableKey) => void;
  setLoopDepth: (depth: number) => void;
  setTheme: (theme: ThemeKey) => void;
  setFontSize: (size: FontSizeKey) => void;
  setNoiseFloorDbz: (dbz: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      homeLocation: null,
      colorTable: 'NWS_REF',
      loopDepth: 10,
      theme: 'GREEN',
      fontSize: 'M',
      noiseFloorDbz: 0,

      setHomeLocation: (loc) => set({ homeLocation: loc }),
      setColorTable: (table) => set({ colorTable: table }),
      setLoopDepth: (depth) => set({ loopDepth: depth }),
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: size }),
      setNoiseFloorDbz: (dbz) => set({ noiseFloorDbz: dbz }),
    }),
    { name: 'nimbus-settings' }
  )
);
