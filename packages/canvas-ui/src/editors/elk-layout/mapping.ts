import type { ElkLayoutFields, ElkLayoutOptions } from './types';

/**
 * Map an `ElkLayoutOptions`-shaped patch to the flat {@link ElkLayoutFields}.
 * `padding` is only surfaced when it's a symmetric number (the per-side object
 * form is out of scope); `defaultNodeSize: { width, height }` is split into
 * `defaultNodeWidth` / `defaultNodeHeight`.
 */
export function optionsToForm(o: ElkLayoutOptions = {}): ElkLayoutFields {
  return {
    algorithm: o.algorithm,
    direction: o.direction,
    nodeSpacing: o.nodeSpacing,
    layerSpacing: o.layerSpacing,
    edgeNodeSpacing: o.edgeNodeSpacing,
    edgeSpacing: o.edgeSpacing,
    edgeRouting: o.edgeRouting,
    padding: typeof o.padding === 'number' ? o.padding : undefined,
    defaultNodeWidth: o.defaultNodeSize?.width,
    defaultNodeHeight: o.defaultNodeSize?.height,
    transition: o.transition,
    transitionEase: o.transitionEase,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link ElkLayoutOptions} patch. Only fields the form set are included, and
 * `defaultNodeSize` is reassembled only when a member is set — so the result is
 * safe to spread over the layout's current options.
 */
export function formToOptions(f: ElkLayoutFields): ElkLayoutOptions {
  const out: ElkLayoutOptions = {};
  if (f.algorithm !== undefined) out.algorithm = f.algorithm;
  if (f.direction !== undefined) out.direction = f.direction;
  if (f.nodeSpacing !== undefined) out.nodeSpacing = f.nodeSpacing;
  if (f.layerSpacing !== undefined) out.layerSpacing = f.layerSpacing;
  if (f.edgeNodeSpacing !== undefined) out.edgeNodeSpacing = f.edgeNodeSpacing;
  if (f.edgeSpacing !== undefined) out.edgeSpacing = f.edgeSpacing;
  if (f.edgeRouting !== undefined) out.edgeRouting = f.edgeRouting;
  if (f.padding !== undefined) out.padding = f.padding;
  if (f.transition !== undefined) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.defaultNodeWidth !== undefined || f.defaultNodeHeight !== undefined) {
    out.defaultNodeSize = {
      ...(f.defaultNodeWidth !== undefined ? { width: f.defaultNodeWidth } : {}),
      ...(f.defaultNodeHeight !== undefined ? { height: f.defaultNodeHeight } : {}),
    };
  }
  return out;
}
