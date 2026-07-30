import { hexToNumber, numberToHex } from '../../../shared/color';
import type { GraphLegendLayerFields, GraphLegendLayerOptions } from './types';

/**
 * Resolve a `GraphLegendColor` seed to the CSS string the field shows. Scalars pass
 * through; a `{ light, dark }` pair is out of scope for the scalar field and
 * round-trips as `undefined` so the editor leaves it untouched.
 */
function colorToField(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

/**
 * Resolve a `title` / section-title seed to the string the text field shows. The
 * engine also accepts `false` for "no heading", which the field renders as an
 * empty string (equally falsy on the way back in).
 */
function titleToField(v: string | false | undefined): string | undefined {
  if (v === false) return '';
  return v;
}

/**
 * Map a `GraphLegendLayerOptions`-shaped patch to the flat {@link GraphLegendLayerFields}
 * the `@invana/forms` generator renders. The engine's `margin: number | { x, y }`
 * union is split into `marginX` / `marginY`; chrome colours are CSS strings on
 * the engine (the overlay is DOM) so they pass through unchanged; only
 * `fallbackColor` — a graph-swatch colour, `0xRRGGBB` on the engine — converts
 * to `#rrggbb`.
 */
export function optionsToForm(o: GraphLegendLayerOptions = {}): GraphLegendLayerFields {
  const marginX = typeof o.margin === 'number' ? o.margin : o.margin?.x;
  const marginY = typeof o.margin === 'number' ? o.margin : o.margin?.y;
  return {
    title: titleToField(o.title),
    showNodes: o.showNodes,
    showEdges: o.showEdges,
    nodesTitle: titleToField(o.nodesTitle),
    edgesTitle: titleToField(o.edgesTitle),
    showCounts: o.showCounts,
    countMode: o.countMode,
    sort: o.sort,
    maxRows: o.maxRows,
    hideEmpty: o.hideEmpty,
    fallbackColor: o.fallbackColor === undefined ? undefined : numberToHex(o.fallbackColor),
    toggleOnClick: o.toggleOnClick,
    hiddenTypeOpacity: o.hiddenTypeOpacity,
    position: o.position,
    marginX,
    marginY,
    fontSize: o.fontSize,
    opacity: o.opacity,
    swatchSize: o.swatchSize,
    backgroundColor: colorToField(o.backgroundColor),
    textColor: colorToField(o.textColor),
    mutedColor: colorToField(o.mutedColor),
    borderColor: colorToField(o.borderColor),
    borderRadius: o.borderRadius,
    mode: o.mode,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link GraphLegendLayerOptions} patch. Only fields the form actually set are
 * included (no `undefined` keys), so the result is safe to spread over the
 * layer's current options on `setOptions`. `margin` is re-fused from `marginX` /
 * `marginY` — a plain number when both agree, otherwise a `{ x, y }` object.
 *
 * The three title fields are the one place an **empty string is meaningful**
 * (it's how the form says "no heading", which the engine reads as falsy), so
 * they are emitted even when blank.
 */
export function formToOptions(f: GraphLegendLayerFields): GraphLegendLayerOptions {
  const out: GraphLegendLayerOptions = {};
  if (f.title !== undefined) out.title = f.title;
  if (f.showNodes !== undefined) out.showNodes = f.showNodes;
  if (f.showEdges !== undefined) out.showEdges = f.showEdges;
  if (f.nodesTitle !== undefined) out.nodesTitle = f.nodesTitle;
  if (f.edgesTitle !== undefined) out.edgesTitle = f.edgesTitle;
  if (f.showCounts !== undefined) out.showCounts = f.showCounts;
  if (f.countMode !== undefined) out.countMode = f.countMode;
  if (f.sort !== undefined) out.sort = f.sort;
  if (f.maxRows !== undefined) out.maxRows = f.maxRows;
  if (f.hideEmpty !== undefined) out.hideEmpty = f.hideEmpty;
  if (f.fallbackColor) out.fallbackColor = hexToNumber(f.fallbackColor);
  if (f.toggleOnClick !== undefined) out.toggleOnClick = f.toggleOnClick;
  if (f.hiddenTypeOpacity !== undefined) out.hiddenTypeOpacity = f.hiddenTypeOpacity;
  if (f.position !== undefined) out.position = f.position;
  if (f.marginX !== undefined || f.marginY !== undefined) {
    out.margin =
      f.marginX === f.marginY && f.marginX !== undefined
        ? f.marginX
        : { x: f.marginX, y: f.marginY };
  }
  if (f.fontSize !== undefined) out.fontSize = f.fontSize;
  if (f.opacity !== undefined) out.opacity = f.opacity;
  if (f.swatchSize !== undefined) out.swatchSize = f.swatchSize;
  if (f.backgroundColor) out.backgroundColor = f.backgroundColor;
  if (f.textColor) out.textColor = f.textColor;
  if (f.mutedColor) out.mutedColor = f.mutedColor;
  if (f.borderColor) out.borderColor = f.borderColor;
  if (f.borderRadius !== undefined) out.borderRadius = f.borderRadius;
  if (f.mode !== undefined) out.mode = f.mode;
  return out;
}
