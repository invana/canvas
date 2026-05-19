import { Graphics } from 'pixi.js';
import { PrimitiveBase } from './PrimitiveBase';
import {
  distanceToPolylineSq,
  samplePath,
  tangentAt,
  trimPathEnds,
} from '../connectors/pathSampling';
import type {
  BaseConnectorSpec,
  ConnectorHostInfo,
  ConnectorPaintStyle,
  IConnector,
  MarkerShapeSpec,
  Path,
  Point,
  ShapeCtor,
  ShapePaintStyle,
} from '../types';

/**
 * Base for the single concrete `Connector` class (and any future custom
 * subclasses). Subclasses implement `drawGeometry` to render a `Path` onto a
 * `Graphics`. Marker placement is handled by `paintMarkers` — wired in step 9
 * once `pathSampling.tangentAt` and the shape registry resolution land.
 *
 * v0 ships only one concrete subclass (`Connector`); custom rendering styles
 * (double-line strokes, gradient strokes, "noodle" wiggles) are introduced
 * later by extending `ConnectorBase` directly. See the v0 plan's "What's NOT
 * in v0" section.
 */
export abstract class ConnectorBase<TSpec extends BaseConnectorSpec>
  extends PrimitiveBase
  implements IConnector<TSpec>
{
  protected readonly bodyGfx: Graphics;
  protected readonly sourceMarkerGfx: Graphics;
  protected readonly targetMarkerGfx: Graphics;
  protected spec!: TSpec;
  protected path: Path = [];

  constructor(protected readonly host: ConnectorHostInfo) {
    super();
    // Three siblings under `gfx` so decorations can hide each piece
    // independently. A reveal animation, for example, hides the body line
    // and the "ending" marker (the one the reveal is sweeping toward),
    // leaves the "starting" marker visible, and pops the ending marker in
    // when the line reaches it.
    this.bodyGfx = new Graphics();
    this.sourceMarkerGfx = new Graphics();
    this.targetMarkerGfx = new Graphics();
    this.gfx.addChild(this.bodyGfx);
    this.gfx.addChild(this.sourceMarkerGfx);
    this.gfx.addChild(this.targetMarkerGfx);

    // Hit-test geometry is part of the connector's identity, not the
    // renderer's bookkeeping. The closure reads `this.path` and
    // `this.spec.stroke.width` at call time, so route changes (router rerun)
    // and stroke changes (`setConnectorStroke` / spec rewrite) automatically
    // flow into the hit area — no re-wiring needed.
    //
    // Before the first `draw()`, `this.path` is empty and `this.spec` is
    // undefined; the early return makes hit-tests return `false` until the
    // connector is mounted with data. Pixi calls `hitArea.contains` only on
    // pointer events, by which time the connector has been drawn.
    this.gfx.eventMode = 'static';
    this.gfx.cursor = 'pointer';
    this.gfx.hitArea = {
      contains: (x: number, y: number): boolean => {
        if (this.path.length < 2 || !this.spec) return false;
        const sw = this.spec.stroke?.width ?? 1;
        const tol = sw / 2 + 4;
        return distanceToPolylineSq(samplePath(this.path), x, y) <= tol * tol;
      },
    };
  }

  /**
   * Render the path natively via Pixi commands (`moveTo` / `lineTo` /
   * `quadraticCurveTo` / `bezierCurveTo`) plus the spec's stroke (or `style`
   * override). Subclasses focus only on stroke style — markers are handled
   * by the base via `paintMarkers`.
   */
  protected abstract drawGeometry(
    g: Graphics,
    spec: TSpec,
    path: Path,
    style?: ConnectorPaintStyle,
  ): void;

  draw(spec: TSpec, path: Path): void {
    this.spec = spec;
    this.path = path;
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    this.gfx.zIndex = spec.zIndex ?? 0;
    this.bodyGfx.clear();
    this.sourceMarkerGfx.clear();
    this.targetMarkerGfx.clear();
    const strokeWidth = resolveStrokeWidth(spec);
    const bodyPath = this.trimPathForMarkers(spec, path, strokeWidth);
    this.drawGeometry(this.bodyGfx, spec, bodyPath);
    this.paintSourceMarker(this.sourceMarkerGfx, spec, path, undefined, strokeWidth);
    this.paintTargetMarker(this.targetMarkerGfx, spec, path, undefined, strokeWidth);
  }

  paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void {
    // Body uses the (possibly overridden) stroke width — decorations like
    // glow legitimately widen it for halo coverage. Markers always size off
    // the spec's stroke width: their geometry is `strokeWidth × *Scale`, so
    // a 16-px halo override would render a 96-px arrowhead on a 2-px line.
    // Path trimming also uses the spec width so the body stops where the
    // host's actual marker base lands.
    const bodyStrokeWidth = resolveStrokeWidth(spec, style);
    const markerStrokeWidth = resolveStrokeWidth(spec);
    const bodyPath = this.trimPathForMarkers(spec, path, markerStrokeWidth);
    this.drawGeometry(g, spec, bodyPath, style);
    if (!style?.skipMarkers) {
      this.paintMarkers(g, spec, path, style, markerStrokeWidth, bodyStrokeWidth);
    }
  }

  /**
   * Path trimmed by the source / target marker insets at the *spec* stroke
   * width — i.e. the visible body of the connector. Decorations call this
   * when they need to parameterise along the segment markers actually
   * cover. Identity when no markers are configured.
   */
  getVisiblePath(spec: TSpec, path: Path): Path {
    return this.trimPathForMarkers(spec, path, resolveStrokeWidth(spec));
  }

  /**
   * Toggle the body stroke without affecting markers or decoration children.
   * Body, source marker, and target marker live in three sibling Graphics
   * under `gfx`, so each can be hidden independently. The next `draw()`
   * re-strokes the body but preserves the hidden state.
   */
  setBodyVisible(visible: boolean): void {
    this.bodyGfx.visible = visible;
  }

  /** Toggle just the source-endpoint marker. See `setBodyVisible`. */
  setSourceMarkerVisible(visible: boolean): void {
    this.sourceMarkerGfx.visible = visible;
  }

  /** Toggle just the target-endpoint marker. See `setBodyVisible`. */
  setTargetMarkerVisible(visible: boolean): void {
    this.targetMarkerGfx.visible = visible;
  }

  /**
   * Resolve source/target marker insets via each marker's
   * `ShapeCtor.markerInset` and shorten the path's start / end so the body
   * stops at the marker's back edge. Markers themselves still paint at the
   * untrimmed endpoints, so the marker tip lands exactly on the path
   * endpoint (e.g. the arrow's tip touches the target).
   */
  private trimPathForMarkers(spec: TSpec, path: Path, strokeWidth: number): Path {
    if (path.length < 2) return path;
    const startInset = spec.sourceMarker
      ? markerInsetFor(this.host.shapeRegistry, spec.sourceMarker, strokeWidth)
      : 0;
    const endInset = spec.targetMarker
      ? markerInsetFor(this.host.shapeRegistry, spec.targetMarker, strokeWidth)
      : 0;
    if (startInset <= 0 && endInset <= 0) return path;
    return trimPathEnds(path, startInset, endInset);
  }

  /**
   * Paint source/target markers anchored at the path endpoints, oriented
   * along the local tangent. Looks up each marker's class via
   * `host.shapeRegistry` and dispatches to its `static paintInto`.
   *
   * Source angle is the **reversed** tangent so an arrow placed at the
   * source faces back toward it. Target angle is the forward tangent so an
   * arrow placed at the target points into it.
   *
   * When the connector style sets `tintMarkers`, markers paint with the
   * connector's color/alpha (used by glow / halo for unified silhouette
   * coverage). Otherwise markers use their own spec colors.
   */
  protected paintMarkers(
    g: Graphics,
    spec: TSpec,
    path: Path,
    style?: ConnectorPaintStyle,
    strokeWidth: number = resolveStrokeWidth(spec),
    /**
     * Halo stroke thickness used when `style.markerHalo` is set. Decoupled
     * from `strokeWidth` (which sizes marker geometry) so a glow can outline
     * the marker at its halo width without scaling the marker itself.
     */
    haloStrokeWidth: number = strokeWidth,
  ): void {
    this.paintSourceMarker(g, spec, path, style, strokeWidth, haloStrokeWidth);
    this.paintTargetMarker(g, spec, path, style, strokeWidth, haloStrokeWidth);
  }

  protected paintSourceMarker(
    g: Graphics,
    spec: TSpec,
    path: Path,
    style?: ConnectorPaintStyle,
    strokeWidth: number = resolveStrokeWidth(spec),
    haloStrokeWidth: number = strokeWidth,
  ): void {
    if (!spec.sourceMarker || path.length < 2) return;
    const m = path[0]!;
    const last = path[path.length - 1]!;
    if (m.kind !== 'M' || last.kind === 'M') return;
    const markerStyle = resolveMarkerStyle(style, haloStrokeWidth);
    const t = tangentAt(path, 0);
    const angleRad = Math.atan2(-t.y, -t.x);
    paintMarkerAt(
      g,
      this.host.shapeRegistry,
      spec.sourceMarker,
      { x: m.x, y: m.y },
      angleRad,
      markerStyle,
      strokeWidth,
    );
  }

  protected paintTargetMarker(
    g: Graphics,
    spec: TSpec,
    path: Path,
    style?: ConnectorPaintStyle,
    strokeWidth: number = resolveStrokeWidth(spec),
    haloStrokeWidth: number = strokeWidth,
  ): void {
    if (!spec.targetMarker || path.length < 2) return;
    const m = path[0]!;
    const last = path[path.length - 1]!;
    if (m.kind !== 'M' || last.kind === 'M') return;
    const markerStyle = resolveMarkerStyle(style, haloStrokeWidth);
    const t = tangentAt(path, 1);
    const angleRad = Math.atan2(t.y, t.x);
    paintMarkerAt(
      g,
      this.host.shapeRegistry,
      spec.targetMarker,
      { x: last.x, y: last.y },
      angleRad,
      markerStyle,
      strokeWidth,
    );
  }
}

