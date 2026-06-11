import { useEffect } from 'react';
import { Titlebar } from './components/Titlebar/Titlebar';
import { RadarMap } from './components/RadarMap/RadarMap';
import { ProductSelector } from './components/ProductSelector/ProductSelector';
import { LoopControls } from './components/LoopControls/LoopControls';
import { StationPicker } from './components/StationPicker/StationPicker';
import { AlertPanel } from './components/AlertPanel/AlertPanel';
import { LSRPanel } from './components/LSRPanel/LSRPanel';
import { SCITPanel } from './components/SCITPanel/SCITPanel';
import { MCDPanel } from './components/MCDPanel/MCDPanel';
import { AboutModal } from './components/AboutModal/AboutModal';
import { SettingsModal } from './components/SettingsModal/SettingsModal';
import { StatusBar } from './components/shared/StatusBar';
import { useUIStore } from './store/uiStore';
import { useSettingsStore } from './store/settingsStore';
import { applyTheme, applyFontSize } from './theme/themes';
import { useNearestStation } from './hooks/useNearestStation';
import { useRadarLoop } from './hooks/useRadarLoop';
import { useAlertPolling } from './hooks/useAlertPolling';
import { useSpcData } from './hooks/useSpcData';
import { useLsrFetch } from './hooks/useLsrFetch';
import { useScitData } from './hooks/useScitData';
import { useMcdData } from './hooks/useMcdData';
import { useMpingData } from './hooks/useMpingData'; // no-op until VITE_MPING_TOKEN is set

export default function App() {
  const stationPickerOpen = useUIStore((s) => s.stationPickerOpen);
  const alertPanelOpen = useUIStore((s) => s.alertPanelOpen);
  const lsrPanelOpen = useUIStore((s) => s.lsrPanelOpen);
  const scitPanelOpen = useUIStore((s) => s.scitPanelOpen);
  const mcdPanelOpen = useUIStore((s) => s.mcdPanelOpen);
  const aboutModalOpen = useUIStore((s) => s.aboutModalOpen);
  const settingsModalOpen = useUIStore((s) => s.settingsModalOpen);
  const setStationPickerOpen = useUIStore((s) => s.setStationPickerOpen);
  const setAlertPanelOpen = useUIStore((s) => s.setAlertPanelOpen);
  const setLsrPanelOpen = useUIStore((s) => s.setLsrPanelOpen);
  const setScitPanelOpen = useUIStore((s) => s.setScitPanelOpen);
  const setMcdPanelOpen = useUIStore((s) => s.setMcdPanelOpen);
  const setAboutModalOpen = useUIStore((s) => s.setAboutModalOpen);
  const setSettingsModalOpen = useUIStore((s) => s.setSettingsModalOpen);

  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  useEffect(() => applyTheme(theme), [theme]);
  useEffect(() => applyFontSize(fontSize), [fontSize]);

  useNearestStation();
  useRadarLoop();
  useAlertPolling();
  useSpcData();
  useLsrFetch();
  useScitData();
  useMcdData();
  useMpingData();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-terminal text-phosphor font-mono">
      <Titlebar />

      <ProductSelector />
      <LoopControls />

      <div className="flex flex-1 overflow-hidden">
        {stationPickerOpen && (
          <StationPicker onClose={() => setStationPickerOpen(false)} />
        )}
        <RadarMap />
        {scitPanelOpen && (
          <SCITPanel onClose={() => setScitPanelOpen(false)} />
        )}
        {mcdPanelOpen && (
          <MCDPanel onClose={() => setMcdPanelOpen(false)} />
        )}
        {alertPanelOpen && (
          <AlertPanel onClose={() => setAlertPanelOpen(false)} />
        )}
        {lsrPanelOpen && (
          <LSRPanel onClose={() => setLsrPanelOpen(false)} />
        )}
      </div>

      <StatusBar />

      {aboutModalOpen && (
        <AboutModal onClose={() => setAboutModalOpen(false)} />
      )}

      {settingsModalOpen && (
        <SettingsModal onClose={() => setSettingsModalOpen(false)} />
      )}
    </div>
  );
}
