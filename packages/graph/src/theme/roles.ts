/**
 * Default **role → style** mappings the {@link GraphLayer} applies when a theme
 * is published. This is the *base* recolour that keeps the whole graph in sync
 * with the active palette even before any per-type styling template is set
 * (Phase B layers role-based per-type styling on top of this).
 *
 * Every mapping reads from a string-keyed palette (the engine's
 * `ResolvedTheme.palette`) and emits **only the fields whose role is present**,
 * so the single-layer `{ light, dark }` shorthand — which publishes an empty
 * palette — produces empty patches and changes nothing.
 */

import type { EdgeStyle, NodeStyle } from '../layer/types';

/** A resolved role → number palette (string keys; roles may be absent). */
export type RolePalette = Readonly<Record<string, number>>;

/** Whether a patch has at least one field — lets callers skip no-op applies. */
export function hasAny(patch: object): boolean {
  return Object.keys(patch).length > 0;
}

/**
 * Base node template recolour: label text follows `foreground`; the node's
 * cut-out border ring follows `surface` so nodes read cleanly against the
 * backdrop (mirrors the old `THEME_LIGHT/DARK` node patch).
 */
export function paletteToNodeDefaults(p: RolePalette): Partial<NodeStyle> {
  const out: Record<string, number> = {};
  if (p.foreground !== undefined) out.labelColor = p.foreground;
  if (p.surface !== undefined) out.bgStrokeColor = p.surface;
  return out as Partial<NodeStyle>;
}

/**
 * Base edge template recolour: stroke + arrowheads follow `muted`; edge labels
 * follow `foreground`.
 */
export function paletteToEdgeDefaults(p: RolePalette): Partial<EdgeStyle> {
  const out: Record<string, number> = {};
  if (p.muted !== undefined) {
    out.strokeColor = p.muted;
    out.arrowTargetColor = p.muted;
    out.arrowSourceColor = p.muted;
  }
  if (p.foreground !== undefined) out.labelColor = p.foreground;
  return out as Partial<EdgeStyle>;
}

/**
 * Per-group-node frame recolour: body fill follows `cardBg`, frame border
 * follows `divider`. Written per-instance (the engine has no group template),
 * layered over each group node's current style.
 */
export function paletteToGroupStyle(p: RolePalette): Partial<NodeStyle> {
  const out: Record<string, number> = {};
  if (p.cardBg !== undefined) out.bgFill = p.cardBg;
  if (p.divider !== undefined) out.bgStrokeColor = p.divider;
  return out as Partial<NodeStyle>;
}
