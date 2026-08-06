/**
 * Decoration and effect **styles** — what a decoration should look like.
 *
 * A style is a description (`{ color, width, alpha }`); the class that renders
 * it is backend-bound and lives with the renderer. Splitting them is what lets
 * `@invana/graph` build decoration specs without depending on a drawing
 * backend — otherwise the type system would recreate the very layering
 * inversion the renderer split exists to remove.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

/**
 * How the underlying host connector should be treated during reveal.
 *
 * - `'hide'` — the host's gfx is set invisible while the decoration is
 *   active; the decoration owns the only visible line. On one-shot
 *   completion (with `holdAtFull`) the host is restored to visible and the
 *   decoration clears its own gfx, so markers + native stroke take over.
 * - `'overlay'` — the host stays visible; the decoration paints a brighter
 *   "progress" segment on top. Best for laser-sweep / data-flow visuals on
 *   infinite loops.
 */
export type RevealHostStroke = 'hide' | 'overlay';

/**
 * Visual style of a `SelectionFrameDecoration` — the dashed AABB outline
 * plus a configurable subset of round drag handles. One decoration
 * replaces the 4–8 separate `ResizeHandleDecoration` mounts the resize
 * behaviour used to issue, so callers only manage one slot per host.
 *
 * The decoration is pure-visual: it paints itself and exposes per-handle
 * hit geometry via {@link SelectionFrameDecoration.getLocalHandleHits}.
 * Hit-test math lives in the behaviour, matching the `ToggleDecoration`
 * / `ResizeHandleDecoration` contract.
 */
/**
 * Border line style. `'solid'` paints a continuous outline; `'dashed'` and
 * `'dotted'` paint a regular gap pattern via Pixi's dashed stroke. Both
 * dash variants pick sensible default dash/gap lengths — supply
 * {@link SelectionFrameDecorationStyle.dashArray} to override them
 * verbatim.
 */
