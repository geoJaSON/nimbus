import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { findNearestStation } from '../../lib/stationList';
import { ipGeolocate } from '../../lib/geolocate';
import { THEMES, FONT_SIZES, type ThemeKey, type FontSizeKey } from '../../theme/themes';

interface SettingsModalProps {
  onClose: () => void;
}

const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];
const FONT_KEYS = Object.keys(FONT_SIZES) as FontSizeKey[];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const homeLocation = useSettingsStore((s) => s.homeLocation);
  const setHomeLocation = useSettingsStore((s) => s.setHomeLocation);
  const loopDepth = useSettingsStore((s) => s.loopDepth);
  const setLoopDepth = useSettingsStore((s) => s.setLoopDepth);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const noiseFloorDbz = useSettingsStore((s) => s.noiseFloorDbz);
  const setNoiseFloorDbz = useSettingsStore((s) => s.setNoiseFloorDbz);

  const [latText, setLatText] = useState(homeLocation ? homeLocation.lat.toFixed(4) : '');
  const [lonText, setLonText] = useState(homeLocation ? homeLocation.lon.toFixed(4) : '');
  const [detecting, setDetecting] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsed = { lat: parseFloat(latText), lon: parseFloat(lonText) };
  const parsedValid =
    Number.isFinite(parsed.lat) && Number.isFinite(parsed.lon) &&
    parsed.lat >= -90 && parsed.lat <= 90 && parsed.lon >= -180 && parsed.lon <= 180;
  const nearest = parsedValid ? findNearestStation(parsed.lat, parsed.lon) : null;

  function saveHome() {
    if (!parsedValid) {
      setHomeError('INVALID LAT/LON');
      return;
    }
    setHomeError(null);
    setHomeLocation({ lat: parsed.lat, lon: parsed.lon });
  }

  async function detectHome() {
    setDetecting(true);
    setHomeError(null);
    const loc = await ipGeolocate();
    setDetecting(false);
    if (!loc) {
      setHomeError('IP LOOKUP FAILED');
      return;
    }
    setLatText(loc.lat.toFixed(4));
    setLonText(loc.lon.toFixed(4));
    setHomeLocation(loc);
  }

  function clearHome() {
    setLatText('');
    setLonText('');
    setHomeError(null);
    setHomeLocation(null);
  }

  const saved =
    homeLocation !== null && parsedValid &&
    Math.abs(homeLocation.lat - parsed.lat) < 1e-4 && Math.abs(homeLocation.lon - parsed.lon) < 1e-4;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="crt-border bg-terminal w-[28rem] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header flex items-center justify-between shrink-0">
          <span>SETTINGS</span>
          <button
            onClick={onClose}
            className="text-phosphor-dim hover:text-phosphor ml-4 leading-none"
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 text-xs space-y-5">
          {/* Theme */}
          <div>
            <div className="text-amber font-bold mb-1.5 tracking-wider">THEME</div>
            <div className="flex gap-1">
              {THEME_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className={`retro-btn px-2 py-0.5 text-xs ${theme === k ? 'active' : ''}`}
                  style={{ color: THEMES[k].phosphor, borderColor: THEMES[k].border }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <div className="text-amber font-bold mb-1.5 tracking-wider">FONT SIZE</div>
            <div className="flex gap-1">
              {FONT_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setFontSize(k)}
                  className={`retro-btn px-3 py-0.5 text-xs ${fontSize === k ? 'active' : ''}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Loop depth */}
          <div>
            <div className="text-amber font-bold mb-1.5 tracking-wider">
              LOOP FRAMES <span className="text-phosphor tabular-nums ml-1">{loopDepth}</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              value={loopDepth}
              onChange={(e) => setLoopDepth(Number(e.target.value))}
              className="w-full accent-phosphor cursor-pointer"
              style={{ height: '3px' }}
            />
            <div className="text-phosphor-dim mt-1 leading-tight">
              Scans kept in the animation loop (~5 min apart).
            </div>
          </div>

          {/* Noise filter */}
          <div>
            <div className="text-amber font-bold mb-1.5 tracking-wider">
              NOISE FILTER{' '}
              <span className="text-phosphor tabular-nums ml-1">
                {noiseFloorDbz > 0 ? `< ${noiseFloorDbz} dBZ` : 'OFF'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={noiseFloorDbz}
              onChange={(e) => setNoiseFloorDbz(Number(e.target.value))}
              className="w-full accent-phosphor cursor-pointer"
              style={{ height: '3px' }}
            />
            <div className="text-phosphor-dim mt-1 leading-tight">
              Hides reflectivity below the threshold — clear-air clutter, bugs,
              dust. Applies to dBZ products only.
            </div>
          </div>

          {/* Home location */}
          <div>
            <div className="text-amber font-bold mb-1.5 tracking-wider">HOME LOCATION</div>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-1.5">
                <span className="text-phosphor-dim">LAT</span>
                <input
                  type="text"
                  value={latText}
                  onChange={(e) => setLatText(e.target.value)}
                  placeholder="29.7600"
                  className="w-20 bg-transparent border border-terminal-border px-1.5 py-0.5 text-xs text-phosphor placeholder-terminal-border focus:border-phosphor focus:outline-none font-mono tabular-nums"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-phosphor-dim">LON</span>
                <input
                  type="text"
                  value={lonText}
                  onChange={(e) => setLonText(e.target.value)}
                  placeholder="-95.3700"
                  className="w-24 bg-transparent border border-terminal-border px-1.5 py-0.5 text-xs text-phosphor placeholder-terminal-border focus:border-phosphor focus:outline-none font-mono tabular-nums"
                />
              </label>
              <button
                onClick={saveHome}
                disabled={!parsedValid || saved}
                className="retro-btn px-2 py-0.5 text-xs disabled:opacity-40"
              >
                {saved ? 'SAVED' : 'SAVE'}
              </button>
            </div>
            <div className="flex gap-1 mt-1.5">
              <button onClick={detectHome} disabled={detecting} className="retro-btn px-2 py-0.5 text-xs">
                {detecting ? 'DETECTING...' : '◎ DETECT VIA IP'}
              </button>
              {homeLocation && (
                <button onClick={clearHome} className="retro-btn px-2 py-0.5 text-xs">
                  CLEAR
                </button>
              )}
            </div>
            <div className="text-phosphor-dim mt-1.5 leading-tight">
              {homeError ? (
                <span className="text-warn-tornado">{homeError}</span>
              ) : nearest ? (
                <>NEAREST RADAR: <span className="text-phosphor">{nearest.id}</span> {nearest.name.toUpperCase()}</>
              ) : (
                'Shown as ⌂ on the map; used for nearest-station select.'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
