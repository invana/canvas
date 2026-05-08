import { Graphics } from 'pixi.js';
import { PrimitiveBase } from './PrimitiveBase';
import { tangentAt, trimPathEnds } from '../connectors/pathSampling';
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
  protected spec!: TSpec;
  protected path: Path = [];

  constructor(protected readonly host: ConnectorHostInfo) {
    super();
    this.bodyGfx = new Graphics();
    this.gfx.addChild(this.bodyGfx);
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
    const strokeWidth = resolveStrokeWidth(spec);
    const bodyPath = this.trimPathForMarkers(spec, path, strokeWidth);
    this.drawGeometry(this.bodyGfx, spec, bodyPath);
    this.paintMarkers(this.bodyGfx, spec, path, undefined, strokeWidth);
  }

  paintInto(g: Graphics, spec: TSpec, path: Path, style?: ConnectorPaintStyle): void {
    const strokeWidth = resolveStrokeWidth(spec, style);
    const bodyPath = this.trimPathForMarkers(spec, path, strokeWidth);
    this.drawGeometry(g, spec, bodyPath, style);
    this.paintMarkers(g, spec, path, style, strokeWidth);
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
    strokeWidth: number = resolveStrokeWidth(spec, style),
  ): void {
    if (path.length < 2) return;
    const m = path[0]!;
    const last = path[path.length - 1]!;
    if (m.kind !== 'M') return;
    if (last.kind === 'M') return;

    const markerStyle: ShapePaintStyle | undefined = style?.tintMarkers
      ? {
          color: style.color ?? 0x000000,
          alpha: style.alpha,
          fill: true,
        }
      : undefined;

    if (spec.sourceMarker) {
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

    if (spec.targetMarker) {
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
