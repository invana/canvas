/**
 * `D3ForceLayout` — d3-force-directed Layout for `@invana/graph`.
 *
 * Architecture: see `architecture-proposal.md` §2.3.
 *
 * Reads nodes + edges from the layer's `GraphStore`, runs a d3-force
 * simulation, writes back positions via `store.setPositionsBulk` per tick.
 * Respects `node.pinned` as d3-force `fx` / `fy` fixed positions at
 * apply-time.
 *
 * Also subscribes to `node:update` so external mutators (e.g. a drag
 * behaviour calling `store.setPosition`) flow into the live sim — the new
 * position is mirrored onto the matching `SimNode` (non-freezing, no
 * `fx`/`fy` lock) and α is re-heated so the cluster physically reacts.
 *
 * Two execution modes:
 *
 * - **Animated (default)**: drives the simulation across `requestAnimationFrame`
 *   ticks, writing positions back after each tick. The `apply()` promise
 *   resolves when `alpha < alphaMin` (the simulation has settled), or on
 *   first settle when `keepAlive: true`.
 * - **Sync (`syncTicks: true`)**: runs the simulation to convergence
 *   synchronously inside `apply()`, writes positions once.
 *
 * @example
 * const layout = new D3ForceLayout({ charge: -400, linkDistance: 100 });
 * await layout.apply(graphLayer);
 * layout.stop();   // cancel an in-flight animated apply
 */

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

import type { Layout } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';

import type { D3ForceLayoutOptions } from './types';

interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
}

const DEFAULTS = {
  charge: -300,
  linkDistance: 80,
  linkStrength: 0.6,
  center: { x: 0, y: 0 } as { x: number; y: number } | null,
  collide: 24 as number | false,
  alpha: 1,
  alphaMin: 0.001,
  alphaDecay: 0.0228,
  velocityDecay: 0.4,
  syncTicks: false,
  keepAlive: false,
  onStart: undefined as (() => void) | undefined,
  onTick: undefined as (() => void) | undefined,
  onEnd: undefined as (() => void) | undefined,
};

export class D3ForceLayout implements Layout<GraphLayer> {
  private readonly opts: typeof DEFAULTS;

  /** Active simulation; null when not running. */
  private sim: Simulation<SimNode, SimLink> | null = null;

  /** Cancel hook for the in-flight RAF loop, if any. */
  private cancelTick: (() => void) | null = null;

