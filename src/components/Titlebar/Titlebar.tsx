import { useState, useEffect, useMemo } from 'react';
import { useRadarStore } from '../../store/radarStore';
import { useAlertStore } from '../../store/alertStore';
import { useSpcStore } from '../../store/spcStore';
import { useScitStore } from '../../store/scitStore';
import { useMcdStore } from '../../store/mcdStore';
import { useUIStore, type AlertFilter } from '../../store/uiStore';
import { isTornado, isWatch, isSevere } from '../../lib/alertParsing';
import { isCellSevere } from '../../lib/scitData';
import { highestActiveCategory, SPC_BADGE_COLORS } from '../../lib/spcOutlook';
import { RetroButton } from '../shared/RetroButton';

export function Titlebar() {
  const station = useRadarStore((s) => s.station);
  const alerts = useAlertStore((s) => s.alerts);
  const lsrCount = useSpcStore((s) => s.lsrs.length);
  const outlookFeatures = useSpcStore((s) => s.outlookFeatures);
  const cells = useScitStore((s) => s.cells);
  const mcdCount = useMcdStore((s) => s.mcds.length);

  const stationPickerOpen = useUIStore((s) => s.stationPickerOpen);
  const alertPanelOpen = useUIStore((s) => s.alertPanelOpen);
  const alertFilter = useUIStore((s) => s.alertFilter);
  const lsrPanelOpen = useUIStore((s) => s.lsrPanelOpen);
  const scitPanelOpen = useUIStore((s) => s.scitPanelOpen);
  const mcdPanelOpen = useUIStore((s) => s.mcdPanelOpen);
  const toggleStationPicker = useUIStore((s) => s.toggleStationPicker);
  const toggleLsrPanel = useUIStore((s) => s.toggleLsrPanel);
  const toggleScitPanel = useUIStore((s) => s.toggleScitPanel);
  const toggleMcdPanel = useUIStore((s) => s.toggleMcdPanel);
  const openAlertPanel = useUIStore((s) => s.openAlertPanel);
  const setAlertPanelOpen = useUIStore((s) => s.setAlertPanelOpen);
  const setAboutModalOpen = useUIStore((s) => s.setAboutModalOpen);
  const setSettingsModalOpen = useUIStore((s) => s.setSettingsModalOpen);

  const [now, setNow] = useState(new Date());
  const [flash, setFlash] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tornadoCount = alerts.filter((a) => isTornado(a.event)).length;
  const severeCount = alerts.filter((a) => isSevere(a.event)).length;
  const warnCount = alerts.filter((a) => !isWatch(a.event) && !isSevere(a.event)).length;
  const watchCount = alerts.filter((a) => isWatch(a.event)).length;
  const severeCells = cells.filter(isCellSevere).length;

  useEffect(() => {
    if (!tornadoCount) return;
    const id = setInterval(() => setFlash((v) => !v), 600);
    return () => clearInterval(id);
  }, [tornadoCount]);

  const spcRisk = useMemo(() => {
    const cat = highestActiveCategory(outlookFeatures);
    return cat && cat !== 'TSTM' ? cat : null;
  }, [outlookFeatures]);

  const utcTime = now.toISOString().slice(11, 19) + 'Z';

  // Clicking an alert-filter badge: if its panel is already open showing
  // the same filter, close it; otherwise open with that filter.
  const onAlertFilterClick = (filter: AlertFilter) => {
    if (alertPanelOpen && alertFilter === filter) {
      setAlertPanelOpen(false);
    } else {
      openAlertPanel(filter);
    }
  };

  const isActiveFilter = (filter: AlertFilter) => alertPanelOpen && alertFilter === filter;

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-terminal-border bg-terminal shrink-0 select-none">
      <div className="crt-glow text-phosphor font-mono tracking-[0.2em] text-base font-bold">
        NIMBUS
      </div>

      <div className="w-px h-4 bg-terminal-border" />

      <button
        onClick={toggleStationPicker}
        className="flex items-center gap-2 hover:text-phosphor text-phosphor-dim transition-colors"
      >
        {station ? (
          <>
            <span className="text-phosphor font-bold tracking-widest">{station.id}</span>
            <span className="text-xs">{station.name.toUpperCase()}</span>
          </>
        ) : (
          <span className="text-xs animate-blink">SELECT STATION...</span>
        )}
        <span className="text-terminal-border text-xs">[{stationPickerOpen ? '▲' : '▼'}]</span>
      </button>

      {/* Situational badges */}
      {spcRisk && (
        <span
          className="text-xs font-bold px-2 py-0.5 border"
          style={{ color: SPC_BADGE_COLORS[spcRisk], borderColor: SPC_BADGE_COLORS[spcRisk] }}
          title="SPC Day 1 Convective Outlook"
        >
          {spcRisk} RISK
        </span>
      )}

      {/* Alert filter buttons — replace the old ALERTS panel. Each opens the
          panel with its respective filter. */}
      {severeCount > 0 && (
        <button
          onClick={() => onAlertFilterClick('SEVERE')}
          className={`text-xs font-bold px-2 py-0.5 border transition-colors ${
            isActiveFilter('SEVERE') ? 'bg-warn-svr/20' : 'hover:bg-warn-svr/10'
          }`}
          style={{
            color: tornadoCount > 0 ? '#ff0000' : undefined,
            borderColor: tornadoCount > 0 ? '#ff0000' : undefined,
            opacity: tornadoCount > 0 && !flash ? 0.3 : 1,
            transition: 'opacity 0.1s, background-color 0.1s',
          }}
          title={tornadoCount > 0 ? `${tornadoCount} tornado warning(s) in severe set` : undefined}
        >
          ◆ {severeCount} SEVERE
        </button>
      )}
      {warnCount > 0 && (
        <button
          onClick={() => onAlertFilterClick('WARN')}
          className={`text-xs text-warn-svr border border-warn-svr px-2 py-0.5 transition-colors ${
            isActiveFilter('WARN') ? 'bg-warn-svr/20' : 'hover:bg-warn-svr/10'
          }`}
        >
          ◆ {warnCount} WARN
        </button>
      )}
      {watchCount > 0 && (
        <button
          onClick={() => onAlertFilterClick('WATCH')}
          className={`text-xs text-amber-dim border border-amber-dim px-2 py-0.5 transition-colors ${
            isActiveFilter('WATCH') ? 'bg-amber-dim/20' : 'hover:bg-amber-dim/10'
          }`}
        >
          ◇ {watchCount} WATCH
        </button>
      )}
      {severeCells > 0 && (
        <span className="text-xs text-warn-svr border border-warn-svr px-2 py-0.5" title="Severe storm cells in range">
          ● {severeCells} SEV
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 text-xs text-phosphor-dim">
        {mcdCount > 0 && (
          <RetroButton active={mcdPanelOpen} onClick={toggleMcdPanel}>
            MCD ({mcdCount})
          </RetroButton>
        )}

        <RetroButton active={scitPanelOpen} onClick={toggleScitPanel} variant={severeCells > 0 ? 'danger' : 'default'}>
          SCIT{cells.length > 0 ? ` (${cells.length})` : ''}
        </RetroButton>

        <RetroButton active={lsrPanelOpen} onClick={toggleLsrPanel}>
          LSR{lsrCount > 0 ? ` (${lsrCount})` : ''}
        </RetroButton>

        <RetroButton active={stationPickerOpen} onClick={toggleStationPicker}>
          STATIONS
        </RetroButton>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="text-phosphor-dim hover:text-phosphor px-1.5 py-0.5 text-xs"
          title="Settings"
        >
          [CFG]
        </button>

        <button
          onClick={() => setAboutModalOpen(true)}
          className="text-phosphor-dim hover:text-phosphor px-1.5 py-0.5 text-xs"
          title="About Nimbus"
        >
          [?]
        </button>

        <div className="w-px h-4 bg-terminal-border" />

        <span className="tracking-widest tabular-nums">{utcTime}</span>
      </div>
    </div>
  );
}
