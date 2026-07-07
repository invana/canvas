import type { D3HierarchyLayoutFields, D3HierarchyLayoutOptions } from './types';

/**
 * Map a `D3HierarchyLayoutOptions`-shaped patch to the flat
 * {@link D3HierarchyLayoutFields}. The `size` / `nodeSize` tuples are split into
 * their scalar components and `center: { x, y }` into `centerX` / `centerY`.
 */
export function optionsToForm(o: D3HierarchyLayoutOptions = {}): D3HierarchyLayoutFields {
  return {
    mode: o.mode,
    rootId: o.rootId,
    sizeWidth: o.size?.[0],
    sizeHeight: o.size?.[1],
    nodeSizeX: o.nodeSize?.[0],
    nodeSizeY: o.nodeSize?.[1],
    radius: o.radius,
    orientation: o.orientation,
    centerX: o.center?.x,
    centerY: o.center?.y,
    padding: o.padding,
    transition: o.transition,
    transitionEase: o.transitionEase,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link D3HierarchyLayoutOptions} patch. Only fields the form set are included.
 * `size` / `nodeSize` are re-fused into tuples only when **both** components are
 * set (a tuple needs both), and `center` when at least one of x/y is set — so
 * the result is safe to spread over the layout's current options.
 */
export function formToOptions(f: D3HierarchyLayoutFields): D3HierarchyLayoutOptions {
  const out: D3HierarchyLayoutOptions = {};
  if (f.mode !== undefined) out.mode = f.mode;
  if (f.rootId) out.rootId = f.rootId;
  if (f.radius !== undefined) out.radius = f.radius;
  if (f.orientation !== undefined) out.orientation = f.orientation;
  if (f.padding !== undefined) out.padding = f.padding;
  if (f.transition !== undefined) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.sizeWidth !== undefined && f.sizeHeight !== undefined) {
    out.size = [f.sizeWidth, f.sizeHeight];
  }
  if (f.nodeSizeX !== undefined && f.nodeSizeY !== undefined) {
    out.nodeSize = [f.nodeSizeX, f.nodeSizeY];
  }
  if (f.centerX !== undefined || f.centerY !== undefined) {
    out.center = {
      ...(f.centerX !== undefined ? { x: f.centerX } : {}),
      ...(f.centerY !== undefined ? { y: f.centerY } : {}),
    };
  }
  return out;
}
