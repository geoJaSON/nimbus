# NIMBUS

A retro CRT-terminal NEXRAD weather radar viewer for the desktop. Live radar
loops, severe weather alerts, SPC outlooks, storm-cell tracking, and local
storm reports — rendered in phosphor green (or amber, if you're that kind of
operator).

Built with Tauri 2, React 19, and MapLibre GL.

## Features

**Radar**
- Super-Resolution Base Reflectivity and Base Velocity for any WSR-88D site
- Hydrometeor Classification, Storm Total Precipitation, 1-Hour Precip
- CONUS mosaics: Base/Composite Reflectivity (QC), Enhanced Echo Tops, Precip Type
- Animated loop (5–20 frames, adjustable speed) with frame scrubbing; new
  scans appear automatically every few minutes
- Client-side dBZ noise filter — hide clear-air clutter below a chosen
  threshold (5–30 dBZ) without touching real echoes

**Severe weather**
- NWS warnings and watches (tornado, severe thunderstorm, flash flood,
  marine, extreme wind), polygon-rendered with a flashing tornado outline
- SPC Day 1 convective outlook and Mesoscale Convective Discussions
- SCIT storm-cell attributes: cell markers sized by VIL and colored by max
  dBZ, with TVS/meso/hail flags and 30-minute motion vectors
- Local Storm Reports from every WFO within radar range
- mPING crowdsourced reports (requires a free OU API key — see below)

**Quality of life**
- Settings: UI theme (green/amber/cyan/gray), font size, loop depth, noise
  filter, home location (manual or IP-detected, shown as ⌂ on the map)
- Station, product, layer toggles, and all settings persist across launches
- Nearest-radar auto-select on first launch

## Data sources

| Source | Used for |
| --- | --- |
| [NOAA NCEP GeoServer](https://opengeo.ncep.noaa.gov) | Radar tiles (WMS) — station products and CONUS mosaics |
| [NWS API](https://api.weather.gov) | Watches, warnings, advisories |
| [NOAA SPC](https://www.spc.noaa.gov) | Day 1 convective outlook, mesoscale discussions |
| [IEM, Iowa State](https://mesonet.agron.iastate.edu) | SCIT storm-cell attributes, local storm reports, MCD index |
| [OU / NSSL mPING](https://mping.ou.edu) | Crowdsourced weather reports (API key required) |

US Government weather data (NWS, NOAA, SPC, NSSL) is in the public domain.
Basemap © [CARTO](https://carto.com/basemaps/).

## Getting started

Prerequisites:
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (stable) — required by Tauri
- Windows: WebView2 runtime (preinstalled on Windows 10/11)

```sh
npm install
npm run tauri dev     # run the desktop app with hot reload
npm run tauri build   # build a release executable + installers
```

Release artifacts land in `src-tauri/target/release/` (bare executable) and
`src-tauri/target/release/bundle/` (NSIS/MSI installers).

### mPING (optional)

The mPING feed needs a free research API key from
[mping.ou.edu](https://mping.ou.edu). Copy `.env.example` to `.env`, paste
the token into `VITE_MPING_TOKEN`, and rebuild — the feed and its map toggle
enable automatically.

## Architecture notes

- **Frontend**: React 19 + Zustand stores, MapLibre GL for the map. Radar
  frames are WMS raster layers keyed by `product|station|timestamp` and
  diffed on refresh, so a loop update only fetches the newest scan.
- **Noise filter**: opengeo serves pre-colored tiles (no raw data band), so
  filtering happens client-side — a custom MapLibre tile protocol decodes
  each tile and maps pixel colors back to dBZ using the official legend ramp
  (`src/lib/reflectivityRamp.ts`, machine-generated from
  `styles/reflectivity.png`). Unrecognized colors are always kept visible.
- **Tauri shell**: Rust commands provide the bundled station list and a
  location fallback (`src-tauri/src/commands/`).
- **Sidecar** (`sidecar/main.py`): JSON-RPC scaffolding for a future NEXRAD
  Level II decode pipeline (custom color tables, all tilts, value-at-cursor).
  Not wired up or bundled yet.

## Disclaimer

Not for use as the sole source of weather information during
life-threatening situations. Always consult official NWS forecasts and your
local emergency management.
