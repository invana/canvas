/**
 * Shared draw-layer helper: stroke an open polyline with a
 * `ConnectorPaintStyle`. Honours the style's `stroke` and (optional) `dash`
 * fields. Caller has already cleared `g`.
 *
 * This is the draw-layer counterpart to `IConnector.paintInto` — it strokes
 * the polyline CENTERLINE only, with no markers and no curve smoothing.
 * Used by:
 *   - Standalone draw-layer demos (`Canvas/Draw/Decorations/Connectors/...`)
 *     that want to visualise the style produced by a connector decoration
 *     without building a full renderer connector instance.
 *   - The renderer-side `*ConnectorDecoration` wrappers route the same
 *     style through `connector.paintInto` instead, so the silhouette
 *     (path + markers, curve-faithful) is covered uniformly.
 *
 * Internal-prefix kept so the API surface of `draw/` stays small; exported
 * via `draw/index.ts` as `paintCenterline`.
 */

import type { Graphics } from 'pixi.js';
import type { ConnectorPaintStyle, Point } from '../../types';
import { drawDashedPolylineOpen } from '../_polylineUtils';

export function paintCenterline(
  g: Graphics,
  polyline: ReadonlyArray<Point>,
  style: ConnectorPaintStyle,
): void {
  const stroke = style.stroke;
  if (!stroke || stroke.width <= 0 || polyline.length < 2) return;

  const dash = style.dash;
  if (dash && dash.dashLength > 0 && dash.gapLength > 0) {
    drawDashedPolylineOpen(
      g,
      polyline,
      dash.dashLength,
      dash.gapLength,
      dash.dashOffset ?? 0,
    );
  } else {
    g.moveTo(polyline[0]!.x, polyline[0]!.y);
    for (let i = 1; i < polyline.length; i++) {
      g.lineTo(polyline[i]!.x, polyline[i]!.y);
    }
  }

  g.stroke({
    color: stroke.color,
    width: stroke.width,
    alpha: stroke.alpha ?? 1,
    cap: stroke.cap,
    join: stroke.join,
  });
}
