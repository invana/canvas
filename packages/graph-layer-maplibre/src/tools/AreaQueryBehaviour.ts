/**
 * `AreaQueryBehaviour` — "which of these were inside that area?" Ask it for the
 * nodes of a graph layer that are inside a feature, within N km of a feature, of a
 * point, or of a route, and it selects them.
 *
 * - **A node is where its position is.** Positions are world units, converted to
 *   longitude / latitude; a node's drawn size is not consulted, so the answer does
 *   not change with zoom. (Positions are `Float32`: a node a few metres from a
 *   boundary may land on either side.)
 * - **Distances are geodesic** (the sphere), never world units.
 * - **Selection goes through `ClickSelectBehaviour`**, found by the explicit
 *   `clickSelectId`, as `LassoSelectBehaviour` does — selection stays that
 *   behaviour's. Without one the nodes get the `selected` state.
 * - **`autoQuery`** (off by default) re-selects whenever a feature is added or
 *   changed on the features layer — so drawing a polygon selects what is in it.
 *
 * `query` only reads and works any time; `select` changes the selection and needs
 * the behaviour enabled. The graph layer is typed structurally (a store with
 * `nodes()` and `setNodeState`), so this package needs no dependency on
 * `@invana/graph`.
 *
 * ```ts
 * const q = new AreaQueryBehaviour({ id: 'query', targetLayerId: 'graph', featuresLayerId: 'geo', clickSelectId: 'select' });
 * q.select({ featureId: 'zone-1', km: 5 }); // inside zone-1 or within 5 km of it
 * q.select({ point: [78.49, 17.38], km: 25 });
 * q.select({ line: route, km: 2 });
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import type { GeoFeaturesLayer } from '../features/GeoFeaturesLayer';
import type { GeoGeometry, Position } from '../features/types';
import { createMatcher } from '../geo/query';
import { unprojectWorld } from '../mercator';

/** What to ask for. `km` widens "inside" to "or within this far of it". */
export type AreaQuery =
  | { featureId: string | number; km?: number }
  | { point: Position; km: number }
  | { line: readonly Position[]; km: number };

/** The slice of a `GraphLayer` this behaviour uses. */
interface QueriedLayer {
  store: {
    nodes(): Iterable<{ id: string; position?: { x: number; y: number } }>;
    setNodeState(id: string, name: string, on?: boolean): void;
  };
}

/** The slice of `ClickSelectBehaviour` this behaviour uses. */
interface Selector {
  selectMultiple(elements: Array<{ id: string; type?: 'shape' | 'connector' }>): void;
}

/** Options for {@link AreaQueryBehaviour}. */
export interface AreaQueryBehaviourOptions extends BehaviourOptions {
  /** Required — id of the `GraphLayer` whose nodes are queried. */
  targetLayerId: string;
  /** Required — id of the `GeoFeaturesLayer` that holds the features a query names. */
  featuresLayerId: string;
  /** Id of the `ClickSelectBehaviour` the result is selected through. Without one nodes get the `selected` state. */
  clickSelectId?: string;
  /** Re-select on every feature added or changed. Default `false`. */
  autoQuery?: boolean;
  /** The `km` used by `autoQuery`: `0` selects what is inside, more adds what is near. Default `0`. */
  withinKm?: number;
}

export class AreaQueryBehaviour extends Behaviour<AreaQueryBehaviourOptions> {
  override readonly kind = 'area-query';

  private layer: QueriedLayer | null = null;
  private features: GeoFeaturesLayer | null = null;
  private off: (() => void) | null = null;

  constructor(opts: AreaQueryBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  /**
   * The ids of the nodes that match, without selecting them. Empty for an unknown
   * feature id. A line or point query needs `km > 0` (a line has no inside).
   */
  query(q: AreaQuery): string[] {
    const layer = this.layer;
    if (!layer) return [];
    const matcher = this.matcherFor(q);
    if (!matcher) return [];
    const ids: string[] = [];
    for (const node of layer.store.nodes()) {
      const at = node.position;
      if (!at) continue;
      if (matcher(unprojectWorld(at))) ids.push(node.id);
    }
    return ids;
  }

  /**
   * Select the nodes that match, **replacing** the selection, and return their ids.
   * Does nothing (returns `[]`) while the behaviour is disabled.
   */
  select(q: AreaQuery): string[] {
    if (!this._enabled || !this.layer) return [];
    const ids = this.query(q);
    const selector: unknown = this.clickSelectId ? this.ctx?.behaviours.get(this.clickSelectId) : undefined;
    if (selector && typeof (selector as Selector).selectMultiple === 'function') {
      (selector as Selector).selectMultiple(ids.map((id) => ({ id, type: 'shape' as const })));
    } else {
      for (const id of ids) this.layer.store.setNodeState(id, 'selected', true);
    }
    return ids;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get(this._options.targetLayerId) as unknown as QueriedLayer | undefined;
    const features = ctx.layers.get<GeoFeaturesLayer>(this._options.featuresLayerId);
    if (!layer) throw new Error(`AreaQueryBehaviour "${this.id}": layer "${this._options.targetLayerId}" not found. Add the GraphLayer first.`);
    if (!features) throw new Error(`AreaQueryBehaviour "${this.id}": features layer "${this._options.featuresLayerId}" not found. Add the GeoFeaturesLayer first.`);
    this.layer = layer;
    this.features = features;
    this.off = features.events.on('feature:change', ({ kind, id }) => {
      if (!this._options.autoQuery || !this._enabled || id === null) return;
      if (kind === 'add' || kind === 'update') this.select({ featureId: id, km: this._options.withinKm ?? 0 });
    });
  }

  protected override onDestroy(): void {
    this.off?.();
    this.off = null;
    this.layer = null;
    this.features = null;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private get clickSelectId(): string | undefined {
    return this._options.clickSelectId;
  }

  private matcherFor(q: AreaQuery): ((p: Position) => boolean) | null {
    if ('featureId' in q) {
      const feature = this.features?.getFeature(q.featureId);
      if (!feature) return null;
      const radius = feature.properties?.radiusKm;
      return createMatcher(feature.geometry, q.km ?? 0, typeof radius === 'number' ? radius : 0);
    }
    const geometry: GeoGeometry =
      'point' in q ? { type: 'Point', coordinates: q.point } : { type: 'LineString', coordinates: q.line };
    return createMatcher(geometry, q.km);
  }
}
