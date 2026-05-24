// Compute lon/lat bounds for a GeoJSON Polygon or MultiPolygon.
// Returns [[west, south], [east, north]] or null if the geometry is empty.
export function polygonBounds(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): [[number, number], [number, number]] | null {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  const visit = (ring: GeoJSON.Position[]) => {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  };

  if (geom.type === 'Polygon') {
    geom.coordinates.forEach(visit);
  } else {
    geom.coordinates.forEach((poly) => poly.forEach(visit));
  }

  if (!isFinite(minLon)) return null;
  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}
