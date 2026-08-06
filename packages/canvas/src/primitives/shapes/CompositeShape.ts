import { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { CircleShape } from './CircleShape';
import { EllipseShape } from './EllipseShape';
import { RectShape } from './RectShape';
import { PolygonShape } from './PolygonShape';
import { RegularPolygonShape } from './RegularPolygonShape';
import { StarShape } from './StarShape';
import { ArcShape } from './ArcShape';
import {
  applyLabelResolution,
  mountLabelContent,
  updateLabelContent,
  type LabelContentView,
} from '../paint/labelContent';
import {
  mountInsetContent,
  updateInsetContent,
  destroyInsetContent,
  type InsetContentView,
} from '../paint/insetContentLayer';
import type {
  ArcSpec,
  CircleSpec,
  CompositeRootSpec,
  CompositeSpec,
  EllipseSpec,
  PolygonSpec,
  Rect,
  RectSpec,
  RegularPolygonSpec,
  ShapeHostInfo,
  ShapePaintStyle,
  StarSpec,
} from '../types';
import { boundsOfComposite, resolveCompositeRoot } from '../../specs/shapeGeometry';

// The composite's spec vocabulary lives in `specs/` — it is a description, not
// drawing. Re-exported here so the long-standing import path keeps working.
export type {
  CompositePart,
  CompositePartFill,
  CompositePartStroke,
  CompositeRootSpec,
  CompositeSpec,
} from '../../specs';

/** Factory per root kind — composite borrows the real shape, no geometry copied. */
const ROOT_CTORS: Record<
  string,
  (spec: CompositeRootSpec, host: ShapeHostInfo) => ShapeBase<CompositeRootSpec>
> = {
  rect: (s, h) => new RectShape(s as RectSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  circle: (s, h) => new CircleShape(s as CircleSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  ellipse: (s, h) => new EllipseShape(s as EllipseSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  polygon: (s, h) => new PolygonShape(s as PolygonSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  'regular-polygon': (s, h) =>
    new RegularPolygonShape(s as RegularPolygonSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  star: (s, h) => new StarShape(s as StarSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
  arc: (s, h) => new ArcShape(s as ArcSpec, h) as unknown as ShapeBase<CompositeRootSpec>,
};

/**
 * A container shape: a **root** background shape plus an ordered list of child
 * {@link CompositePart}s — `rect` / `circle` / `line` geometry traced into the
 * shared body `Graphics`, and `label` text blocks mounted as Pixi text children
 * — each positioned relative to the composite's top-left origin (so
 * `(spec.x, spec.y)` places the whole composite, like {@link RectShape}).
 *
 * The composite owns **no** silhouette geometry of its own: it borrows a real
 * shape instance ({@link CompositeRootSpec}) and traces it via `paintInto`, so
 * fill, stroke, hit-testing and every decoration (ring / glow / halo) follow the
 * root shape automatically — a circular card gets a circular halo for free.
 *
 * Mounting text children mirrors how {@link ShapeBase} mounts glyph / svg /
 * image insets onto the shape's root container; labels here are diffed by
 * their index in `parts` (mount / update-in-place / destroy).
 */
export class CompositeShape extends ShapeBase<CompositeSpec> {
  static readonly kind = 'composite';

  /** Mounted label displays keyed by their index in `spec.parts`. */
  private readonly labelViews = new Map<number, LabelContentView>();

  /** Mounted `icon` inset views keyed by their index in `spec.parts`. */
  private readonly iconViews = new Map<number, InsetContentView>();

  /**
   * Device resolution for the mounted `label` parts, pushed by the renderer's
   * label-resolution LOD path ({@link setLabelResolution}). Re-applied to every
   * label on each {@link syncLabels} so redraws don't reset crisp text to base.
   */
  private labelResolution: number | null = null;

  /**
   * Whether the mounted `label` parts are hidden. Persists across
   * {@link syncLabels} (re-applied per redraw, like {@link labelResolution}) so a
   * text zoom-LOD toggle survives updates. Driven by {@link setTextVisible}.
   */
  private textHidden = false;

  /** Borrowed background shape — provides the silhouette geometry. */
  private rootShape!: ShapeBase<CompositeRootSpec>;
  private rootKind = '';

  /** Silhouette mask used when {@link CompositeSpec.clip} is set (else undefined). */
  private clipMask?: Graphics;

  constructor(spec: CompositeSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  /**
   * The effective root spec: explicit {@link CompositeSpec.root} or a default
   * rect. Resolved by the pure spec maths so the hit test (which has no
   * instance to ask) resolves the same silhouette this draws.
   */
  private rootSpecOf(spec: CompositeSpec): CompositeRootSpec {
    return resolveCompositeRoot(spec);
  }

  /**
   * Ensure {@link rootShape} matches the current root spec. Rebuilds the
   * instance only when the kind changes; otherwise refreshes its geometry spec
   * in place (no redraw of the borrowed instance's own — unused — gfx).
   */
  private ensureRoot(spec: CompositeSpec): void {
    const rootSpec = this.rootSpecOf(spec);
    if (this.rootShape === undefined || this.rootKind !== rootSpec.kind) {
      this.rootShape?.destroy();
      const make = ROOT_CTORS[rootSpec.kind] ?? ROOT_CTORS.rect!;
      this.rootShape = make(rootSpec, this.host);
      this.rootKind = rootSpec.kind;
    } else {
      this.rootShape.setGeometrySpec(rootSpec);
    }
  }

  protected drawGeometry(g: Graphics, spec: CompositeSpec, style?: ShapePaintStyle): void {
    // Delegate the silhouette to the root shape, centred in the card box. The
    // root traces at its own local origin (rect top-left, circle/poly centred),
    // so we offset by the difference between the box centre and the root's
    // bounding-box centre — origin-agnostic, using the root's own `bounds()`.
    const root = this.rootShape;
    const b = root.bounds();
    const ox = spec.width / 2 - (b.x + b.width / 2);
    const oy = spec.height / 2 - (b.y + b.height / 2);

    g.translateTransform(ox, oy);
    // `style` present → decoration override (ring/glow/ants trace the silhouette);
    // absent → normal body paint (fill + stroke from the root spec).
    root.paintInto(g, style);
    g.resetTransform();

    // Decoration overrides paint the silhouette only — never the inner parts.
    if (style) return;

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
      } else if (p.part === 'icon' && p.background) {
        // Chip behind the glyph; the glyph itself is a Pixi child (syncIcons).
        const { fill, fillAlpha, cornerRadius } = p.background;
        if (cornerRadius) g.roundRect(p.x, p.y, p.size, p.size, cornerRadius);
        else g.rect(p.x, p.y, p.size, p.size);
        g.fill({ color: fill, alpha: fillAlpha ?? 1 });
      }
      // 'label' / 'icon' glyphs are children, not geometry — handled in syncLabels / syncIcons.
    }
  }

  /** Refresh the root shape, geometry via the base `draw`, then labels + icons. */
  override draw(spec: CompositeSpec): void {
    this.ensureRoot(spec);
    super.draw(spec); // transform + bodyGfx(drawGeometry) + inset layers
    this.syncLabels(spec);
    this.syncIcons(spec);
    this.ensureClip(spec);
  }

  /**
   * Maintain the silhouette clip mask per {@link CompositeSpec.clip}. The mask is
   * the root shape traced (filled) at the same centred offset {@link drawGeometry}
   * uses, added as a child of `gfx` and set as `gfx.mask` — so every part /
   * label / icon is clipped to the card outline while the borrowed silhouette
   * (and its decorations, which live outside `gfx`) are untouched.
   */
  private ensureClip(spec: CompositeSpec): void {
    if (!spec.clip) {
      if (this.clipMask) {
        this.gfx.mask = null;
        this.clipMask.destroy();
        this.clipMask = undefined;
      }
      return;
    }
    if (!this.clipMask) {
      this.clipMask = new Graphics();
      this.clipMask.label = 'clip-mask';
      this.gfx.addChild(this.clipMask);
      this.gfx.mask = this.clipMask;
    }
    const g = this.clipMask;
    g.clear();
    const root = this.rootShape;
    const b = root.bounds();
    const ox = spec.width / 2 - (b.x + b.width / 2);
    const oy = spec.height / 2 - (b.y + b.height / 2);
    g.translateTransform(ox, oy);
    root.paintInto(g); // filled silhouette — the mask shape
    g.resetTransform();
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

      // Keep crisp text through redraws: re-assert the LOD resolution on the
      // (possibly freshly mounted) view before measuring / placing it.
      if (this.labelResolution !== null) applyLabelResolution(view, this.labelResolution);

      // Place the (measured) text block at the relative coordinate.
      const w = view.display.width;
      const dx = p.anchor === 'right' ? -w : p.anchor === 'center' ? -w / 2 : 0;
      view.display.position.set(p.x + dx, p.y);

      // Re-assert the persistent text-visibility flag so a zoom-LOD hide
      // survives this redraw / re-mount.
      view.display.visible = !this.textHidden;
    });

    // Destroy labels no longer present in the spec.
    for (const [i, view] of this.labelViews) {
      if (!seen.has(i)) {
        view.display.destroy();
        this.labelViews.delete(i);
      }
    }
  }

  /**
   * Diff the `icon` parts against the mounted `iconViews`, keyed by part index.
   * Each glyph/svg is mounted as an inset centred in its own `size × size` box
   * at the part's `(x, y)` — reusing the same {@link mountInsetContent} pipeline
   * ShapeBase uses for shape insets (anchor / sizeRatio / async svg-url all
   * carry over). The chip background, if any, is traced in `drawGeometry`.
   */
  private syncIcons(spec: CompositeSpec): void {
    const seen = new Set<number>();
    spec.parts.forEach((p, i) => {
      if (p.part !== 'icon') return;
      seen.add(i);
      // Synthetic bounds = the icon box; the inset anchors/scales within it.
      const box: Rect = { x: p.x, y: p.y, width: p.size, height: p.size };
      const existing = this.iconViews.get(i);
      if (existing) {
        updateInsetContent(existing, p.icon, box);
      } else {
        this.iconViews.set(i, mountInsetContent(this.gfx, p.icon, box));
      }
    });

    // Destroy icons no longer present in the spec.
    for (const [i, view] of this.iconViews) {
      if (!seen.has(i)) {
        destroyInsetContent(view);
        this.iconViews.delete(i);
      }
    }
  }

  bounds(): Rect {
    return CompositeShape.boundsOf(this.spec);
  }

  /**
   * Static AABB from the spec's `width × height` box — the composite's silhouette
   * fills its box (like {@link RectShape}). Exposed so `PrimitivesRenderer.boundsOfSpec`
   * can size a composite **without** an instance, which is how layouts (ELK et al.)
   * read node dimensions. Missing this made every card fall back to the layout's
   * default size and overlap.
   */
  static boundsOf(spec: Pick<CompositeSpec, 'width' | 'height'>): Rect {
    return boundsOfComposite(spec);
  }

  /**
   * Re-rasterise every mounted `label` part at `resolution` (device pixels per
   * CSS pixel) and remember it, so subsequent redraws keep the text crisp. The
   * renderer calls this from its label-resolution LOD path — the composite
   * counterpart to a `LabelDecoration.setResolution`.
   */
  setLabelResolution(resolution: number): void {
    if (!Number.isFinite(resolution) || resolution <= 0) return;
    this.labelResolution = resolution;
    for (const view of this.labelViews.values()) applyLabelResolution(view, resolution);
  }

  /**
   * Show / hide every mounted `label` part — the composite's internal text.
   * A pure `.visible` flip; the flag persists so a later redraw keeps text
   * hidden ({@link syncLabels} re-asserts it). This is the `IShape.setTextVisible`
   * hook the renderer's text zoom-LOD path drives, so a `TextLODBehaviour` gates
   * composite text the same way it gates a simple node's `'label'` decoration.
   */
  setTextVisible(visible: boolean): void {
    this.textHidden = !visible;
    for (const view of this.labelViews.values()) view.display.visible = visible;
  }

  /**
   * Sub-part hit test — returns the `hitId` of the topmost `hitId`-tagged part
   * (`rect` / `circle` / `icon`) containing the local point, or `undefined`.
   * Parts are traced back-to-front, so the search runs in reverse (last drawn =
   * on top). The renderer calls this to emit `shape:partover` / `shape:partout`.
   */
  hitTestPart(localX: number, localY: number): string | undefined {
    const parts = this.spec.parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]!;
      if (p.part === 'rect' && p.hitId !== undefined) {
        if (localX >= p.x && localX <= p.x + p.width && localY >= p.y && localY <= p.y + p.height) return p.hitId;
      } else if (p.part === 'circle' && p.hitId !== undefined) {
        const dx = localX - p.x;
        const dy = localY - p.y;
        if (dx * dx + dy * dy <= p.radius * p.radius) return p.hitId;
      } else if (p.part === 'icon' && p.hitId !== undefined) {
        if (localX >= p.x && localX <= p.x + p.size && localY >= p.y && localY <= p.y + p.size) return p.hitId;
      }
    }
    return undefined;
  }

  override destroy(): void {
    for (const view of this.labelViews.values()) view.display.destroy();
    this.labelViews.clear();
    for (const view of this.iconViews.values()) destroyInsetContent(view);
    this.iconViews.clear();
    if (this.clipMask) {
      this.gfx.mask = null;
      this.clipMask.destroy();
      this.clipMask = undefined;
    }
    this.rootShape?.destroy();
    super.destroy();
  }
}
