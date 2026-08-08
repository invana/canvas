import type { Graphics } from 'pixi.js';
import { ConnectorBase } from '../base/ConnectorBase';
import { emitDashedStroke } from '../paint/dashedStroke';
import type {
  BaseConnectorSpec,
  ConnectorPaintStyle,
  Path,
} from '../types';
import { samplePath } from '../../connectors/pathSampling';

/**
 * The single concrete connector class. Renders any `Path` natively via
 * Pixi commands (`moveTo` / `lineTo` / `quadraticCurveTo` / `bezierCurveTo`),
 * then strokes once with the spec's stroke or the decoration `style` override.
 *
 * Visual variation comes from the `router` (which produces the path), not
 * from connector subclasses. Custom rendering styles (double-line, gradient,
 * wiggle) are added later by extending `ConnectorBase` directly.
 */
export class Connector extends ConnectorBase<BaseConnectorSpec> {
  protected drawGeometry(
    g: Graphics,
    spec: BaseConnectorSpec,
    path: Path,
    style?: ConnectorPaintStyle,
  ): void {
    if (path.length < 2) return;

    // Decoration overlays take precedence; otherwise honour the spec's own
    // dash. `[0, 0]` (and any tuple with a non-positive endpoint) reads as
    // "no dash pattern" — fall through to the solid stroke so the line
    // doesn't disappear when a slider parks at zero.
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, samplePath(path), {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: false,
        // Inherit cap / join from the spec when the override doesn't
        // specify them — decorations that only widen the stroke (glow,
        // ripple) should match the host's silhouette ends instead of
        // forcing butt/miter back on.
        cap: style?.cap ?? spec.stroke?.cap,
        join: style?.join ?? spec.stroke?.join,
      });
      return;
    }

    for (const cmd of path) {
      switch (cmd.kind) {
        case 'M':
          g.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          g.lineTo(cmd.x, cmd.y);
          break;
        case 'Q':
          g.quadraticCurveTo(cmd.cx, cmd.cy, cmd.x, cmd.y);
          break;
        case 'C':
          g.bezierCurveTo(cmd.c1x, cmd.c1y, cmd.c2x, cmd.c2y, cmd.x, cmd.y);
          break;
      }
    }

    if (style?.strokeWidth !== undefined) {
      g.stroke({
        color: style.color ?? 0x000000,
        alpha: style.alpha ?? 1,
        width: style.strokeWidth,
        cap: style.cap ?? spec.stroke?.cap,
        join: style.join ?? spec.stroke?.join,
      });
      return;
    }

    const s = spec.stroke;
    const width = s?.width ?? 1;
    if (width <= 0) return;
    g.stroke({
      color: s?.color ?? 0x000000,
      alpha: s?.alpha ?? 1,
      width,
      cap: s?.cap,
      join: s?.join,
    });
  }
}
