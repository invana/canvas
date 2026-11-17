/**
 * `GeoPositionBehaviour` — "I'm at this longitude / latitude" as **data**. Nodes
 * whose `data.lng` and `data.lat` are numbers are projected to canvas world
 * coordinates (`projectLngLat`) on load and whenever the layer's data changes, so
 * a story or an app no longer projects in code.
 *
 * Only positions are written, through `store.internal.setPositionsBulk` (the same
 * unrecorded bulk path layouts use) — never the node's `.data`, which is the
 * user's. A node without both numbers is left where it is.
 *
 * The target layer is typed structurally (a store with `nodes()` and
 * `internal.setPositionsBulk`, and a `data:changed` event), so this package
 * needs no dependency on `@invana/graph`. Default `enabled: false`.
 *
 * Note: node positions are `Float32`, so near 512-unit mercator coordinates the
 * resolution is ~3e-5 world units — sub-pixel up to map zoom ~13, a pixel or two
 * at zoom 17. A feed that needs finer than that belongs on `GeoFeaturesLayer`.
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { projectLngLat } from './mercator';

/** The slice of a `GraphLayer` this behaviour uses. */
interface PositionedLayer {
  store: {
    nodes(): Iterable<{ id: string; position?: { x: number; y: number }; data?: unknown }>;
    internal: { setPositionsBulk(ids: readonly string[], xy: Float32Array): void };
  };
  events: { on(type: 'data:changed', cb: () => void): () => void };
}

/** Constructor options for {@link GeoPositionBehaviour}. */
export interface GeoPositionBehaviourOptions extends BehaviourOptions {
  /** Required — id of the `GraphLayer` whose nodes are positioned. */
  targetLayerId: string;
  /** Dotted path of the longitude on the record. Default `'data.lng'`. */
  lngPath?: string;
  /** Dotted path of the latitude on the record. Default `'data.lat'`. */
  latPath?: string;
}

const read = (node: unknown, path: string): unknown => {
  let v: unknown = node;
  for (const key of path.split('.')) {
    if (v === null || typeof v !== 'object') return undefined;
    v = (v as Record<string, unknown>)[key];
  }
  return v;
};

export class GeoPositionBehaviour extends Behaviour<GeoPositionBehaviourOptions> {
  override readonly kind = 'geo-position';

  private layer: PositionedLayer | null = null;
  private off: (() => void) | null = null;

  constructor(opts: GeoPositionBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  /**
   * Project every node that has a longitude and latitude. Returns how many were
   * moved. Called on load and on `data:changed`; callable directly after an edit
   * that does not fire it.
   */
  apply(): number {
    const layer = this.layer;
    if (!layer || !this._enabled) return 0;
    const lngPath = this._options.lngPath ?? 'data.lng';
    const latPath = this._options.latPath ?? 'data.lat';
    const ids: string[] = [];
    const xy: number[] = [];
    for (const node of layer.store.nodes()) {
      const lng = read(node, lngPath);
      const lat = read(node, latPath);
      if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      const p = projectLngLat([lng, lat]);
      const at = node.position;
      // Skip what is already there, so the write this makes does not wake anything for nothing.
      if (at && Math.fround(p.x) === Math.fround(at.x) && Math.fround(p.y) === Math.fround(at.y)) continue;
      ids.push(node.id);
      xy.push(p.x, p.y);
    }
    if (ids.length > 0) layer.store.internal.setPositionsBulk(ids, Float32Array.from(xy));
    return ids.length;
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get(this.targetLayerId!) as unknown as PositionedLayer | undefined;
    if (!layer) {
      throw new Error(
        `GeoPositionBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this.off = layer.events.on('data:changed', () => this.apply());
  }

  protected override onEnable(): void {
    this.apply();
  }

  protected override onOptionsChanged(): void {
    this.apply();
  }

  protected override onDestroy(): void {
    this.off?.();
    this.off = null;
    this.layer = null;
  }
}
