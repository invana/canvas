// ── Label ─────────────────────────────────────────────────────────────────────
// Reusable label primitive shared by node and edge labels.
//
// Owns one `Container` containing an optional background `Graphics` and one
// pluggable text backend (PIXI.Text by default, BitmapText opt-in). Designed to
// be added to a dedicated label layer (not as a child of the owner shape's
// container) so labels render above all bodies and can be toggled as a group.
//
// Internal to @invana/canvas-deprecated; not re-exported from the public index.

import { Container, Graphics } from 'pixi.js';
import type { LabelStyle, LabelBackgroundStyle, LabelRenderer } from './types.js';
import { createTextBackend, type TextBackend } from './renderers.js';

/**
 * Anchor point + optional tangent at which a {@link Label} should be drawn.
 *
 * - `x`, `y` — centre of the label in world space.
 * - `tangent` — radians; used when `style.rotation === 'auto'` (edge labels)
 *   to align the label along the path direction with auto-flip for legibility.
 */
export interface LabelAnchor {
  x: number;
  y: number;
  /** Path-tangent angle in radians. Omit for static-rotation node labels. */
  tangent?: number;
}

/** Per-update positioning options. Static rotation is resolved upstream. */
export interface LabelPlacement {
  /** Numeric rotation override (radians). Trumps `autoRotate`. */
  rotation?: number;
  /**
   * Auto-rotate along {@link LabelAnchor.tangent} with auto-flip when the
   * tangent points "backwards" (|θ| > π/2) so text is never upside-down.
   */
  autoRotate?: boolean;
}

/**
 * Resolved padding tuple `[top, right, bottom, left]` derived from a
 * {@link LabelBackgroundStyle.padding} shorthand.
 */
function resolvePadding(p: LabelBackgroundStyle['padding']): [number, number, number, number] {
  if (p === undefined) return [4, 4, 4, 4];
  if (typeof p === 'number') return [p, p, p, p];
  if (p.length === 2) return [p[1], p[0], p[1], p[0]];
  return p;
}

/** Reusable label display object. Internal — instantiated by ShapeObject. */
export class Label {
  /** The Container added to the label layer. */
  readonly view: Container;

  private _bg: Graphics | null = null;
  private _backend: TextBackend;
  private _backendKind: LabelRenderer = 'text';
  /**
   * Resolution pinned by the most recent `LabelStyle.resolution`. When set,
   * external callers (e.g. a `LabelResolutionPlugin` driving a global
   * zoom-based resolution) MUST NOT overwrite it via {@link setResolution}.
   */
  private _styleResolution: number | undefined = undefined;

  constructor() {
    this.view = new Container();
    this.view.eventMode = 'none';
    this._backend = createTextBackend('text');
    this.view.addChild(this._backend.view);
  }

  /**
   * Update text + style, position the label at `anchor`, and rotate per
   * `placement`. Background is created lazily the first time `style.background`
   * is set, and hidden (not destroyed) when later removed.
   */
  update(
    text: string,
    style: LabelStyle,
    anchor: LabelAnchor,
    placement: LabelPlacement = {},
  ): void {
    this._ensureBackend(style.renderer ?? 'text');

    this._backend.update(text, style);
    this._updateBackground(style.background);

    this._styleResolution = style.resolution;
    if (style.resolution !== undefined) {
      this._backend.setResolution(style.resolution);
    }

    this.view.position.set(anchor.x, anchor.y);
    this.view.rotation = this._resolveRotation(anchor.tangent, placement);
    this.view.visible = true;
  }

  /**
   * Set the rasterization resolution from an external driver
   * (e.g. `LabelResolutionPlugin`). Skipped when this label has a per-element
   * {@link LabelStyle.resolution} override, since user intent wins.
   *
   * @returns `true` if the resolution was applied, `false` if skipped.
   */
  setResolution(r: number): boolean {
    if (this._styleResolution !== undefined) return false;
    this._backend.setResolution(r);
    return true;
  }

  /** Hide the label without destroying it (used when pooling). */
  hide(): void {
    this.view.visible = false;
  }

  /** Permanently destroy the label and its display objects. */
  destroy(): void {
    this._backend.destroy();
    this._bg?.destroy();
    this.view.destroy({ children: true });
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private _ensureBackend(kind: LabelRenderer): void {
    if (kind === this._backendKind) return;
    this._backend.destroy();
    this._backend = createTextBackend(kind);
    this._backendKind = kind;
    // New backend's view goes on top of (or in lieu of) the background.
    this.view.addChild(this._backend.view);
  }

  private _updateBackground(bg: LabelBackgroundStyle | undefined): void {
    if (!bg) {
      if (this._bg) this._bg.visible = false;
      return;
    }

    if (!this._bg) {
      this._bg = new Graphics();
      this._bg.eventMode = 'none';
      // Ensure the background sits behind the text.
      this.view.addChildAt(this._bg, 0);
    }
    this._bg.visible = true;

    const [pt, pr, pb, pl] = resolvePadding(bg.padding);
    const { width, height } = this._backend.getBounds();
    const w = width  + pl + pr;
    const h = height + pt + pb;
    const radius = bg.radius ?? 4;

    this._bg.clear();
    this._bg.roundRect(-w / 2, -h / 2, w, h, radius);
    this._bg.fill({ color: bg.fill ?? '#1f2937', alpha: bg.opacity ?? 1 });
    if (bg.stroke && (bg.strokeWidth ?? 0) > 0) {
      this._bg.stroke({
        color: bg.stroke,
        width: bg.strokeWidth ?? 0,
        alpha: bg.opacity ?? 1,
      });
    }

    // Compensate for asymmetric padding so text still sits on the geometric
    // centre of the background.
    this._backend.view.position.set((pl - pr) / 2, (pt - pb) / 2);
  }

  private _resolveRotation(tangent: number | undefined, placement: LabelPlacement): number {
    if (placement.rotation !== undefined) return placement.rotation;
    if (placement.autoRotate && tangent !== undefined) {
      // Auto-flip when text would be upside-down.
      const a = ((tangent + Math.PI) % (2 * Math.PI)) - Math.PI;
      if (a > Math.PI / 2)  return a - Math.PI;
      if (a < -Math.PI / 2) return a + Math.PI;
      return a;
    }
    return 0;
  }
}
