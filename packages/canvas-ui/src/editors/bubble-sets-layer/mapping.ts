import { hexToNumber, numberToHex } from '../../shared/color';
import type {
  BubbleSetsLayerFields,
  BubbleSetsLayerOptions,
  BubbleSetStyle,
} from './types';

/**
 * Map a `BubbleSetsLayerOptions`-shaped patch to the flat
 * {@link BubbleSetsLayerFields}. The nested {@link BubbleSetStyle} group is
 * flattened to `style`-prefixed scalars, with colour `0xRRGGBB` numbers
 * normalised to `#rrggbb` strings.
 */
export function optionsToForm(o: BubbleSetsLayerOptions = {}): BubbleSetsLayerFields {
  const s: BubbleSetStyle = o.style ?? {};
  return {
    pixelGroup: o.pixelGroup,
    nodeR0: o.nodeR0,
    nodeR1: o.nodeR1,
    edgeR0: o.edgeR0,
    edgeR1: o.edgeR1,
    morphBuffer: o.morphBuffer,
    maxRoutingIterations: o.maxRoutingIterations,
    maxMarchingIterations: o.maxMarchingIterations,
    smoothness: o.smoothness,
    chaikinIterations: o.chaikinIterations,
    styleFill: typeof s.fill === 'number' ? numberToHex(s.fill) : undefined,
    styleFillOpacity: s.fillOpacity,
    styleStroke: typeof s.stroke === 'number' ? numberToHex(s.stroke) : undefined,
    styleStrokeOpacity: s.strokeOpacity,
    styleStrokeWidth: s.strokeWidth,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link BubbleSetsLayerOptions} patch. Only fields the form set are included
 * (no `undefined` keys), so the result is safe to spread over the layer's
 * current options. The `style` group is reassembled (with `#rrggbb → 0xRRGGBB`
 * colours) only when at least one style field is set.
 */
export function formToOptions(f: BubbleSetsLayerFields): BubbleSetsLayerOptions {
  const out: BubbleSetsLayerOptions = {};
  if (f.pixelGroup !== undefined) out.pixelGroup = f.pixelGroup;
  if (f.nodeR0 !== undefined) out.nodeR0 = f.nodeR0;
  if (f.nodeR1 !== undefined) out.nodeR1 = f.nodeR1;
  if (f.edgeR0 !== undefined) out.edgeR0 = f.edgeR0;
  if (f.edgeR1 !== undefined) out.edgeR1 = f.edgeR1;
  if (f.morphBuffer !== undefined) out.morphBuffer = f.morphBuffer;
  if (f.maxRoutingIterations !== undefined) out.maxRoutingIterations = f.maxRoutingIterations;
  if (f.maxMarchingIterations !== undefined) out.maxMarchingIterations = f.maxMarchingIterations;
  if (f.smoothness !== undefined) out.smoothness = f.smoothness;
  if (f.chaikinIterations !== undefined) out.chaikinIterations = f.chaikinIterations;
  if (f.recompute !== undefined) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== undefined) out.recomputeDebounceMs = f.recomputeDebounceMs;

  const style: BubbleSetStyle = {};
  if (f.styleFill) style.fill = hexToNumber(f.styleFill);
  if (f.styleFillOpacity !== undefined) style.fillOpacity = f.styleFillOpacity;
  if (f.styleStroke) style.stroke = hexToNumber(f.styleStroke);
  if (f.styleStrokeOpacity !== undefined) style.strokeOpacity = f.styleStrokeOpacity;
  if (f.styleStrokeWidth !== undefined) style.strokeWidth = f.styleStrokeWidth;
  if (Object.keys(style).length > 0) out.style = style;

  return out;
}
