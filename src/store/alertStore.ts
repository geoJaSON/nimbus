import { create } from 'zustand';
import type { WeatherAlert } from '../types';

interface AlertState {
  alerts: WeatherAlert[];
  selectedAlertId: string | null;
  lastFetched: Date | null;

  setAlerts: (alerts: WeatherAlert[]) => void;
  selectAlert: (id: string | null) => void;
  setLastFetched: (time: Date) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  selectedAlertId: null,
  lastFetched: null,

  setAlerts: (alerts) => set({ alerts }),
  selectAlert: (id) => set({ selectedAlertId: id }),
  setLastFetched: (time) => set({ lastFetched: time }),
}));
