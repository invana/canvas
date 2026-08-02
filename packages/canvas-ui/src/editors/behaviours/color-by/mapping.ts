import { hexToNumber, numberToHex } from '../../../shared/color';

import type { ColorByFields, ColorByOptions } from './types';

/** Parse a comma-separated edge list to sorted, de-duplicated finite numbers. */
function parseThresholds(text: string): number[] {
  const parsed = text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return [...new Set(parsed)].sort((a, b) => a - b);
}

/**
 * Map a `ColorByBehaviourOptions`-shaped patch to the flat {@link ColorByFields}
 * the `@invana/forms` generator renders.
 *
 * Three encodings happen here (see {@link ColorByFields}): the `0xRRGGBB`
 * `fallbackColor` becomes `#rrggbb`, each `[min, max]` domain splits into two
 * number fields, and each threshold array becomes comma-separated text.
 */
export function optionsToForm(o: ColorByOptions = {}): ColorByFields {
  return {
    mode: o.mode,
    nodeValueKey: o.nodeValueKey,
    edgeValueKey: o.edgeValueKey,
    colorNodes: o.colorNodes,
    colorEdges: o.colorEdges,
    fallbackColor: o.fallbackColor !== undefined ? numberToHex(o.fallbackColor) : undefined,
    maxCategories: o.maxCategories,
    scale: o.scale,
    nodeDomainMin: o.nodeDomain?.[0],
    nodeDomainMax: o.nodeDomain?.[1],
    edgeDomainMin: o.edgeDomain?.[0],
    edgeDomainMax: o.edgeDomain?.[1],
    bins: o.bins,
    nodeThresholds: o.nodeThresholds?.join(', '),
    edgeThresholds: o.edgeThresholds?.join(', '),
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ColorByOptions} patch. Only fields the form actually set are included,
 * so the result is safe to spread on `setOptions`.
 *
 * A domain is emitted **only when both bounds are present** — a half-filled
 * domain is a mid-edit state, not an instruction, and emitting it would pin one
 * end of the scale to `undefined`. Both blank therefore means auto-scan, which
 * is what the field description promises.
 */
export function formToOptions(f: ColorByFields): ColorByOptions {
  const out: ColorByOptions = {};
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.nodeValueKey !== undefined && f.nodeValueKey !== '') out.nodeValueKey = f.nodeValueKey;
  if (f.edgeValueKey !== undefined && f.edgeValueKey !== '') out.edgeValueKey = f.edgeValueKey;
  if (f.colorNodes !== undefined) out.colorNodes = f.colorNodes;
  if (f.colorEdges !== undefined) out.colorEdges = f.colorEdges;
  if (f.fallbackColor !== undefined) out.fallbackColor = hexToNumber(f.fallbackColor);
  if (f.maxCategories !== undefined) out.maxCategories = f.maxCategories;
  if (f.scale !== undefined) out.scale = f.scale;
  if (f.nodeDomainMin !== undefined && f.nodeDomainMax !== undefined) {
    out.nodeDomain = [f.nodeDomainMin, f.nodeDomainMax];
  }
  if (f.edgeDomainMin !== undefined && f.edgeDomainMax !== undefined) {
    out.edgeDomain = [f.edgeDomainMin, f.edgeDomainMax];
  }
  if (f.bins !== undefined) out.bins = f.bins;
  if (f.nodeThresholds) out.nodeThresholds = parseThresholds(f.nodeThresholds);
  if (f.edgeThresholds) out.edgeThresholds = parseThresholds(f.edgeThresholds);
  return out;
}