export type SelectionFrameBorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Visual kind of a drag handle. Circles read as "round nub"; squares are
 * the classic CAD/Figma look. Both kinds use the same hit geometry (a
 * disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
 * doesn't need to branch on shape.
 */
export type SelectionFrameHandleShape = 'circle' | 'square';

/** Named easings accepted by the reveal style payload. */
export type RevealEasingName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine';

/**
 * Direction the reveal grows along the connector path.
 *
 * - `'source-to-target'` — segment grows from the source endpoint toward the
 *   target endpoint.
 * - `'target-to-source'` — segment grows from the target endpoint toward the
 *   source endpoint.
 */
export type RevealDirection = 'source-to-target' | 'target-to-source';

/**
 * Repeat semantics for the reveal animation.
 *
 * - `false` — one-shot. Reveal runs once, then either settles fully drawn
 *   (`holdAtFull: true`) or clears.
 * - `true` — infinite loop. Reveal restarts from 0 each cycle.
 * - `number` — finite cycle count (must be `>= 1`).
 */
export type RevealRepeat = boolean | number;

/**
 * Static ring that traces the host silhouette at a fixed outward offset.
 *
 * Geometry: one `paintInto` call with a negative inset, so the ring sits
 * cleanly *outside* the body — independent from the host's own stroke.
 * Multiple rings (e.g. inner + outer) compose by attaching multiple Ring
 * decorations with different `gap` values; this class itself paints one
 * band per instance.
 *
 * Works on every shape that implements `paintInto` (everything extending
 * `ShapeBase`). On shape kinds without `paintInto` (e.g. plain text) the
 * decoration silently clears — same fallback as `GlowDecoration`.
 */
export interface RingDecorationStyle {
  readonly color: number;
  /** Ring stroke thickness, px. Default `2`. */
  readonly width?: number;
  /**
   * Gap between the host silhouette and the ring's inner edge, px.
   * Default `4`. Zero hugs the body; larger values produce a detached ring.
   */
  readonly gap?: number;
  /** Ring alpha, `[0, 1]`. Default `1`. */
  readonly alpha?: number;
  /** Dashed ring — `[dashLength, gapLength]` in px. Default solid. */
  readonly dashArray?: readonly [number, number];
}

/**
 * Halo / outer glow. Repaints the host's silhouette N times with widening
 * stroke and quadratic alpha falloff, producing a soft glow that hugs
 * whatever silhouette the host paints. Works on every shape that
 * implements `paintInto` (everything extending `ShapeBase`).
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * the renderer will register `tick` and advance the phase each frame.
 */
export interface GlowDecorationStyle {
  readonly color: number;
  /**
   * Outermost feather layer's stroke width, px. The outermost stroke
   * extends this many pixels past the host silhouette (`paintInto`'s
   * default alignment is `'outside'`), so the visual outer reach of the
   * glow matches this value. Inner layers taper linearly to `1` px.
   * Default `12`.
   *
   * Not a circle radius — the glow traces whatever silhouette the host
   * draws (rect / polygon / star / ...). The name reflects the underlying
   * stroke geometry, not the shape kind.
   */
  readonly strokeWidth?: number;
  /** Number of feather layers (more = smoother + more expensive). Default `6`. */
  readonly layers?: number;
  /** Innermost (brightest) layer alpha. Default `0.55`. */
  readonly innerAlpha?: number;
  /**
   * Optional brightness pulse. When omitted, the glow is static. When set,
   * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
   * sinusoidal cycle of `periodMs` milliseconds.
   */
  readonly pulse?: {
    /** Cycle length in ms. Default `1200`. */
    readonly periodMs?: number;
    /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
    readonly amplitude?: number;
  };
}

/**
 * Concentric rings that expand outward from the host's silhouette and fade
 * as they grow. A canonical "attention" decoration — pings, notifications,
 * "new arrival" indicators, sonar effects.
 *
 * Each ring traces the host silhouette via `paintInto` with a growing
 * `inset` (negative = outside) and shrinking alpha. Multiple concurrent
 * rings are scheduled by phase-offset across one period — so a `rings: 3`
 * decoration always shows three rings at different stages of expansion,
 * giving a steady visual rhythm.
 */
export interface PulseRingDecorationStyle {
  readonly color: number;
  /** Peak expansion distance from the host silhouette, px. Default `24`. */
  readonly maxRadius?: number;
  /** Cycle length in ms. Default `1400`. */
  readonly periodMs?: number;
  /** Number of concurrent rings (phase-distributed). Default `2`. */
  readonly rings?: number;
  /** Stroke width of each ring, px. Default `2`. */
  readonly strokeWidth?: number;
  /** Initial (full-brightness) alpha at radius 0. Default `0.7`. */
  readonly innerAlpha?: number;
}

/**
 * Classic "marching ants" selection outline. Strokes the host silhouette
 * with a dashed border whose `dashOffset` advances each frame, producing
 * the characteristic crawling-along-the-edge animation seen in selection
 * marquees (Photoshop, Figma, etc.).
 *
 * Geometry is delegated to `host.shape.paintInto` with `dashArray` /
 * `dashOffset` overrides — the shape primitive itself does the
 * silhouette tessellation. Works on every shape that implements
 * `paintInto` (anything extending `ShapeBase`).
 */
export interface MarchingAntsDecorationStyle {
  readonly color: number;
  /** Stroke width in px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Dash length in px. Default `6`. */
  readonly dashLength?: number;
  /** Gap length in px. Default `4`. */
  readonly gapLength?: number;
  /**
   * March speed in px/sec along the perimeter. Default `24`.
   * Negative values reverse the march direction.
   */
  readonly speedPxPerSec?: number;
  /**
   * Distance from the host silhouette. Positive = inside, negative =
   * outside. Default `0` (on the silhouette itself).
   */
  readonly inset?: number;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
}

/**
 * Liquid fill — paints a fluid level inside the host's silhouette, with a
 * vertical gradient and an optional wavy surface. Achieved without a "fill
 * provider" hook on shapes: the decoration paints a fluid polygon into its
 * own Graphics and masks the whole thing with the host silhouette via
 * `host.shape.paintInto({ fill: true })`.
 *
 * **Stroke compatibility.** When the host shape's stroke alignment is
 * `'outside'`, the stroke sits outside the silhouette and the mask leaves it
 * fully visible. For `'center'` / `'inside'`, the liquid covers the inside
 * portion of the stroke. Prefer `'outside'` for tank / pill diagrams.
 *
 * **Animation.** When `wave` is omitted the surface is a flat horizontal
 * line and `tick` returns `false` — the renderer retires the decoration
 * from its animation set, so still-water mode costs zero per frame after
 * `mount`. Supply `wave` to animate the meniscus.
 */
export interface LiquidFillDecorationStyle {
  /** Surface height as a fraction of host bounds height. `0` empty, `1` full. Default `0.6`. */
  readonly fillLevel?: number;
  /** Gradient colour at the surface. Default light blue (`0x9bbedb`). */
  readonly colorTop?: number;
  /** Gradient colour at the bottom. Default dark blue (`0x2d4d6e`). */
  readonly colorBottom?: number;
  /** Overall opacity of the fluid. Default `1`. */
  readonly alpha?: number;
  /**
   * Wave configuration. Omit (or pass `undefined`) for a flat still surface.
   * Provide for an animated meniscus — phase advances every frame.
   */
  readonly wave?: {
    /** Peak vertical displacement of the surface, px. Default `3`. */
    readonly amplitude?: number;
    /** Distance between wave crests, px. Default `80`. */
    readonly wavelength?: number;
    /** Time for one full phase cycle, ms. Default `1800`. */
    readonly periodMs?: number;
    /** Sample points per wavelength. Higher = smoother + more expensive. Default `12`. */
    readonly resolution?: number;
  };
  /**
   * Optional thin highlight band stroked along the surface (gloss / meniscus
   * effect). Opt-in: omit the field to skip drawing the highlight entirely.
   */
  readonly surfaceHighlight?: {
    /** Default `0xffffff`. */
    readonly color?: number;
    /** Default `0.35`. */
    readonly alpha?: number;
    /** Stroke width in px. Default `3`. */
    readonly thickness?: number;
  };
}

/**
 * Visual style of a `ToggleDecoration` — the small `+` / `−` button used to
 * collapse / expand compound groups, and by extension any "open this" /
 * "close this" affordance a domain layer wants to put on a shape.
 *
 * The decoration is pure-visual: it paints itself, exposes a shape-local
 * hit-geometry (`getLocalHitGeometry`), and emits no events. Domain
 * behaviours (e.g. `CollapseExpandBehaviour` in `@invana/graph`) read the
 * geometry and do the click-distance math against the host's
 * `shape:pointerdown` payload — keeps the decoration domain-free and
 * sidesteps Pixi event-bubbling through the shape gfx.
 */
export interface ToggleDecorationStyle {
  /**
   * Which glyph the button shows. Domain layers flip this through
   * `setDecoration` whenever the underlying collapsed-state changes.
   * Default `'plus'`.
   */
  readonly state?: 'plus' | 'minus';
  /** Where on the host AABB the toggle sits. Default `'bottom'`. */
  readonly placement?: TogglePlacement;
  /** Button outer radius, px. Default `10`. */
  readonly radius?: number;
  /** Button fill colour. Default `0xffffff` (white). */
  readonly bgFill?: number;
  /** Button fill alpha. Default `1`. */
  readonly bgAlpha?: number;
  /** Button outline colour. Default `0x6b7fff` (theme blue). */
  readonly strokeColor?: number;
  /** Button outline width, px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Glyph stroke colour. Default = `strokeColor`. */
  readonly glyphColor?: number;
  /** Glyph stroke width, px. Default `1.5`. */
  readonly glyphWidth?: number;
  /**
   * Extra offset applied after placement resolution, in shape-local px.
   * Use to nudge the toggle off a default placement without writing a
   * custom placement (e.g. push a `bottom-right` toggle further out
   * past a thick stroke).
   */
  readonly offsetX?: number;
  readonly offsetY?: number;
  /**
   * Override the keyword-based `placement` resolution with raw shape-local
   * coordinates. When set, `placement`, `offsetX`, and `offsetY` are all
   * ignored — the toggle's centre is placed at exactly `(x, y)` in the
   * host shape's local frame (centre-relative for centred shapes like
   * `CircleShape`, top-left-relative for `RectShape`).
   *
   * Use when none of the 12 named placements lands where you want it
   * (e.g. floating the toggle along a diagonal, or matching a specific
   * UI mock that doesn't snap to AABB anchors).
   */
  readonly position?: { readonly x: number; readonly y: number };
}

/**
 * Placement of a `ToggleDecoration` relative to the host shape's AABB.
 *
 * - Cardinal sides (`top` / `right` / `bottom` / `left`) sit centred on the
 *   midpoint of that side.
 * - Corners (`top-left` / ... / `bottom-right`) sit on the corner itself.
 * - `inside-*` variants mirror the cardinal sides but pull inward by
 *   `radius + 4 px` so the toggle nests inside the silhouette (useful for
 *   circle groups where an outside toggle would float well past the rim).
 *
 * The toggle's gfx is positioned by its centre, so it half-overlaps the
 * silhouette edge in the outside variants — a touch-friendly hit target
 * that visually reads as "attached to the host".
 */
export type TogglePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'inside-top'
  | 'inside-right'
  | 'inside-bottom'
  | 'inside-left';

/**
 * Shape-local hit geometry exposed by a `ToggleDecoration` instance. The
 * `cx` / `cy` coordinates are in the host shape's local frame (i.e. add
 * the host's spec `x` / `y` to convert to world). `radius` is the touch
 * radius — typically a touch larger than the visual radius so the button
 * stays easy to hit on coarse pointers.
 *
 * Domain behaviours read this and check `Math.hypot(worldX − host.x − cx,
 * worldY − host.y − cy) ≤ radius` in their `shape:pointerdown` handler.
 */
export interface ToggleHitGeometry {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

export interface ResizeHandleDecorationStyle {
  /** Which AABB position the handle sits on. Default `'bottom-right'`. */
  readonly placement?: ResizeHandlePlacement;
  /** Side length of the square handle, px. Default `8`. */
  readonly size?: number;
  /** Handle fill colour. Default `0xffffff`. */
  readonly bgFill?: number;
  readonly bgAlpha?: number;
  /** Handle outline colour. Default `0x6b7fff`. */
  readonly strokeColor?: number;
  /** Handle outline width. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Optional CSS-style cursor hint for the host renderer's hit pipeline. */
  readonly cursor?: string;
  /** Visible only when truthy. Domain behaviours flip this on hover/select. Default `true`. */
  readonly visible?: boolean;
  /**
   * Override the keyword-based `placement` resolution with raw shape-local
   * coordinates. When set, `placement` is ignored — the handle's centre is
   * placed at exactly `(x, y)` in the host shape's local frame. The
   * reported hit geometry's `placement` field still reflects the
   * configured `placement` (or `'bottom-right'` if omitted) so consumers
   * that switch on it for resize-direction math still work.
   */
  readonly position?: { readonly x: number; readonly y: number };
}

/**
 * Where on the host AABB a `ResizeHandleDecoration` sits. The eight cardinal
 * + corner positions cover every rectangular drag axis (horizontal / vertical
 * sides, diagonal corners). For radially-symmetric hosts (circle groups) use
 * any side — domain behaviours typically map all four sides to the same
 * radius-scaling drag.
 */
export type ResizeHandlePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface SelectionFrameDecorationStyle {
  /** Border line colour. Default `0x6b7fff` (theme blue). */
  readonly borderColor?: number;
  /** Border line width, px. Default `1.5`. */
  readonly borderWidth?: number;
  /**
   * `'solid'` | `'dashed'` | `'dotted'`. Default `'dotted'` — reads as a
   * helper / annotation rather than the host's actual outline. When
   * {@link dashArray} is supplied it wins over this preset.
   */
  readonly borderStyle?: SelectionFrameBorderStyle;
  /**
   * Custom dash pattern `[dashLength, gapLength]` in px. Overrides
   * {@link borderStyle} entirely when set — use when the presets don't
   * land where you want them.
   */
  readonly dashArray?: readonly [number, number];
  /** Border alpha. Default `0.6` — ghosts the frame so the host silhouette reads as the real thing. */
  readonly borderAlpha?: number;
  /**
   * Outward inset between the host AABB and the dashed frame. Lets the
   * frame visually "wrap" the host without touching the silhouette.
   * Default `4`.
   */
  readonly padding?: number;

  // ─── Handles ──────────────────────────────────────────────────────────
  /** `'circle'` (default) paints round nubs; `'square'` paints squares. */
  readonly handleShape?: SelectionFrameHandleShape;
  /**
   * Half-extent of the handle in px. For circle handles this is the
   * outer radius; for square handles it's half the side length, so the
   * visible size matches a circle of the same value. Default `5`.
   */
  readonly handleRadius?: number;
  /**
   * Corner radius for square handles only. Default `1.5` for a subtly
   * rounded look; pass `0` for hard corners. Ignored when
   * `handleShape: 'circle'`.
   */
  readonly handleCornerRadius?: number;
  /** Handle fill colour. Default `0xffffff`. */
  readonly handleFill?: number;
  /** Handle fill alpha. Default `1`. */
  readonly handleFillAlpha?: number;
  /** Handle outline colour. Default = `borderColor`. */
  readonly handleStrokeColor?: number;
  /** Handle outline width in px. Default `1.5`. Pass `0` for no outline. */
  readonly handleStrokeWidth?: number;
  /** Handle outline alpha. Default `1`. */
  readonly handleStrokeAlpha?: number;
  /**
   * Which handles to render. Default = all eight. Pass a smaller array to
   * suppress edge midpoints (`['top-left', 'top-right', 'bottom-left',
   * 'bottom-right']`) or limit to a single axis (`['right']` for the
   * radial circle case).
   */
  readonly handles?: ReadonlyArray<SelectionFramePlacement>;
  /** Visible only when truthy. Default `true`. */
  readonly visible?: boolean;
}

/**
 * One of the eight standard transform-frame anchors: corner (`top-left`,
 * `top-right`, `bottom-left`, `bottom-right`) or edge-midpoint (`top`,
 * `right`, `bottom`, `left`).
 *
 * Re-using `ResizeHandlePlacement`'s vocabulary so any behaviour that
 * already does direction-aware drag math (corner → diagonal resize,
 * `top` / `bottom` → vertical, `left` / `right` → horizontal) keeps
 * working without translation.
 */
export type SelectionFramePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Per-handle hit geometry returned by {@link SelectionFrameDecoration.getLocalHandleHits}.
 * `cx` / `cy` are in the host shape's local frame (add the host's spec
 * `x` / `y` to convert to world). `radius` is the touch radius (visual
 * radius + a small floor for coarse pointers).
 */
export interface SelectionFrameHandleHit {
  readonly placement: SelectionFramePlacement;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

/**
 * Static halo-style ring painted underneath a connector's path — a single
 * thick stroke tracing the host's routed geometry, behind the host stroke.
 *
 * Connectors are 1-D (no `inset`), so a true detached parallel-offset ring
 * would need separately routed geometry. This decoration takes the simpler
 * "single wider stroke" route: paint one band of `width` px behind the
 * host, optionally dashed, with `markerHalo` so the host's end markers
 * land inside the same band. Composes with `width` < host stroke for a
 * subtle outline or `width` > host stroke for a "highlighted edge" feel.
 *
 * For a thicker / softer feathered halo, use `GlowConnectorDecoration`
 * instead — it stacks multiple layers with alpha falloff.
 */
export interface RingConnectorDecorationStyle {
  readonly color: number;
  /** Halo band thickness in px. Default `6`. */
  readonly width?: number;
  /** Halo alpha, `[0, 1]`. Default `0.6`. */
  readonly alpha?: number;
  /** Dashed band — `[dashLength, gapLength]` in px. Default solid. */
  readonly dashArray?: readonly [number, number];
}

/**
 * Soft halo around the routed path of a connector. Repaints the path N
 * times with widening stroke and quadratic alpha falloff, producing a
 * glow that hugs whatever curve the path resolves to. Works on every
 * router / pathStyle because geometry is delegated to
 * `host.connector.paintInto`.
 *
 * Static by default. Supply `pulse` to animate brightness sinusoidally —
 * geometry is only repainted on `repaint`; per-frame work touches
 * `this.gfx.alpha` and nothing else, so the pulse is essentially free.
 */
export interface GlowConnectorDecorationStyle {
  readonly color: number;
  /** Outermost glow extent in px (widest stroke). Default `12`. */
  readonly radius?: number;
  /** Number of feather layers (more = smoother + more expensive). Default `6`. */
  readonly layers?: number;
  /** Innermost (brightest) layer alpha. Default `0.55`. */
  readonly innerAlpha?: number;
  /**
   * Optional brightness pulse. When omitted, the glow is static. When set,
   * the decoration alpha-multiplies between `1` and `1 - amplitude` on a
   * sinusoidal cycle of `periodMs` milliseconds.
   */
  readonly pulse?: {
    /** Cycle length in ms. Default `1200`. */
    readonly periodMs?: number;
    /** How far below full brightness the dim phase reaches, `[0, 1]`. Default `0.5`. */
    readonly amplitude?: number;
  };
}

/**
 * Connector variant of marching-ants. Strokes the connector's routed path
 * with a dashed line whose `dashOffset` advances each frame, producing
 * a flowing/marching pattern along the line — useful for highlighting an
 * active edge, a route under consideration, a data flow, etc.
 *
 * Geometry is delegated to `host.connector.paintInto` with `dashArray` /
 * `dashOffset` overrides; the connector primitive samples the routed
 * path and emits dashes via the shared `dashedStroke` helper. Works on
 * every router / pathStyle (straight, orth, bezier, smooth — all produce
 * a `Path`).
 */
export interface MarchingAntsConnectorDecorationStyle {
  readonly color: number;
  /** Stroke width in px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Dash length in px. Default `6`. */
  readonly dashLength?: number;
  /** Gap length in px. Default `4`. */
  readonly gapLength?: number;
  /**
   * March speed in px/sec along the path. Default `24`.
   * Negative values reverse the march direction.
   */
  readonly speedPxPerSec?: number;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

/**
 * Connector analogue of `PulseRingDecoration`. Each frame, every ring
 * strokes the host's body + markers at a width that grows outward over
 * one period and fades as it grows — so the wave inherits the connector's
 * silhouette (line shape, bends, arrowhead) instead of being a circular
 * pulse at a single point. Multiple concurrent rings are phase-
 * distributed across one period for a steady rhythm.
 *
 * Geometry is delegated to `connector.paintInto` with a widening
 * `strokeWidth` and `tintMarkers + markerHalo` (so the markers outline at
 * the ring's width, not scale up). The host's normal paint sits on top
 * (zIndex = 0; this decoration's slot z is typically < 0 for "behind"
 * rings, ≥ 0 for "above" rings — pick a slot name accordingly).
 */
export interface RippleConnectorDecorationStyle {
  readonly color: number;
  /**
   * Peak halo extent in px (half-width). Each ring's stroke widens from
   * `0` to `2 × maxRadius` over one period, so the silhouette appears to
   * push outward by up to `maxRadius` on each side. Default `16`.
   */
  readonly maxRadius?: number;
  /** Cycle length in ms. Default `1400`. */
  readonly periodMs?: number;
  /** Number of concurrent rings (phase-distributed). Default `2`. */
  readonly rings?: number;
  /** Initial (full-brightness) alpha at radius 0. Default `0.7`. */
  readonly innerAlpha?: number;
}

/**
 * Connector decoration that animates a single marker travelling along the
 * routed path of its host. Useful for visualising direction, data flow, or
 * an active "in-flight" state on an edge. Works on every router / pathStyle
 * because it consumes the resolved `Path` via `samplePath`.
 *
 * The marker's silhouette is drawn once into `markerGfx`; only its position
 * and rotation are updated each frame. Position is derived from a
 * cumulative arc-length table rebuilt on `repaint` (host or style change),
 * so per-frame work is a binary search + interpolation.
 */
export interface FlyMarkerConnectorDecorationStyle {
  readonly color: number;
  /** Marker silhouette. Default `'circle'`. */
  readonly markerKind?: 'circle' | 'arrow' | 'square';
  /** Marker size in px (diameter / arrow length / square side). Default `8`. */
  readonly size?: number;
  /**
   * Travel speed along the path in px/sec. Negative values reverse direction.
   * Default `80`.
   */
  readonly speedPxPerSec?: number;
  /**
   * When `true` (default) the marker wraps back to the start after reaching
   * the end (or vice versa for negative speed). When `false` the marker
   * stops at the end of the path until the decoration is removed.
   */
  readonly loop?: boolean;
  /** Initial position along the path in `[0, 1]`. Default `0`. */
  readonly phase?: number;
  /**
   * Rotate the marker so its local +x axis points along the local tangent.
   * Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.
   */
  readonly orientToPath?: boolean;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
}

/**
 * Connector decoration that animates `count` markers travelling along the
 * routed path at the same speed, evenly spread in phase. Useful for
 * visualising sustained flow / throughput on an edge (e.g. data streaming,
 * traffic).
 *
 * Same engine as `FlyMarkerConnectorDecoration` extended to N markers; one
 * arc-length table is built per repaint and shared across all particles.
 */
export interface FlowParticlesConnectorDecorationStyle {
  readonly color: number;
  /** Marker silhouette. Default `'circle'`. */
  readonly markerKind?: 'circle' | 'arrow' | 'square';
  /** Number of particles. Clamped to `>= 1`. Default `5`. */
  readonly count?: number;
  /** Marker size in px. Default `6`. */
  readonly size?: number;
  /**
   * Travel speed along the path in px/sec. Negative values reverse direction.
   * Default `60`.
   */
  readonly speedPxPerSec?: number;
  /**
   * When `true` (default) particles wrap back to the start after reaching
   * the end. Setting this to `false` makes all particles stall at the end
   * once they arrive — usually only useful with `count: 1`.
   */
  readonly loop?: boolean;
  /** Phase offset applied to every particle in `[0, 1]`. Default `0`. */
  readonly phase?: number;
  /**
   * Rotate each marker so its local +x axis points along the local tangent.
   * Default `true` for `'arrow'`, `false` for `'circle'` and `'square'`.
   */
  readonly orientToPath?: boolean;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
}

/**
 * Connector decoration that progressively reveals the routed path from one
 * endpoint to the other — as if the line were being drawn in real time.
 * Useful as an entrance animation for new edges, a directional "data-flow"
 * pulse, or a laser-sweep effect for active routes.
 *
 * Implementation: the host `Path` is densified into a polyline on mount
 * (via `samplePath`); per-frame the decoration computes a cumulative-arc-
 * length cutoff from the driving `Tween` and emits a `lineTo` walk plus a
 * single `stroke()` for the revealed segment. Curves stay smooth because
 * the polyline already uses the engine-wide sampling step counts.
 *
 * Markers are intentionally not painted by this decoration. When
 * `hostStroke: 'hide'` and the animation completes with `holdAtFull: true`,
 * the host connector's gfx is re-shown so its native stroke + markers
 * take over the final display. For infinite loops the host stays hidden
 * for the lifetime of the decoration.
 */
export interface RevealConnectorDecorationStyle {
  /** Duration of one full source→target sweep in ms. Default `2000`. */
  readonly durationMs?: number;
  /** `false` = one-shot (default), `true` = infinite, or a positive integer cycle count. */
  readonly repeat?: RevealRepeat;
  /** Easing curve. Default `'linear'` — constant "pen speed" feels most natural for a drawing reveal. */
  readonly easing?: RevealEasingName;
  /** Sweep direction. Default `'source-to-target'`. */
  readonly direction?: RevealDirection;
  /** Treatment of the underlying host connector stroke. Default `'hide'`. */
  readonly hostStroke?: RevealHostStroke;
  /**
   * When `repeat` is `false`, hold the fully-drawn state after the cycle
   * completes (handing off to the host stroke when `hostStroke: 'hide'`).
   * Ignored for infinite / finite-repeat modes. Default `true`.
   */
  readonly holdAtFull?: boolean;
  /** Wait this many ms after mount before starting the reveal. Default `0`. */
  readonly delayMs?: number;
}
