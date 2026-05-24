[] Set refresh on map for radar images
[] Other radar derivatives don't automatically display when selecting them, you have to adjust the time slider back and forth then they appear.
[] Add settings ->font size, coloring, home marker location?
[] Set to version 1.0
[] Add about, show credits (NWS, OU, etc)
[] 404 Errors in console pulling from SPC plus 
Network location provider at 'https://www.googleapis.com/' : Returned error code 403.
useLsrFetch.ts:27  GET https://api.weather.gov/products?type=LSR&office=HGX&limit=10 400 (Bad Request)

## v1.1
[] mPING — re-enable once OU API key is granted. Add token to .env, send `Authorization: Token …` header in src/lib/mpingData.ts. Uncomment useMpingData() in src/App.tsx and the MPING toggle button in src/components/RadarMap/RadarMap.tsx. Data layer/store/map source already wired.
