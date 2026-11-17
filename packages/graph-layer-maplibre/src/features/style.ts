/**
 * Style resolution for `GeoFeaturesLayer`: a feature's `properties` (simplestyle)
 * over the layer's per-kind defaults over built-in defaults — then the
 * "unconfirmed" rule, which fades and dashes a feature that is not confirmed.
 */

import type { GeoFeatureProperties, GeoFeatureStyle } from './types';

/** What `GeoFeaturesLayer` reads from `options.unconfirmed`. */
export interface UnconfirmedRule {
  /** A feature with `confidence` below this draws unconfirmed. Default `0.5`. */
  below?: number;
  /** Stroke dash `[dash, gap]` in screen pixels. Default `[6, 4]`. */
  dash?: readonly [number, number];
  /** Multiplier on stroke and fill opacity. Default `0.6`. */
  alpha?: number;
}

/** The kinds of feature a default can be set for. */
export type StyleKind = 'polygon' | 'line' | 'point';

/** A style with every field resolved to a value. */
export interface ResolvedStyle {
  stroke: number;
  strokeWidthPx: number;
  strokeOpacity: number;
  fill: number;
  fillOpacity: number;
  dash: readonly [number, number] | undefined;
  pointRadiusPx: number;
  /** Whether the unconfirmed rule applied. */
  unconfirmed: boolean;
}

/** Built-in defaults, used where neither the feature nor the config says. */
export const BUILT_IN_STYLE: Record<StyleKind, Required<Omit<GeoFeatureStyle, 'dash'>>> = {
  polygon: { stroke: '#2563eb', strokeWidthPx: 2, strokeOpacity: 0.9, fill: '#2563eb', fillOpacity: 0.15, pointRadiusPx: 6 },
  line: { stroke: '#2563eb', strokeWidthPx: 2.5, strokeOpacity: 0.9, fill: '#2563eb', fillOpacity: 0, pointRadiusPx: 6 },
  point: { stroke: '#ffffff', strokeWidthPx: 1.5, strokeOpacity: 1, fill: '#2563eb', fillOpacity: 0.9, pointRadiusPx: 6 },
};

/** Parse `'#rrggbb'`, `'#rgb'` or a `0xRRGGBB` number; `undefined` when it is neither. */
export function parseColor(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value & 0xffffff;
  if (typeof value !== 'string') return undefined;
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(value.trim());
  if (!m) return undefined;
  const hex = m[1]!.length === 3 ? m[1]!.split('').map((c) => c + c).join('') : m[1]!;
  return parseInt(hex, 16);
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/**
 * Resolve the style of one feature. Order, highest first: the feature's
 * simplestyle `properties`, the layer's per-kind `defaults`, the built-ins.
 */
export function resolveStyle(
  kind: StyleKind,
  props: GeoFeatureProperties | null | undefined,
  defaults: GeoFeatureStyle | undefined,
  rule: UnconfirmedRule | undefined,
): ResolvedStyle {
  const b = BUILT_IN_STYLE[kind];
  const d = defaults ?? {};
  const p = props ?? {};

  let strokeOpacity = num(p['stroke-opacity']) ?? d.strokeOpacity ?? b.strokeOpacity;
  let fillOpacity = num(p['fill-opacity']) ?? d.fillOpacity ?? b.fillOpacity;

  const below = rule?.below ?? 0.5;
  const unconfirmed = p.confirmed === false || (typeof p.confidence === 'number' && p.confidence < below);
  let dash = d.dash;
  if (unconfirmed) {
    const k = rule?.alpha ?? 0.6;
    strokeOpacity *= k;
    fillOpacity *= k;
    dash = rule?.dash ?? [6, 4];
  }

  return {
    stroke: parseColor(p.stroke) ?? parseColor(d.stroke) ?? parseColor(b.stroke)!,
    strokeWidthPx: num(p['stroke-width']) ?? d.strokeWidthPx ?? b.strokeWidthPx,
    strokeOpacity,
    fill: parseColor(p.fill) ?? parseColor(d.fill) ?? parseColor(b.fill)!,
    fillOpacity,
    dash,
    pointRadiusPx: d.pointRadiusPx ?? b.pointRadiusPx,
    unconfirmed,
  };
}
