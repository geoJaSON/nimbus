export interface RadarStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation_m: number;
  stationType: 'WSR-88D' | 'TDWR';
}

export interface RadarProduct {
  code: string;
  label: string;
  unit: string;
  colorTable: string;
  wmsLayer: string;
  phase: 1 | 2;
}

export interface LoopFrame {
  timestamp: Date;
  tileUrl?: string;
  filePath?: string;
  scanAngle: number;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  issued: Date;
  expires: Date;
  headline: string;
  description: string;
  instruction: string;
  wfo: string;
}

export interface LocalStormReport {
  id: string;
  type: 'TORNADO' | 'HAIL' | 'WIND' | 'FLOOD' | 'SNOW' | 'OTHER';
  lat: number;
  lon: number;
  time: Date;
  magnitude: string;
  location: string;
  remarks: string;
  source: string;
}

// SCIT storm cell from IEM nexrad_attr feed (Level III Storm Tracking Information)
export interface StormCell {
  id: string;             // storm_id from radar (e.g. "T5")
  radarId: string;        // 3-letter NEXRAD ID (no K prefix)
  lat: number;
  lon: number;
  azimuth: number;        // deg from radar
  range: number;          // nm from radar
  maxDbz: number;         // dBZ
  maxDbzHeight: number;   // kft
  top: number;            // kft
  vil: number;            // kg/m²
  posh: number;           // % probability of severe hail
  poh: number;            // % probability of hail
  maxHailSize: number;    // inches (MESH)
  tvs: string;            // 'NONE' or TVS type
  meso: string;           // 'NONE' or mesocyclone detection
  motionDir: number;      // deg compass — direction storm is moving toward
  motionSpeed: number;    // knots
  valid: Date;
}

export interface MesoscaleDiscussion {
  productNum: number;
  year: number;
  issued: Date;
  expires: Date;
  concerning: string;
  watchConfidence: number | null;  // 0-100
  mostProbTornado: string | null;
  mostProbHail: string | null;
  mostProbGust: string | null;
  spcUrl: string;
  productId: string;       // for fetching raw text
  polygon: GeoJSON.Polygon | null;
}

export type ColorTableKey = 'NWS_REF' | 'NWS_REF_HI' | 'PHOSPHOR_GREEN' | 'VELOCITY' | 'RADARSCOPE';

export interface SpcOutlookFeature {
  label: string;    // TSTM, MRGL, SLGT, ENH, MDT, HIGH
  label2: string;
  fill: string;
  stroke: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}
