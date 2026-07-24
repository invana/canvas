import type { MapLayerFields, MapLayerOptions } from './types';

/**
 * Map a `MapLayerOptions`-shaped patch to the flat {@link MapLayerFields}. The
 * engine's `center: [lng, lat]` tuple is split into `centerLng` / `centerLat`
 * scalars; `styleUrl` passes through (a non-string StyleSpecification object is
 * out of scope — mirror it in the options type as `string` only).
 */
export function optionsToForm(o: MapLayerOptions = {}): MapLayerFields {
  return {
    styleUrl: o.styleUrl,
    centerLng: o.center?.[0],
    centerLat: o.center?.[1],
    zoom: o.zoom,
    minZoom: o.minZoom,
    maxZoom: o.maxZoom,
    passInputToMap: o.passInputToMap,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link MapLayerOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the layer's current
 * options on `setOptions`. `center` is reassembled into a `[lng, lat]` tuple
 * only when both `centerLng` and `centerLat` are set.
 */
export function formToOptions(f: MapLayerFields): MapLayerOptions {
  const out: MapLayerOptions = {};
  if (f.styleUrl) out.styleUrl = f.styleUrl;
  if (f.centerLng !== undefined && f.centerLat !== undefined) {
    out.center = [f.centerLng, f.centerLat];
  }
  if (f.zoom !== undefined) out.zoom = f.zoom;
  if (f.minZoom !== undefined) out.minZoom = f.minZoom;
  if (f.maxZoom !== undefined) out.maxZoom = f.maxZoom;
  if (f.passInputToMap !== undefined) out.passInputToMap = f.passInputToMap;
  return out;
}
