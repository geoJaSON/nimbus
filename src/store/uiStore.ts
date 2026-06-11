import { create } from 'zustand';

export type AlertFilter = 'WARN' | 'WATCH' | 'SEVERE';

// A target for the map to fly to / fit to. The `key` is used to retrigger
// the effect when the same logical target is selected again.
export type MapFocus =
  | { key: string; kind: 'point'; lon: number; lat: number; zoom?: number }
  | { key: string; kind: 'bounds'; bounds: [[number, number], [number, number]] };

interface UIState {
  stationPickerOpen: boolean;
  alertPanelOpen: boolean;
  alertFilter: AlertFilter;
  lsrPanelOpen: boolean;
  scitPanelOpen: boolean;
  mcdPanelOpen: boolean;
  aboutModalOpen: boolean;
  settingsModalOpen: boolean;

  mapFocus: MapFocus | null;

  setStationPickerOpen: (open: boolean) => void;
  setAlertPanelOpen: (open: boolean) => void;
  setLsrPanelOpen: (open: boolean) => void;
  setScitPanelOpen: (open: boolean) => void;
  setMcdPanelOpen: (open: boolean) => void;
  setAboutModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;

  toggleStationPicker: () => void;
  toggleAlertPanel: () => void;
  toggleLsrPanel: () => void;
  toggleScitPanel: () => void;
  toggleMcdPanel: () => void;

  openAlertPanel: (filter: AlertFilter) => void;
  setAlertFilter: (filter: AlertFilter) => void;

  focusMap: (focus: MapFocus) => void;
}

export const useUIStore = create<UIState>((set) => ({
  stationPickerOpen: false,
  alertPanelOpen: false,
  alertFilter: 'WARN',
  lsrPanelOpen: false,
  scitPanelOpen: false,
  mcdPanelOpen: false,
  aboutModalOpen: false,
  settingsModalOpen: false,

  mapFocus: null,

  setStationPickerOpen: (open) => set({ stationPickerOpen: open }),
  setAlertPanelOpen: (open) => set({ alertPanelOpen: open }),
  setLsrPanelOpen: (open) => set({ lsrPanelOpen: open }),
  setScitPanelOpen: (open) => set({ scitPanelOpen: open }),
  setMcdPanelOpen: (open) => set({ mcdPanelOpen: open }),
  setAboutModalOpen: (open) => set({ aboutModalOpen: open }),
  setSettingsModalOpen: (open) => set({ settingsModalOpen: open }),

  toggleStationPicker: () => set((s) => ({ stationPickerOpen: !s.stationPickerOpen })),
  toggleAlertPanel: () => set((s) => ({ alertPanelOpen: !s.alertPanelOpen })),
  toggleLsrPanel: () => set((s) => ({ lsrPanelOpen: !s.lsrPanelOpen })),
  toggleScitPanel: () => set((s) => ({ scitPanelOpen: !s.scitPanelOpen })),
  toggleMcdPanel: () => set((s) => ({ mcdPanelOpen: !s.mcdPanelOpen })),

  openAlertPanel: (filter) => set({ alertPanelOpen: true, alertFilter: filter }),
  setAlertFilter: (filter) => set({ alertFilter: filter }),

  focusMap: (focus) => set({ mapFocus: focus }),
}));
