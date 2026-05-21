import { useState, useMemo } from 'react';
import { WSR88D_STATIONS, findNearestStation } from '../../lib/stationList';
import { useRadarStore } from '../../store/radarStore';
import { useSettingsStore } from '../../store/settingsStore';
import { TerminalPanel } from '../shared/TerminalPanel';

interface StationPickerProps {
  onClose: () => void;
}

export function StationPicker({ onClose }: StationPickerProps) {
  const [query, setQuery] = useState('');
  const setStation = useRadarStore((s) => s.setStation);
  const currentStation = useRadarStore((s) => s.station);
  const homeLocation = useSettingsStore((s) => s.homeLocation);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return WSR88D_STATIONS.slice(0, 60);
    return WSR88D_STATIONS.filter(
      (s) => s.id.includes(q) || s.name.toUpperCase().includes(q)
    ).slice(0, 60);
  }, [query]);

  function handleSelect(stationId: string) {
    const s = WSR88D_STATIONS.find((s) => s.id === stationId);
    if (s) {
      setStation(s);
      onClose();
    }
  }

  function handleNearest() {
    if (!homeLocation) return;
    const nearest = findNearestStation(homeLocation.lat, homeLocation.lon);
    setStation(nearest);
    onClose();
  }

  return (
    <TerminalPanel title="STATION SELECT" onClose={onClose} width="w-72">
      <div className="p-2 border-b border-terminal-border">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH ID OR NAME..."
          className="w-full bg-transparent border border-terminal-border px-2 py-1 text-xs text-phosphor placeholder-terminal-border focus:border-phosphor focus:outline-none font-mono"
          autoFocus
        />
      </div>

      {homeLocation && (
        <div className="px-2 pt-2">
          <button
            onClick={handleNearest}
            className="retro-btn w-full text-center text-xs"
          >
            ◎ NEAREST TO HOME
          </button>
        </div>
      )}

      <div className="overflow-y-auto">
        {filtered.map((s) => {
          const isActive = s.id === currentStation?.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              className={`w-full text-left px-3 py-1.5 flex items-center gap-3 hover:bg-phosphor-dark transition-colors ${
                isActive ? 'bg-phosphor-dark text-phosphor' : 'text-phosphor-dim'
              }`}
            >
              <span className={`font-bold w-10 shrink-0 ${isActive ? 'text-phosphor' : 'text-phosphor-dim'}`}>
                {s.id}
              </span>
              <span className="text-xs truncate">{s.name.toUpperCase()}</span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-xs text-terminal-border text-center">
            NO STATIONS FOUND
          </div>
        )}
      </div>
    </TerminalPanel>
  );
}
