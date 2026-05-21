import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRadarStore } from '../../store/radarStore';
import { useAlertStore } from '../../store/alertStore';
import { useSpcStore } from '../../store/spcStore';
import { useScitStore } from '../../store/scitStore';
import { useMcdStore } from '../../store/mcdStore';
import { useUIStore } from '../../store/uiStore';
import { getProduct, buildWmsUrl } from '../../lib/radarProducts';
import { alertColor, isWatch, isTornado } from '../../lib/alertParsing';
import { LSR_COLORS } from '../../lib/lsrParsing';
import { dbzColor, cellRadius, projectPosition, isCellSevere } from '../../lib/scitData';

const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#060606' } }],
};

const ALERT_SOURCE = 'alerts-geojson';
const SPC_SOURCE = 'spc-outlook-geojson';
const MCD_SOURCE = 'mcd-geojson';
const LSR_SOURCE = 'lsrs-geojson';
const SCIT_SOURCE = 'scit-cells-geojson';
const SCIT_MOTION_SOURCE = 'scit-motion-geojson';

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

// Motion vector projection window (minutes ahead)
const MOTION_PROJECT_MINUTES = 30;

export function RadarMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tornadoFlash, setTornadoFlash] = useState(true);

  const frameLayerIds = useRef<string[]>([]);
  const frameSourceIds = useRef<string[]>([]);

  const station = useRadarStore((s) => s.station);
  const productCode = useRadarStore((s) => s.productCode);
  const loopFrames = useRadarStore((s) => s.loopFrames);
  const currentFrameIndex = useRadarStore((s) => s.currentFrameIndex);

  const alerts = useAlertStore((s) => s.alerts);
  const selectAlert = useAlertStore((s) => s.selectAlert);

  const outlookFeatures = useSpcStore((s) => s.outlookFeatures);
  const showOutlook = useSpcStore((s) => s.showOutlook);
  const lsrs = useSpcStore((s) => s.lsrs);
  const showLsrs = useSpcStore((s) => s.showLsrs);
  const toggleOutlook = useSpcStore((s) => s.toggleOutlook);
  const toggleLsrs = useSpcStore((s) => s.toggleLsrs);
  const selectLsr = useSpcStore((s) => s.selectLsr);

  const cells = useScitStore((s) => s.cells);
  const showCells = useScitStore((s) => s.showCells);
  const showMotion = useScitStore((s) => s.showMotion);
  const toggleCells = useScitStore((s) => s.toggleCells);
  const toggleMotion = useScitStore((s) => s.toggleMotion);
  const selectCell = useScitStore((s) => s.selectCell);

  const mcds = useMcdStore((s) => s.mcds);
  const showMcds = useMcdStore((s) => s.showMcds);
  const toggleMcds = useMcdStore((s) => s.toggleMcds);
  const selectMcd = useMcdStore((s) => s.selectMcd);

  const setAlertPanelOpen = useUIStore((s) => s.setAlertPanelOpen);
  const setLsrPanelOpen = useUIStore((s) => s.setLsrPanelOpen);
  const setScitPanelOpen = useUIStore((s) => s.setScitPanelOpen);
  const setMcdPanelOpen = useUIStore((s) => s.setMcdPanelOpen);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: DARK_STYLE,
      center: [-95.37, 29.76],
      zoom: 6,
      attributionControl: false,
    });

    m.on('load', () => setMapReady(true));
    m.on('error', () => {
      if (!m.isStyleLoaded()) {
        m.setStyle(FALLBACK_STYLE);
        m.once('styledata', () => setMapReady(true));
        setMapError('Basemap offline — radar tiles only');
      }
    });

    map.current = m;
    return () => { m.remove(); map.current = null; setMapReady(false); };
  }, []);

  // ── Add all overlay sources + layers once map is ready ───────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;

    // ── SPC Day 1 Outlook ─────────────────────────────────────────────────
    m.addSource(SPC_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'spc-outlook-fill',
      type: 'fill',
      source: SPC_SOURCE,
      paint: { 'fill-color': ['get', 'fill'], 'fill-opacity': 0.12 },
    });
    m.addLayer({
      id: 'spc-outlook-outline',
      type: 'line',
      source: SPC_SOURCE,
      paint: { 'line-color': ['get', 'stroke'], 'line-width': 1.5, 'line-opacity': 0.75 },
    });

    // ── SPC Mesoscale Discussions ─────────────────────────────────────────
    m.addSource(MCD_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'mcd-fill',
      type: 'fill',
      source: MCD_SOURCE,
      paint: { 'fill-color': '#ffb000', 'fill-opacity': 0.1 },
    });
    m.addLayer({
      id: 'mcd-outline',
      type: 'line',
      source: MCD_SOURCE,
      paint: { 'line-color': '#ffb000', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.9 },
    });

    // ── NWS Alerts ─────────────────────────────────────────────────────────
    m.addSource(ALERT_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'alerts-watch-fill',
      type: 'fill',
      source: ALERT_SOURCE,
      filter: ['==', ['get', 'watch'], true],
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.08 },
    });
    m.addLayer({
      id: 'alerts-watch-outline',
      type: 'line',
      source: ALERT_SOURCE,
      filter: ['==', ['get', 'watch'], true],
      paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [4, 3], 'line-opacity': 0.85 },
    });
    m.addLayer({
      id: 'alerts-warning-fill',
      type: 'fill',
      source: ALERT_SOURCE,
      filter: ['==', ['get', 'watch'], false],
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.18 },
    });
    m.addLayer({
      id: 'alerts-warning-outline',
      type: 'line',
      source: ALERT_SOURCE,
      filter: ['all', ['==', ['get', 'watch'], false], ['==', ['get', 'tornado'], false]],
      paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-opacity': 0.9 },
    });
    m.addLayer({
      id: 'alerts-tornado-outline',
      type: 'line',
      source: ALERT_SOURCE,
      filter: ['==', ['get', 'tornado'], true],
      paint: { 'line-color': '#ff0000', 'line-width': 2.5, 'line-opacity': 1 },
    });

    // ── SCIT motion vectors (below cell markers) ──────────────────────────
    m.addSource(SCIT_MOTION_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'scit-motion-lines',
      type: 'line',
      source: SCIT_MOTION_SOURCE,
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,
        'line-opacity': 0.7,
        'line-dasharray': [1, 1.5],
      },
    });

    // ── SCIT cells (on top of motion lines) ───────────────────────────────
    m.addSource(SCIT_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'scit-cells',
      type: 'circle',
      source: SCIT_SOURCE,
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#000000',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.85,
      },
    });
    // Severe ring overlay (TVS/meso/large hail)
    m.addLayer({
      id: 'scit-cells-severe-ring',
      type: 'circle',
      source: SCIT_SOURCE,
      filter: ['==', ['get', 'severe'], true],
      paint: {
        'circle-radius': ['+', ['get', 'radius'], 4],
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': '#ff2222',
        'circle-stroke-width': 1.5,
        'circle-opacity': 1,
      },
    });

    // ── LSR points (top) ──────────────────────────────────────────────────
    m.addSource(LSR_SOURCE, { type: 'geojson', data: EMPTY });
    m.addLayer({
      id: 'lsrs-circles',
      type: 'circle',
      source: LSR_SOURCE,
      paint: {
        'circle-radius': 5,
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#000000',
        'circle-stroke-width': 1,
        'circle-opacity': 0.9,
      },
    });

    // ── Click handlers ────────────────────────────────────────────────────
    m.on('click', 'spc-outlook-fill', (e) => {
      const f = e.features?.[0];
      if (!f?.properties) return;
      const label = (f.properties.label as string) || '';
      const label2 = (f.properties.label2 as string) || '';
      if (!label) return;
      new maplibregl.Popup({ closeButton: true, closeOnClick: true })
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="terminal-popup-title">${label} RISK</div>` +
          `<div class="terminal-popup-meta">${label2}</div>`,
        )
        .addTo(m);
    });

    m.on('click', 'alerts-warning-fill', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) { selectAlert(id); setAlertPanelOpen(true); }
    });
    m.on('click', 'alerts-watch-fill', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) { selectAlert(id); setAlertPanelOpen(true); }
    });
    m.on('click', 'lsrs-circles', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) { selectLsr(id); setLsrPanelOpen(true); }
    });
    m.on('click', 'scit-cells', (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) { selectCell(id); setScitPanelOpen(true); }
    });
    m.on('click', 'mcd-fill', (e) => {
      const num = e.features?.[0]?.properties?.num as number | undefined;
      if (num !== undefined) { selectMcd(num); setMcdPanelOpen(true); }
    });

    const interactive = [
      'spc-outlook-fill',
      'alerts-warning-fill',
      'alerts-watch-fill',
      'lsrs-circles',
      'scit-cells',
      'mcd-fill',
    ];
    interactive.forEach((id) => {
      m.on('mouseenter', id, () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', id, () => { m.getCanvas().style.cursor = ''; });
    });
  }, [mapReady]);

  // ── Sync alerts ────────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const source = m.getSource(ALERT_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature[] = alerts
      .filter((a) => a.polygon !== null)
      .map((a) => ({
        type: 'Feature',
        geometry: a.polygon as GeoJSON.Geometry,
        properties: {
          id: a.id,
          event: a.event,
          color: alertColor(a.event),
          watch: isWatch(a.event),
          tornado: isTornado(a.event),
        },
      }));

    source.setData({ type: 'FeatureCollection', features });
  }, [alerts, mapReady]);

  // ── Sync SPC outlook ──────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const source = m.getSource(SPC_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature[] = outlookFeatures.map((f) => ({
      type: 'Feature',
      geometry: f.geometry as GeoJSON.Geometry,
      properties: { label: f.label, label2: f.label2, fill: f.fill, stroke: f.stroke },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [outlookFeatures, mapReady]);

  // ── Sync MCDs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const source = m.getSource(MCD_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature[] = mcds
      .filter((mc) => mc.polygon !== null)
      .map((mc) => ({
        type: 'Feature',
        geometry: mc.polygon as GeoJSON.Geometry,
        properties: { num: mc.productNum, concerning: mc.concerning },
      }));

    source.setData({ type: 'FeatureCollection', features });
  }, [mcds, mapReady]);

  // ── Sync LSRs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const source = m.getSource(LSR_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const features: GeoJSON.Feature[] = lsrs.map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [l.lon, l.lat] },
      properties: {
        id: l.id,
        lsrType: l.type,
        color: LSR_COLORS[l.type],
        magnitude: l.magnitude,
        location: l.location,
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [lsrs, mapReady]);

  // ── Sync SCIT cells + motion vectors ──────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const cellSrc = m.getSource(SCIT_SOURCE) as maplibregl.GeoJSONSource | undefined;
    const motionSrc = m.getSource(SCIT_MOTION_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!cellSrc || !motionSrc) return;

    const cellFeatures: GeoJSON.Feature[] = cells.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
      properties: {
        id: c.id,
        color: dbzColor(c.maxDbz),
        radius: cellRadius(c.vil),
        severe: isCellSevere(c),
      },
    }));

    const motionFeatures: GeoJSON.Feature[] = cells
      .filter((c) => c.motionSpeed > 0)
      .map((c) => {
        const end = projectPosition(c.lat, c.lon, c.motionDir, c.motionSpeed, MOTION_PROJECT_MINUTES);
        return {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[c.lon, c.lat], end] },
          properties: { id: c.id, color: dbzColor(c.maxDbz) },
        };
      });

    cellSrc.setData({ type: 'FeatureCollection', features: cellFeatures });
    motionSrc.setData({ type: 'FeatureCollection', features: motionFeatures });
  }, [cells, mapReady]);

  // ── Visibility toggles ────────────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const vis = showOutlook ? 'visible' : 'none';
    ['spc-outlook-fill', 'spc-outlook-outline'].forEach((id) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showOutlook, mapReady]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const vis = showMcds ? 'visible' : 'none';
    ['mcd-fill', 'mcd-outline'].forEach((id) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showMcds, mapReady]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    if (m.getLayer('lsrs-circles'))
      m.setLayoutProperty('lsrs-circles', 'visibility', showLsrs ? 'visible' : 'none');
  }, [showLsrs, mapReady]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const vis = showCells ? 'visible' : 'none';
    ['scit-cells', 'scit-cells-severe-ring'].forEach((id) => {
      if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showCells, mapReady]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    // Motion lines hidden when cells hidden, OR when motion toggle off
    const vis = showCells && showMotion ? 'visible' : 'none';
    if (m.getLayer('scit-motion-lines'))
      m.setLayoutProperty('scit-motion-lines', 'visibility', vis);
  }, [showCells, showMotion, mapReady]);

  // ── Tornado warning flash ─────────────────────────────────────────────────
  useEffect(() => {
    const hasTornado = alerts.some((a) => isTornado(a.event) && a.polygon);
    if (!hasTornado) return;
    const id = setInterval(() => setTornadoFlash((v) => !v), 600);
    return () => clearInterval(id);
  }, [alerts]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady || !m.getLayer('alerts-tornado-outline')) return;
    m.setPaintProperty('alerts-tornado-outline', 'line-opacity', tornadoFlash ? 1 : 0.15);
  }, [tornadoFlash, mapReady]);

  // ── Rebuild radar frame layers ────────────────────────────────────────────
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    rebuildFrameLayers(m);
  }, [mapReady, loopFrames, station?.id, productCode]);

  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    frameLayerIds.current.forEach((id, i) => {
      if (m.getLayer(id)) m.setPaintProperty(id, 'raster-opacity', i === currentFrameIndex ? 0.85 : 0);
    });
  }, [currentFrameIndex, mapReady]);

  // ── Pan to station ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!station || !map.current) return;
    map.current.flyTo({ center: [station.lon, station.lat], zoom: 7, duration: 1200 });
  }, [station?.id]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function clearFrameLayers(m: maplibregl.Map) {
    frameLayerIds.current.forEach((id) => { if (m.getLayer(id)) m.removeLayer(id); });
    frameSourceIds.current.forEach((id) => { if (m.getSource(id)) m.removeSource(id); });
    frameLayerIds.current = [];
    frameSourceIds.current = [];
  }

  function rebuildFrameLayers(m: maplibregl.Map) {
    clearFrameLayers(m);
    const product = getProduct(productCode);
    const stationId = station?.id ?? 'KHGX';
    const frames = loopFrames.length > 0 ? loopFrames : [{ timestamp: null, scanAngle: 0.5 }];
    const activeIndex = loopFrames.length > 0 ? currentFrameIndex : 0;

    frames.forEach((frame, i) => {
      const time = frame.timestamp ? frame.timestamp.toISOString() : undefined;
      const sourceId = `radar-src-${i}`;
      const layerId = `radar-lyr-${i}`;
      m.addSource(sourceId, { type: 'raster', tiles: [buildWmsUrl(product, stationId, time)], tileSize: 256 });
      // Insert radar tiles below all overlay layers (under SPC outlook)
      const beforeId = m.getLayer('spc-outlook-fill') ? 'spc-outlook-fill' : undefined;
      m.addLayer(
        {
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': i === activeIndex ? 0.85 : 0, 'raster-fade-duration': 0 },
        },
        beforeId,
      );
      frameLayerIds.current.push(layerId);
      frameSourceIds.current.push(sourceId);
    });
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Layer toggles */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 pointer-events-auto" style={{ zIndex: 20 }}>
        <button
          onClick={toggleOutlook}
          className={`retro-btn text-xs px-2 py-0.5 ${showOutlook ? 'active' : ''}`}
        >
          SPC D1
        </button>
        <button
          onClick={toggleMcds}
          className={`retro-btn text-xs px-2 py-0.5 ${showMcds ? 'active' : ''}`}
        >
          MCD
        </button>
        <button
          onClick={toggleCells}
          className={`retro-btn text-xs px-2 py-0.5 ${showCells ? 'active' : ''}`}
        >
          SCIT
        </button>
        <button
          onClick={toggleMotion}
          disabled={!showCells}
          className={`retro-btn text-xs px-2 py-0.5 ${showMotion ? 'active' : ''}`}
          style={{ opacity: showCells ? 1 : 0.4 }}
        >
          MOTION
        </button>
        <button
          onClick={toggleLsrs}
          className={`retro-btn text-xs px-2 py-0.5 ${showLsrs ? 'active' : ''}`}
        >
          LSR
        </button>
      </div>

      {mapError && (
        <div className="absolute bottom-8 left-2 text-xs text-amber-dim pointer-events-none" style={{ zIndex: 20 }}>
          ⚠ {mapError}
        </div>
      )}
    </div>
  );
}
