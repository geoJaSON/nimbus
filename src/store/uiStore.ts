import { create } from 'zustand';

interface UIState {
  stationPickerOpen: boolean;
  alertPanelOpen: boolean;
  lsrPanelOpen: boolean;
  scitPanelOpen: boolean;
  mcdPanelOpen: boolean;

  setStationPickerOpen: (open: boolean) => void;
  setAlertPanelOpen: (open: boolean) => void;
  setLsrPanelOpen: (open: boolean) => void;
  setScitPanelOpen: (open: boolean) => void;
  setMcdPanelOpen: (open: boolean) => void;

  toggleStationPicker: () => void;
  toggleAlertPanel: () => void;
  toggleLsrPanel: () => void;
  toggleScitPanel: () => void;
  toggleMcdPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  stationPickerOpen: false,
  alertPanelOpen: false,
  lsrPanelOpen: false,
  scitPanelOpen: false,
  mcdPanelOpen: false,

  setStationPickerOpen: (open) => set({ stationPickerOpen: open }),
  setAlertPanelOpen: (open) => set({ alertPanelOpen: open }),
  setLsrPanelOpen: (open) => set({ lsrPanelOpen: open }),
  setScitPanelOpen: (open) => set({ scitPanelOpen: open }),
  setMcdPanelOpen: (open) => set({ mcdPanelOpen: open }),

  toggleStationPicker: () => set((s) => ({ stationPickerOpen: !s.stationPickerOpen })),
  toggleAlertPanel: () => set((s) => ({ alertPanelOpen: !s.alertPanelOpen })),
  toggleLsrPanel: () => set((s) => ({ lsrPanelOpen: !s.lsrPanelOpen })),
  toggleScitPanel: () => set((s) => ({ scitPanelOpen: !s.scitPanelOpen })),
  toggleMcdPanel: () => set((s) => ({ mcdPanelOpen: !s.mcdPanelOpen })),
}));