function resolveMarkerStyle(
  style: ConnectorPaintStyle | undefined,
  haloStrokeWidth: number,
): ShapePaintStyle | undefined {
  if (!style?.tintMarkers) return undefined;
  if (style.markerHalo) {
    return {
      color: style.color ?? 0x000000,
      alpha: style.alpha,
      fill: false,
      strokeWidth: haloStrokeWidth,
    };
  }
  return {
    color: style.color ?? 0x000000,
    alpha: style.alpha,
    fill: true,
  };
}

/**
 * Single source of truth for the stroke width used by both line and markers.
 * A `style` override (decoration-level repaint) wins over the spec's stroke;
 * if neither resolves to a positive number we fall back to 1 so markers stay
 * visible.
 */
function resolveStrokeWidth(
  spec: BaseConnectorSpec,
  style?: ConnectorPaintStyle,
): number {
  const w = style?.strokeWidth ?? spec.stroke?.width ?? 1;
  return w > 0 ? w : 1;
}

function paintMarkerAt(
  g: Graphics,
  shapeRegistry: ReadonlyMap<string, ShapeCtor>,
  marker: MarkerShapeSpec,
  anchor: Point,
  angleRad: number,
  style: ShapePaintStyle | undefined,
  strokeWidth: number,
): void {
  const Ctor = shapeRegistry.get(marker.kind);
  if (!Ctor || typeof Ctor.paintInto !== 'function') return;
  Ctor.paintInto(g, marker, anchor, angleRad, style, strokeWidth);
}

function markerInsetFor(
  shapeRegistry: ReadonlyMap<string, ShapeCtor>,
  marker: MarkerShapeSpec,
  strokeWidth: number,
): number {
  const Ctor = shapeRegistry.get(marker.kind);
  if (!Ctor || typeof Ctor.markerInset !== 'function') return 0;
  const inset = Ctor.markerInset(marker, strokeWidth);
  return Number.isFinite(inset) && inset > 0 ? inset : 0;
}
