import type { Graphics } from 'pixi.js';
import { ConnectorBase } from '../base/ConnectorBase';
import type {
  BaseConnectorSpec,
  ConnectorPaintStyle,
  Path,
} from '../types';

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
        cap: style.cap,
        join: style.join,
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
