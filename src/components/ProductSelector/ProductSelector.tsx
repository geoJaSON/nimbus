import { RADAR_PRODUCTS } from '../../lib/radarProducts';
import { useRadarStore } from '../../store/radarStore';
import { RetroButton } from '../shared/RetroButton';

export function ProductSelector() {
  const productCode = useRadarStore((s) => s.productCode);
  const setProduct = useRadarStore((s) => s.setProduct);

  const stationProducts = RADAR_PRODUCTS.filter((p) => p.scope === 'station');
  const conusProducts = RADAR_PRODUCTS.filter((p) => p.scope === 'conus');

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-terminal-border bg-terminal shrink-0 overflow-x-auto">
      <span className="text-xs text-terminal-border mr-1 shrink-0">SITE:</span>
      {stationProducts.map((p) => (
        <RetroButton
          key={p.code}
          active={p.code === productCode}
          onClick={() => setProduct(p.code)}
          className="shrink-0 text-xs px-2 py-0.5"
          title={`${p.label} (${p.unit})`}
        >
          {p.shortLabel}
        </RetroButton>
      ))}

      <div className="w-px h-4 bg-terminal-border mx-1 shrink-0" />

      <span className="text-xs text-terminal-border mr-1 shrink-0">CONUS:</span>
      {conusProducts.map((p) => (
        <RetroButton
          key={p.code}
          active={p.code === productCode}
          onClick={() => setProduct(p.code)}
          className="shrink-0 text-xs px-2 py-0.5"
          title={`${p.label} (${p.unit})`}
        >
          {p.shortLabel}
        </RetroButton>
      ))}
    </div>
  );
}
