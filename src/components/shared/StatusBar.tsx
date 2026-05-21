import { useRadarStore } from '../../store/radarStore';
import { getProduct } from '../../lib/radarProducts';

export function StatusBar() {
  const station = useRadarStore((s) => s.station);
  const productCode = useRadarStore((s) => s.productCode);
  const tilt = useRadarStore((s) => s.tilt);
  const scanTime = useRadarStore((s) => s.scanTime);
  const isLoadingTiles = useRadarStore((s) => s.isLoadingTiles);

  const product = getProduct(productCode);

  const scanAgeMs = scanTime ? Date.now() - scanTime.getTime() : null;
  const scanAgeMin = scanAgeMs !== null ? Math.floor(scanAgeMs / 60000) : null;
  const ageColor =
    scanAgeMin === null
      ? 'text-phosphor-dim'
      : scanAgeMin > 15
      ? 'text-warn-tornado animate-blink'
      : scanAgeMin > 5
      ? 'text-amber'
      : 'text-phosphor-dim';

  return (
    <div className="flex items-center gap-6 px-4 py-1.5 border-t border-terminal-border bg-terminal text-xs text-phosphor-dim shrink-0 select-none">
      <span>
        PROD:{' '}
        <span className="text-phosphor">{product.label.toUpperCase()}</span>
      </span>
      <span>
        TILT: <span className="text-phosphor">{tilt.toFixed(1)}°</span>
      </span>
      {station && (
        <span>
          SITE: <span className="text-phosphor">{station.id}</span>
        </span>
      )}
      {scanTime && (
        <span className={ageColor}>
          SCAN: {scanTime.toUTCString().slice(17, 22)}Z
          {scanAgeMin !== null && ` (+${scanAgeMin}m)`}
        </span>
      )}
      {isLoadingTiles && (
        <span className="text-amber animate-blink ml-auto">LOADING...</span>
      )}
      <span className="ml-auto text-terminal-border">
        NIMBUS v0.1 · NWS NEXRAD
      </span>
    </div>
  );
}
