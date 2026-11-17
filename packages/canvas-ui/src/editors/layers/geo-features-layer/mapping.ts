import { hexToNumber, numberToHex } from '../../../shared/color';
import type { GeoFeatureKindStyle, GeoFeaturesLayerFields, GeoFeaturesLayerOptions } from './types';

const toHex = (c: string | number | undefined): string | undefined => (typeof c === 'number' ? numberToHex(c) : c);
const fromHex = (c: string | undefined): number | undefined => (c ? hexToNumber(c) : undefined);

/** Map a `GeoFeaturesLayerOptions`-shaped patch to the flat form fields. */
export function optionsToForm(o: GeoFeaturesLayerOptions = {}): GeoFeaturesLayerFields {
  const poly: GeoFeatureKindStyle = o.defaults?.polygon ?? {};
  const line: GeoFeatureKindStyle = o.defaults?.line ?? {};
  const point: GeoFeatureKindStyle = o.defaults?.point ?? {};
  return {
    polygonStroke: toHex(poly.stroke),
    polygonStrokeWidthPx: poly.strokeWidthPx,
    polygonStrokeOpacity: poly.strokeOpacity,
    polygonFill: toHex(poly.fill),
    polygonFillOpacity: poly.fillOpacity,
    lineStroke: toHex(line.stroke),
    lineStrokeWidthPx: line.strokeWidthPx,
    lineStrokeOpacity: line.strokeOpacity,
    pointStroke: toHex(point.stroke),
    pointStrokeWidthPx: point.strokeWidthPx,
    pointFill: toHex(point.fill),
    pointFillOpacity: point.fillOpacity,
    pointRadiusPx: point.pointRadiusPx,
    labelKey: o.labelKey,
    labelFontPx: o.labelFontPx,
    labelColor: toHex(o.labelColor),
    labelBackground: o.labelBackground,
    labelMinZoom: o.labelMinZoom,
    labelMaxZoom: o.labelMaxZoom,
    unconfirmedBelow: o.unconfirmed?.below,
    unconfirmedAlpha: o.unconfirmed?.alpha,
    uncertaintyFillOpacity: o.uncertaintyFillOpacity,
    hitTolerancePx: o.hitTolerancePx,
    republishDebounceMs: o.republishDebounceMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: only fields the form set are included (no
 * `undefined` keys), and a kind's style group is rebuilt only when one of its
 * fields is set.
 */
export function formToOptions(f: GeoFeaturesLayerFields): GeoFeaturesLayerOptions {
  const out: GeoFeaturesLayerOptions = {};
  const kind = (s: GeoFeatureKindStyle): GeoFeatureKindStyle | undefined => {
    const clean = Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) as GeoFeatureKindStyle;
    return Object.keys(clean).length > 0 ? clean : undefined;
  };
  const polygon = kind({
    stroke: fromHex(f.polygonStroke),
    strokeWidthPx: f.polygonStrokeWidthPx,
    strokeOpacity: f.polygonStrokeOpacity,
    fill: fromHex(f.polygonFill),
    fillOpacity: f.polygonFillOpacity,
  });
  const line = kind({ stroke: fromHex(f.lineStroke), strokeWidthPx: f.lineStrokeWidthPx, strokeOpacity: f.lineStrokeOpacity });
  const point = kind({
    stroke: fromHex(f.pointStroke),
    strokeWidthPx: f.pointStrokeWidthPx,
    fill: fromHex(f.pointFill),
    fillOpacity: f.pointFillOpacity,
    pointRadiusPx: f.pointRadiusPx,
  });
  if (polygon || line || point) out.defaults = { ...(polygon ? { polygon } : {}), ...(line ? { line } : {}), ...(point ? { point } : {}) };

  if (f.labelKey) out.labelKey = f.labelKey;
  if (f.labelFontPx !== undefined) out.labelFontPx = f.labelFontPx;
  if (f.labelColor) out.labelColor = hexToNumber(f.labelColor);
  if (f.labelBackground !== undefined) out.labelBackground = f.labelBackground;
  if (f.labelMinZoom !== undefined) out.labelMinZoom = f.labelMinZoom;
  if (f.labelMaxZoom !== undefined) out.labelMaxZoom = f.labelMaxZoom;
  if (f.unconfirmedBelow !== undefined || f.unconfirmedAlpha !== undefined) {
    out.unconfirmed = {
      ...(f.unconfirmedBelow !== undefined ? { below: f.unconfirmedBelow } : {}),
      ...(f.unconfirmedAlpha !== undefined ? { alpha: f.unconfirmedAlpha } : {}),
    };
  }
  if (f.uncertaintyFillOpacity !== undefined) out.uncertaintyFillOpacity = f.uncertaintyFillOpacity;
  if (f.hitTolerancePx !== undefined) out.hitTolerancePx = f.hitTolerancePx;
  if (f.republishDebounceMs !== undefined) out.republishDebounceMs = f.republishDebounceMs;
  return out;
}
