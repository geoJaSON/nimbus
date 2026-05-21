export interface RadarProductDef {
  code: string;
  label: string;
  shortLabel: string;
  unit: string;
  colorTable: string;
  scope: 'station' | 'conus';
  // station products: layer = {station_lower}_{layerSuffix}
  // conus products:   layer = {layerName}
  layerSuffix: string;
  phase: 1 | 2;
}

// Station-specific products (per-radar, higher resolution)
// Layer names: {station_lower}_{layerSuffix}
// Endpoint: https://opengeo.ncep.noaa.gov/geoserver/{station_lower}/ows
const STATION_PRODUCTS: RadarProductDef[] = [
  {
    code: 'sr_bref',
    label: 'Super-Res Base Reflectivity',
    shortLabel: 'REF',
    unit: 'dBZ',
    colorTable: 'NWS_REF',
    scope: 'station',
    layerSuffix: 'sr_bref',
    phase: 1,
  },
  {
    code: 'sr_bvel',
    label: 'Base Velocity',
    shortLabel: 'VEL',
    unit: 'kt',
    colorTable: 'VELOCITY',
    scope: 'station',
    layerSuffix: 'sr_bvel',
    phase: 1,
  },
  {
    code: 'bdhc',
    label: 'Hydrometeor Classification',
    shortLabel: 'HCA',
    unit: 'category',
    colorTable: 'NWS_REF',
    scope: 'station',
    layerSuffix: 'bdhc',
    phase: 1,
  },
  {
    code: 'bdsa',
    label: 'Storm Total Precipitation',
    shortLabel: 'STP',
    unit: 'in',
    colorTable: 'NWS_REF',
    scope: 'station',
    layerSuffix: 'bdsa',
    phase: 1,
  },
  {
    code: 'boha',
    label: '1-Hr Precip. Accumulation',
    shortLabel: '1HR',
    unit: 'in',
    colorTable: 'NWS_REF',
    scope: 'station',
    layerSuffix: 'boha',
    phase: 1,
  },
];

// CONUS-wide mosaic products (multi-radar, 1km resolution)
// Layer names: {layerSuffix}
// Endpoint: https://opengeo.ncep.noaa.gov/geoserver/conus/ows
const CONUS_PRODUCTS: RadarProductDef[] = [
  {
    code: 'bref_qcd',
    label: 'CONUS Base Reflectivity (QC)',
    shortLabel: 'CONUS REF',
    unit: 'dBZ',
    colorTable: 'NWS_REF',
    scope: 'conus',
    layerSuffix: 'conus_bref_qcd',
    phase: 1,
  },
  {
    code: 'cref_qcd',
    label: 'CONUS Composite Reflectivity (QC)',
    shortLabel: 'CONUS CREF',
    unit: 'dBZ',
    colorTable: 'NWS_REF',
    scope: 'conus',
    layerSuffix: 'conus_cref_qcd',
    phase: 1,
  },
  {
    code: 'neet',
    label: 'Enhanced Echo Tops',
    shortLabel: 'EET',
    unit: 'kft',
    colorTable: 'NWS_REF',
    scope: 'conus',
    layerSuffix: 'conus_neet_v18',
    phase: 1,
  },
  {
    code: 'pcpn_typ',
    label: 'Precipitation Type',
    shortLabel: 'PTYP',
    unit: 'category',
    colorTable: 'NWS_REF',
    scope: 'conus',
    layerSuffix: 'conus_pcpn_typ',
    phase: 1,
  },
];

export const RADAR_PRODUCTS: RadarProductDef[] = [...STATION_PRODUCTS, ...CONUS_PRODUCTS];

export const DEFAULT_PRODUCT = STATION_PRODUCTS[0];

export function getProduct(code: string): RadarProductDef {
  return RADAR_PRODUCTS.find((p) => p.code === code) ?? DEFAULT_PRODUCT;
}

const WMS_BASE = 'https://opengeo.ncep.noaa.gov/geoserver';

export function buildWmsUrl(product: RadarProductDef, stationId: string, time?: string): string {
  const stationLower = stationId.toLowerCase();

  const [workspace, layerName] =
    product.scope === 'station'
      ? [`${stationLower}`, `${stationLower}_${product.layerSuffix}`]
      : ['conus', product.layerSuffix];

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.3.0',
    REQUEST: 'GetMap',
    LAYERS: layerName,
    CRS: 'EPSG:3857',
    WIDTH: '256',
    HEIGHT: '256',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
  });

  if (time) params.set('TIME', time);

  // BBOX token must NOT be URL-encoded — MapLibre replaces it at request time
  return `${WMS_BASE}/${workspace}/ows?${params.toString()}&BBOX={bbox-epsg-3857}`;
}
