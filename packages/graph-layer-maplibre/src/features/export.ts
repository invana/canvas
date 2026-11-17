/**
 * Saving drawn features: a GeoJSON file the analyst can attach to a brief.
 * Browser only — it creates a `Blob` and clicks a temporary link.
 */

import type { GeoFeatureCollection } from './types';

/**
 * Download a feature collection as a `.geojson` file. Returns the file name used.
 * `name` gets `.geojson` appended when it does not end in `.geojson` or `.json`.
 */
export function downloadGeoJSON(collection: GeoFeatureCollection, name = 'features'): string {
  const file = /\.(geo)?json$/i.test(name) ? name : `${name}.geojson`;
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // The click has started the download; the URL can go.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return file;
}
