/**
 * Icon-layer mount / update / destroy for shapes whose `spec.fill.kind ===
 * 'icon'`. The glyph (a Pixi `Text` for `IconRef.kind === 'glyph'`, a Pixi
 * `Graphics` traced from SVG path-d for `IconRef.kind === 'svg'`) lives in a
 * sibling Container parented to the shape's `gfx`, sized as a fraction of
 * the shape's bounds and centered on the bounds' midpoint.
 *
 * `IconRef.kind === 'ref'` is resolved via the optional `IconRegistry` —
 * mirrors the CSS pattern of declaring a font-pack ("class") + named glyph
 * once, then referring to it by short name from many shapes.
 *
 * Decorations operate on the silhouette only (via `paintInto`) — they never
 * see the icon layer.
 */

import { Container, Graphics, GraphicsPath, Text, type TextStyleOptions } from 'pixi.js';
import type { IconRegistry } from '../../icons/IconRegistry';
import type { IconRef, Rect, ShapeFill } from '../types';

type IconFill = Extract<ShapeFill, { kind: 'icon' }>;

export interface IconView {
  readonly gfx: Container;
  child: Text | Graphics;
  refKey: string;
}

export function mountIcon(
  parent: Container,
  fill: IconFill,
  bounds: Rect,
  registry?: IconRegistry,
): IconView {
  const gfx = new Container();
  gfx.label = 'icon';
  gfx.zIndex = 10;
  const resolved = resolveRef(fill.icon, registry);
  const child = renderChild(resolved, fill);
  gfx.addChild(child);
  parent.addChild(gfx);
  positionAndScale(gfx, child, fill, bounds);
  return { gfx, child, refKey: refKey(resolved) };
}

export function updateIcon(
  view: IconView,
  fill: IconFill,
  bounds: Rect,
  registry?: IconRegistry,
): void {
  const resolved = resolveRef(fill.icon, registry);
  const key = refKey(resolved);
  if (key !== view.refKey) {
    view.child.destroy();
    const fresh = renderChild(resolved, fill);
    view.gfx.removeChildren();
    view.gfx.addChild(fresh);
    view.child = fresh;
    view.refKey = key;
  }
  positionAndScale(view.gfx, view.child, fill, bounds);
}

export function destroyIcon(view: IconView): void {
  view.gfx.destroy({ children: true });
}

// ─── Internals ─────────────────────────────────────────────────────────────

/** Resolve a `ref` IconRef through the registry; passthrough for concrete refs. */
function resolveRef(ref: IconRef, registry?: IconRegistry): Exclude<IconRef, { kind: 'ref' }> {
  if (ref.kind !== 'ref') return ref;
  const found = registry?.resolve(ref.name);
  if (!found) {
    throw new Error(
      `iconLayer: icon ref "${ref.name}" cannot be resolved — ` +
        (registry ? 'not registered.' : 'no IconRegistry provided to renderer.'),
    );
  }
  return found;
}

function renderChild(ref: Exclude<IconRef, { kind: 'ref' }>, fill: IconFill): Text | Graphics {
  const color = fill.color ?? 0xffffff;
  const alpha = fill.alpha ?? 1;

  if (ref.kind === 'glyph') {
    const style: TextStyleOptions = {
      fontFamily: ref.fontFamily ?? 'sans-serif',
      fontSize: 100,                      // baseline; positionAndScale rescales
      fill: color,
      align: 'center',
    };
    if (ref.fontWeight !== undefined) style.fontWeight = ref.fontWeight as never;
    if (ref.fontStyle !== undefined) style.fontStyle = ref.fontStyle;
    return new Text({ text: ref.char, style });
  }

  // ref.kind === 'svg' — trace path-d via Pixi v8's GraphicsPath
  const g = new Graphics();
  g.path(new GraphicsPath(ref.pathD));
  g.stroke({
    color,
    alpha,
    width: ref.strokeWidth ?? 2,
  });
  return g;
}

function positionAndScale(
  host: Container,
  child: Text | Graphics,
  fill: IconFill,
  bounds: Rect,
): void {
  const ratio = fill.sizeRatio ?? 0.6;
  const targetSize = Math.min(bounds.width, bounds.height) * ratio;
  const local = child.getLocalBounds();
  const naturalSize = Math.max(local.width, local.height) || 1;
  const scale = targetSize / naturalSize;
  child.scale.set(scale);
  // Center the host container on the bounds midpoint.
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  host.position.set(cx, cy);
  // Center the child within the host container.
  child.position.set(
    -(local.x + local.width / 2) * scale,
    -(local.y + local.height / 2) * scale,
  );
  host.alpha = fill.alpha ?? 1;
}

function refKey(r: Exclude<IconRef, { kind: 'ref' }>): string {
  if (r.kind === 'glyph') return `g:${r.char}:${r.fontFamily ?? ''}:${r.fontWeight ?? ''}:${r.fontStyle ?? ''}`;
  return `s:${r.pathD.length}:${hashString(r.pathD)}:${r.strokeWidth ?? 2}`;
}

function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
}
