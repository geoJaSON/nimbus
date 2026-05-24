import { useEffect } from 'react';

interface AboutModalProps {
  onClose: () => void;
}

const VERSION = '1.0.0';

const DATA_SOURCES = [
  { name: 'NWS API', url: 'https://api.weather.gov', detail: 'Watches, warnings, advisories, LSR products' },
  { name: 'NOAA NCEP GeoServer', url: 'https://opengeo.ncep.noaa.gov', detail: 'Radar tiles (WMS): Super-Res REF/VEL, HCA, CONUS mosaics' },
  { name: 'NOAA SPC', url: 'https://www.spc.noaa.gov', detail: 'Day 1 convective outlook, mesoscale discussions' },
  { name: 'IEM (Iowa State)', url: 'https://mesonet.agron.iastate.edu', detail: 'SCIT storm-cell attributes (NEXRAD Level III)' },
  { name: 'OU / NSSL mPING', url: 'https://mping.ou.edu', detail: 'Crowdsourced weather reports (v1.1 — pending API key)' },
];

const TECH = [
  { name: 'MapLibre GL JS', url: 'https://maplibre.org' },
  { name: 'CARTO Dark Matter basemap', url: 'https://carto.com/basemaps/' },
  { name: 'Tauri', url: 'https://tauri.app' },
  { name: 'React', url: 'https://react.dev' },
];

export function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="crt-border bg-terminal w-[28rem] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header flex items-center justify-between shrink-0">
          <span>ABOUT NIMBUS</span>
          <button
            onClick={onClose}
            className="text-phosphor-dim hover:text-phosphor ml-4 leading-none"
            aria-label="Close"
          >
            [X]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 text-xs space-y-4">
          <div>
            <div className="crt-glow text-phosphor font-bold tracking-[0.25em] text-base">NIMBUS</div>
            <div className="text-phosphor-dim mt-1">Retro terminal NEXRAD weather radar</div>
            <div className="text-phosphor-dim mt-0.5 tabular-nums">v{VERSION}</div>
          </div>

          <div>
            <div className="text-amber font-bold mb-1 tracking-wider">DATA SOURCES</div>
            <ul className="space-y-1.5 text-phosphor-dim">
              {DATA_SOURCES.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-phosphor hover:underline"
                  >
                    {s.name}
                  </a>
                  <div className="text-phosphor-dim leading-tight">{s.detail}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-amber font-bold mb-1 tracking-wider">BUILT WITH</div>
            <ul className="space-y-0.5 text-phosphor-dim">
              {TECH.map((t) => (
                <li key={t.name}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-phosphor hover:underline"
                  >
                    {t.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-phosphor-dim border-t border-terminal-border pt-3 leading-relaxed">
            Data provided by US Government agencies (NWS, NOAA, SPC, NSSL) is in the public domain.
            Not for use as the sole source of weather information during life-threatening situations —
            always consult official NWS forecasts and your local emergency management.
          </div>
        </div>
      </div>
    </div>
  );
}
