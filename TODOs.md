[x] Set refresh on map for radar images — useRadarLoop refetches scan timestamps every 3 min; RadarMap diffs keyed frame layers so only the new scan's tiles are fetched.
[x] Other radar derivatives don't automatically display when selecting them — fixed: useRadarLoop clears frames on product/station switch (latest no-TIME frame shows instantly) and RadarMap diffs keyed frame layers instead of full rebuilds.
[x] Add settings — Settings modal ([CFG] in titlebar): theme (GREEN/AMBER/CYAN/GRAY via CSS variables), font size (S/M/L/XL), loop depth (5–20), home location (manual lat/lon or IP detect, shown as ⌂ on map). All persisted.
[x] Set to version 1.0 — package.json, tauri.conf.json, Cargo.toml all at 1.0.0.
[x] Add about, show credits (NWS, OU, etc) — AboutModal wired to [?]; credits updated for IEM LSRs/MCDs.
[x] 404 Errors in console pulling from SPC — fixed: fetch the stable "latest" outlook URL (day1otlk_cat.lyr.geojson) instead of guessing archive issuance timestamps.
[x] Google network location 403 — fixed: navigator.geolocation (which needs a Google API key in WebView2) replaced with IP-based lookup (ipapi.co → ipwho.is fallback); only runs on first launch since station/home persist.
[x] LSR 400 Bad Request — fixed: switched to IEM LSR GeoJSON (radar IDs ≠ WFO IDs; old per-WFO product fetch also missed neighboring offices' reports). Text parser removed.

## v1.1
[] mPING — plumbing done: hook, store, map layer, and MPING toggle are live but gated on VITE_MPING_TOKEN (see .env.example). Once the OU API key is granted, copy .env.example to .env, paste the token, rebuild — no code changes needed.
