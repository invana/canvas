import { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import {
  mountLabelContent,
  updateLabelContent,
  type LabelContentView,
} from '../paint/labelContent';
import type { BaseShapeSpec, Rect, ShapeHostInfo } from '../types';

/** Solid stroke for a {@link CompositePart}. */
interface PartStroke {
  readonly color: number;
  readonly width?: number;
  readonly alpha?: number;
}

/** Solid fill + optional stroke shared by the geometric part kinds. */
interface PartFill {
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: PartStroke;
}

/**
 * A child element of a {@link CompositeShape}, positioned at a coordinate
 * relative to the composite's top-left origin.
 *
 * - `'rect'` / `'circle'` / `'line'` — geometry traced into the shared body
 *   `Graphics`. Fill/stroke are solid colours (the simple sugar fields here);
 *   for gradient / image / dashed paint, compose dedicated shapes instead.
 * - `'label'` — a text block mounted as a Pixi text child. `anchor` picks
 *   which horizontal edge of the measured block lands at `x` (default left);
 *   `maxWidth` enables word-wrap, `maxLines` + `overflow` drive ellipsis.
 */
export type CompositePart =
  | ({
      readonly part: 'rect';
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
      readonly cornerRadius?: number;
    } & PartFill)
  | ({
      readonly part: 'circle';
      readonly x: number;
      readonly y: number;
      readonly radius: number;
    } & PartFill)
  | {
      readonly part: 'line';
      readonly x: number;
      readonly y: number;
      readonly x2: number;
      readonly y2: number;
      readonly stroke: PartStroke;
    }
  | {
      readonly part: 'label';
      readonly x: number;
      readonly y: number;
      readonly text: string;
      /** Horizontal anchor of the text block at `(x, y)`. Default `'left'`. */
      readonly anchor?: 'left' | 'center' | 'right';
      readonly fontSize?: number;
      readonly fontWeight?: number | string;
      readonly fontStyle?: 'normal' | 'italic';
      readonly fontVariant?: 'normal' | 'small-caps';
      readonly fill?: number;
      readonly lineHeight?: number;
      readonly align?: 'left' | 'center' | 'right';
      readonly maxWidth?: number;
      readonly maxLines?: number;
      readonly overflow?: 'clip' | 'ellipsis';
    };

/**
 * Spec for a {@link CompositeShape}. The outer frame is a rounded rect sized
 * `width` × `height`, painted from the inherited `fill` / `stroke`. `parts`
 * declares ordered child geometry + labels at coordinates relative to the
 * composite's top-left origin.
 */
export interface CompositeSpec extends BaseShapeSpec {
  readonly kind: 'composite';
  readonly width: number;
  readonly height: number;
  /** Outer frame corner radius. Default `0` (sharp). */
  readonly cornerRadius?: number;
  /** Ordered child parts; geometry traced into the body, labels mounted as text. */
  readonly parts: readonly CompositePart[];
}

/**
 * A container shape: an outer rounded-rect frame plus an ordered list of child
 * {@link CompositePart}s — `rect` / `circle` / `line` geometry traced into the
 * shared body `Graphics`, and `label` text blocks mounted as Pixi text children
 * — each positioned at a coordinate relative to the composite's top-left origin
 * (so `(spec.x, spec.y)` places the whole composite, like {@link RectShape}).
 *
 * Mounting text children mirrors how {@link ShapeBase} mounts glyph / svg /
 * image insets onto the shape's root container; labels here are diffed by
 * their index in `parts` (mount / update-in-place / destroy).
 */
export class CompositeShape extends ShapeBase<CompositeSpec> {
  static readonly kind = 'composite';

  /** Mounted label displays keyed by their index in `spec.parts`. */
  private readonly labelViews = new Map<number, LabelContentView>();

  constructor(spec: CompositeSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: CompositeSpec): void {
    // Outer frame.
    const r = spec.cornerRadius ?? 0;
    if (r > 0) g.roundRect(0, 0, spec.width, spec.height, r);
    else g.rect(0, 0, spec.width, spec.height);
    if (typeof spec.fill === 'number') g.fill({ color: spec.fill, alpha: spec.alpha ?? 1 });
    if (spec.stroke) {
      g.stroke({
        color: spec.stroke.color,
        width: spec.stroke.width ?? 1,
        alpha: spec.stroke.alpha ?? 1,
      });
    }

    // Geometric sub-parts — each traces its own path, then fills / strokes it.
    for (const p of spec.parts) {
      if (p.part === 'rect') {
        if (p.cornerRadius) g.roundRect(p.x, p.y, p.width, p.height, p.cornerRadius);
        else g.rect(p.x, p.y, p.width, p.height);
        if (p.fill !== undefined) g.fill({ color: p.fill, alpha: p.fillAlpha ?? 1 });
        if (p.stroke) g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      } else if (p.part === 'circle') {
        g.circle(p.x, p.y, p.radius);
        if (p.fill !== undefined) g.fill({ color: p.fill, alpha: p.fillAlpha ?? 1 });
        if (p.stroke) g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      } else if (p.part === 'line') {
        g.moveTo(p.x, p.y);
        g.lineTo(p.x2, p.y2);
        g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      }
      // 'label' is text, not geometry — handled in syncLabels.
    }
  }

  /** Geometry via the base `draw`, then reconcile the text-label children. */
  override draw(spec: CompositeSpec): void {
    super.draw(spec); // transform + bodyGfx(drawGeometry) + inset layers
    this.syncLabels(spec);
  }

  /**
   * Diff the `label` parts against the mounted `labelViews` map, keyed by part
   * index: mount new labels, update existing ones in place, destroy removed
   * ones. Each label is positioned at its relative `(x, y)` with the requested
   * horizontal anchor (measured against the rendered block width).
   */
  private syncLabels(spec: CompositeSpec): void {
    const seen = new Set<number>();
    spec.parts.forEach((p, i) => {
      if (p.part !== 'label') return;
      seen.add(i);

      const content = {
        kind: 'text' as const,
        text: p.text,
        fontSize: p.fontSize,
        fontWeight: p.fontWeight,
        fontStyle: p.fontStyle,
        fontVariant: p.fontVariant,
        lineHeight: p.lineHeight,
        fill: p.fill ?? 0xffffff,
        align: p.align,
      };
      const wrap =
        p.maxWidth !== undefined
          ? { maxWidth: p.maxWidth, maxLines: p.maxLines, overflow: p.overflow ?? 'ellipsis' }
          : undefined;

      let view = this.labelViews.get(i);
      if (!view) {
        view = mountLabelContent(content, wrap);
        this.gfx.addChild(view.display);
        this.labelViews.set(i, view);
      } else {
        const next = updateLabelContent(view, content, wrap);
        if (next !== view) {
          this.gfx.addChild(next.display);
          view = next;
          this.labelViews.set(i, next);
        }
      }

      // Place the (measured) text block at the relative coordinate.
      const w = view.display.width;
      const dx = p.anchor === 'right' ? -w : p.anchor === 'center' ? -w / 2 : 0;
      view.display.position.set(p.x + dx, p.y);
    });

    // Destroy labels no longer present in the spec.
    for (const [i, view] of this.labelViews) {
      if (!seen.has(i)) {
        view.display.destroy();
        this.labelViews.delete(i);
      }
    }
  }

  bounds(): Rect {
    return { x: 0, y: 0, width: this.spec.width, height: this.spec.height };
  }

  override destroy(): void {
    for (const view of this.labelViews.values()) view.display.destroy();
    this.labelViews.clear();
    super.destroy();
  }
}