  constructor(opts: D3ForceLayoutOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  /**
   * Run the layout against `layer`. Resolves when the simulation settles
   * (alpha < alphaMin) or when `stop()` is called. With `keepAlive: true`
   * resolves at first settle and the loop keeps running until `stop()`.
   */
  async apply(layer: GraphLayer): Promise<void> {
    this.stop();

    const store = layer.store;
    const nodeIds: string[] = [];
    const simNodes: SimNode[] = [];

    for (const n of store.nodes()) {
      const node: SimNode = {
        id: n.id,
        x: n.position?.x ?? (Math.random() - 0.5) * 200,
        y: n.position?.y ?? (Math.random() - 0.5) * 200,
      };
      if (n.pinned && n.position) {
        node.fx = n.position.x;
        node.fy = n.position.y;
      }
      nodeIds.push(n.id);
      simNodes.push(node);
    }

    if (simNodes.length === 0) return;

    const simLinks: SimLink[] = [];
    for (const e of store.edges()) {
      simLinks.push({ id: e.id, source: e.source, target: e.target });
    }

    const sim = forceSimulation<SimNode, SimLink>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(this.opts.linkDistance)
          .strength(this.opts.linkStrength),
      )
      .force('charge', forceManyBody<SimNode>().strength(this.opts.charge))
      .alpha(this.opts.alpha)
      .alphaMin(this.opts.alphaMin)
      .alphaDecay(this.opts.alphaDecay)
      .velocityDecay(this.opts.velocityDecay)
      .stop();

    if (this.opts.center !== null) {
      sim.force('center', forceCenter<SimNode>(this.opts.center.x, this.opts.center.y));
    }
    if (this.opts.collide !== false) {
      sim.force('collide', forceCollide<SimNode>(this.opts.collide));
    }

    this.sim = sim;

    // Set while we're flushing positions back to the store, so the
    // `node:update` subscriber below ignores our own writes — otherwise
    // every tick's bulk write-back would loop back through the bridge as
    // an "external" change.
    let writingBack = false;

    const xy = new Float32Array(simNodes.length * 2);
    const writeBack = (): void => {
      for (let i = 0; i < simNodes.length; i++) {
        xy[i * 2] = simNodes[i]!.x ?? 0;
        xy[i * 2 + 1] = simNodes[i]!.y ?? 0;
      }
      writingBack = true;
      store.batch(() => store.setPositionsBulk(nodeIds, xy));
      writingBack = false;
    };

    // Reactive sync from external store mutations into the running sim.
    // When `DragNodeBehaviour` (or any caller) writes a new position via
    // `store.setPosition`, mirror it onto the matching `SimNode.x` /
    // `SimNode.y` so the next tick computes forces from the up-to-date
    // position. This is *non-freezing* — `fx`/`fy` are left alone, so
    // physics is free to continue moving the node from its new starting
    // point. A short re-heat + cooldown ensures the cluster actually
    // reacts even when the sim was idle (`alpha ≈ 0` with `keepAlive`).
    const nodeIndex = new Map<string, number>();
    for (let i = 0; i < nodeIds.length; i++) nodeIndex.set(nodeIds[i]!, i);

    let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleCooldown = (): void => {
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        this.sim?.alphaTarget(0);
        cooldownTimer = null;
      }, 200);
    };

    const offNodeUpdate = store.events.on('node:update', ({ nodeId, patch }) => {
      if (writingBack || !patch.position) return;
      const idx = nodeIndex.get(nodeId);
      if (idx === undefined) return;
      const sn = simNodes[idx]!;
      sn.x = patch.position.x;
      sn.y = patch.position.y;
      if (this.sim) {
        this.sim.alphaTarget(0.3).restart();
        scheduleCooldown();
      }
    });

    const teardownBridge = (): void => {
      offNodeUpdate();
      if (cooldownTimer) {
        clearTimeout(cooldownTimer);
        cooldownTimer = null;
      }
    };

    const { onStart, onTick, onEnd, syncTicks, keepAlive } = this.opts;

    // Seed the store with initial positions so anything reading
    // `layer.getBounds()` in `onStart` sees what the first tick will see.
    writeBack();
    onStart?.();

    if (syncTicks) {
      sim.tick();
      writeBack();
      onTick?.();
      this.sim = null;
      teardownBridge();
      onEnd?.();
      return;
    }

    return new Promise<void>((resolve) => {
      let stopped = false;
      let endSignalled = false;

      const finish = (): void => {
        this.sim = null;
        this.cancelTick = null;
        teardownBridge();
        if (!endSignalled) {
          endSignalled = true;
          onEnd?.();
          resolve();
        }
      };

      const tick = (): void => {
        if (stopped) return;
        const settled =
          sim.alpha() < sim.alphaMin() && sim.alphaTarget() < sim.alphaMin();

        if (settled && !keepAlive) {
          writeBack();
          onTick?.();
          finish();
          return;
        }
        if (settled) {
          // keepAlive: resolve once at first settle, then idle-spin. Alpha is
          // 0 so a tick would be a noop — skip the tick + write-back to avoid
          // broadcasting "every position unchanged" each frame.
          if (!endSignalled) {
            writeBack();
            onTick?.();
            endSignalled = true;
            onEnd?.();
            resolve();
          }
        } else {
          sim.tick();
          writeBack();
          onTick?.();
        }

        const handle = requestAnimationFrame(tick);
        this.cancelTick = () => {
          stopped = true;
          cancelAnimationFrame(handle);
          finish();
        };
      };
      tick();
    });
  }

  /**
   * Cancel an in-flight `apply()`. Settles the promise with the current
   * positions written back. No-op if nothing is running.
   */
  stop(): void {
    this.cancelTick?.();
    this.cancelTick = null;
    this.sim?.stop();
    this.sim = null;
  }

  /**
   * Re-energise a running or settled simulation — useful when new nodes /
   * edges arrive and you want the existing positions to re-settle. Pass an
   * explicit alpha to override (default `0.3`).
   *
   * No-op if `apply` hasn't been called yet, or if the simulation has
   * already been stopped.
   */
  reheat(alpha = 0.3): void {
    if (!this.sim) return;
    this.sim.alpha(alpha).restart();
  }

}
