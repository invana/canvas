import type { D3SankeyLayoutFields, D3SankeyLayoutOptions } from './types';

/**
 * Map a `D3SankeyLayoutOptions`-shaped patch to the flat
 * {@link D3SankeyLayoutFields}. The `size` tuple is split into `sizeWidth` /
 * `sizeHeight` and `center: { x, y }` into `centerX` / `centerY`.
 */
export function optionsToForm(o: D3SankeyLayoutOptions = {}): D3SankeyLayoutFields {
  return {
    sizeWidth: o.size?.[0],
    sizeHeight: o.size?.[1],
    nodeWidth: o.nodeWidth,
    nodePadding: o.nodePadding,
    iterations: o.iterations,
    nodeAlign: o.nodeAlign,
    centerX: o.center?.x,
    centerY: o.center?.y,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3SankeyLayoutOptions} patch. Only fields the form set are included.
 * `size` is re-fused into a tuple only when **both** components are set (a tuple
 * needs both), and `center` when at least one of x/y is set — so the result is
 * safe to spread over the layout's current options.
 */
export function formToOptions(f: D3SankeyLayoutFields): D3SankeyLayoutOptions {
  const out: D3SankeyLayoutOptions = {};
  if (f.nodeWidth !== undefined) out.nodeWidth = f.nodeWidth;
  if (f.nodePadding !== undefined) out.nodePadding = f.nodePadding;
  if (f.iterations !== undefined) out.iterations = f.iterations;
  if (f.nodeAlign !== undefined) out.nodeAlign = f.nodeAlign;
  if (f.sizeWidth !== undefined && f.sizeHeight !== undefined) {
    out.size = [f.sizeWidth, f.sizeHeight];
  }
  if (f.centerX !== undefined || f.centerY !== undefined) {
    out.center = {
      ...(f.centerX !== undefined ? { x: f.centerX } : {}),
      ...(f.centerY !== undefined ? { y: f.centerY } : {}),
    };
  }
  return out;
}
