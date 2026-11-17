/**
 * `DrawGeoFeatureBehaviour` — draw a polygon, a line or a circle on the map and
 * keep it. Set `tool` to `'polygon'`, `'line'` or `'circle'`; click to place
 * vertices (a circle is centre then radius), double-click or press Enter to finish.
 * The finished shape is added to the features layer as **one** `addFeature` — one
 * undo step, however many vertices — with the provenance an analyst needs:
 * `author` (the `author` option, omitted when unset), `reportedAt` (now, ISO 8601)
 * and `tool`. A circle is a `Point` with `radiusKm`.
 *
 * While a tool is set the map is held (see {@link GeoToolBehaviour}); `tool: null`,
 * `disable()`, Escape with nothing in progress, or destroying the behaviour gives
 * it back. The shape being drawn is a draft: never stored, never in the history.
 *
 * ```ts
 * canvas.behaviours.register(new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo' }));
 * canvas.update({ behaviours: { draw: { enabled: true, tool: 'polygon', author: 'analyst-3' } } });
 * ```
 */

import type { GeoFeature } from '../features/types';
import { GeoToolBehaviour, type GeoToolOptions } from './GeoToolBehaviour';
import type { CollectedShape, ShapeKind } from './PointerCollector';

/** The tools this behaviour draws. */
export type DrawTool = 'polygon' | 'line' | 'circle';

/** Options for {@link DrawGeoFeatureBehaviour}. Everything but the two layer ids is a setting. */
export interface DrawGeoFeatureBehaviourOptions extends GeoToolOptions {
  /** What to draw now. `null` / unset: nothing, and the map is not held. */
  tool?: DrawTool | null;
  /** Written to each drawn feature's `author`. Omitted from the feature when unset. */
  author?: string;
  /** Prefix of generated feature ids. Default `'feature-'`. */
  idPrefix?: string;
  /** Extra properties on every drawn feature — typically simplestyle (`stroke`, `fill`). */
  properties?: Record<string, unknown>;
}

const SHAPES: Record<DrawTool, ShapeKind> = { polygon: 'polygon', line: 'line', circle: 'circle' };

export class DrawGeoFeatureBehaviour extends GeoToolBehaviour<DrawGeoFeatureBehaviourOptions> {
  override readonly kind = 'draw-geo-feature';
  private counter = 0;

  constructor(opts: DrawGeoFeatureBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  protected currentTool(): string | null | undefined {
    return this._options.tool;
  }

  protected shapeOf(tool: string): ShapeKind | null {
    return SHAPES[tool as DrawTool] ?? null;
  }

  protected onShape(shape: CollectedShape): void {
    const features = this.features;
    if (!features) return;
    const o = this._options;
    const id = `${o.idPrefix ?? 'feature-'}${Date.now().toString(36)}${(this.counter++).toString(36)}`;
    const properties: Record<string, unknown> = {
      ...o.properties,
      ...(o.author ? { author: o.author } : {}),
      reportedAt: new Date().toISOString(),
      tool: shape.kind,
    };
    let geometry: GeoFeature['geometry'];
    if (shape.kind === 'circle') {
      properties.radiusKm = Math.round(shape.radiusKm! * 1000) / 1000;
      geometry = { type: 'Point', coordinates: shape.points[0]! };
    } else if (shape.kind === 'line') {
      geometry = { type: 'LineString', coordinates: shape.points };
    } else {
      geometry = { type: 'Polygon', coordinates: [[...shape.points, shape.points[0]!]] };
    }
    features.setDraft(null);
    features.addFeature({ type: 'Feature', id, properties, geometry });
    this.notify();
  }
}
