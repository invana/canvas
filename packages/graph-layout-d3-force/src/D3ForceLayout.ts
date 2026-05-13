/**
 * `D3ForceLayout` — d3-force-directed Layout for `@invana/graph`.
 *
 * Architecture: see `architecture-proposal.md` §2.3.
 *
 * Reads nodes + edges from the layer's `GraphStore`, runs a d3-force
 * simulation, writes back positions via `store.setPositionsBulk` per tick.
 * Respects `node.pinned` as d3-force `fx` / `fy` fixed positions.
 *
 * Two execution modes:
 *
 * - **Animated (default)**: drives the simulation across `requestAnimationFrame`
 *   ticks, writing positions back after each tick. The `apply()` promise
 *   resolves when `alpha < alphaMin` (the simulation has settled).
 * - **Sync (`syncTicks: true`)**: runs the simulation to convergence
 *   synchronously inside `apply()`, writes positions once.
 *
 * @example
 * const layout = new D3ForceLayout({ charge: -400, linkDistance: 100 });
 * await layout.apply(graphLayer);   // returns when settled
 *
 * // To rerun after data change:
 * await layout.apply(graphLayer);
 *
 * // Cancel an in-flight animated apply:
 * layout.stop();
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

const DEFAULTS: Required<
  Omit<D3ForceLayoutOptions, 'center' | 'collide' | 'onStart' | 'onTick' | 'onEnd'>
> & {
  center: { x: number; y: number };
  collide: number;
  onStart: (() => void) | undefined;
  onTick: (() => void) | undefined;
  onEnd: (() => void) | undefined;
} = {
  charge: -300,
  linkDistance: 80,
  linkStrength: 0.6,
  center: { x: 0, y: 0 },
  collide: 24,
  alpha: 1,
  alphaMin: 0.001,
  alphaDecay: 0.0228,
  velocityDecay: 0.4,
  syncTicks: false,
  onStart: undefined,
  onTick: undefined,
  onEnd: undefined,
};

const hasRAF =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame === 'function';

export class D3ForceLayout implements Layout<GraphLayer> {
  private readonly opts: typeof DEFAULTS;

  /** Active simulation; null when not running. */
  private sim: Simulation<SimNode, SimLink> | null = null;

  /** Cancel hook for the in-flight RAF loop, if any. */
  private cancelTick: (() => void) | null = null;

  constructor(opts: D3ForceLayoutOptions = {}) {
    this.opts = {
      ...DEFAULTS,
      ...opts,
      center: opts.center === null ? DEFAULTS.center : (opts.center ?? DEFAULTS.center),
      collide: opts.collide === false ? 0 : (opts.collide ?? DEFAULTS.collide),
    };
    // Stash the resolved center=null choice for build-time decision.
    if (opts.center === null) this._noCenter = true;
    if (opts.collide === false) this._noCollide = true;
  }

  private _noCenter = false;
  private _noCollide = false;

  /**
   * Run the layout against `layer`. Resolves when the simulation settles
   * (alpha < alphaMin) or when `stop()` is called.
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

    const simLinks: SimLink[] = [];
    for (const e of store.edges()) {
      simLinks.push({ id: e.id, source: e.source, target: e.target });
    }

    if (simNodes.length === 0) return;

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

    if (!this._noCenter) {
      sim.force('center', forceCenter<SimNode>(this.opts.center.x, this.opts.center.y));
    }
    if (!this._noCollide) {
      sim.force('collide', forceCollide<SimNode>(this.opts.collide));
    }

    this.sim = sim;

    // O(1) sim-node lookup for the store subscription below.
    const nodeIndex = new Map<string, number>();
    for (let i = 0; i < nodeIds.length; i++) nodeIndex.set(nodeIds[i]!, i);

    // Set while we're flushing positions back to the store, so the subscription
    // below can ignore the resulting `node:update` events. Without this guard
    // we'd treat our own write-back as an "external" change every frame.
    let writingBack = false;

    const xy = new Float32Array(simNodes.length * 2);
    const writeBack = () => {
      for (let i = 0; i < simNodes.length; i++) {
        xy[i * 2] = simNodes[i]!.x ?? 0;
        xy[i * 2 + 1] = simNodes[i]!.y ?? 0;
      }
      writingBack = true;
      store.batch(() => {
        store.setPositionsBulk(nodeIds, xy);
      });
      writingBack = false;
    };

    // Reactive bridge from the store to the running simulation. When an
    // external mutator (e.g. `DragNodeBehaviour`) writes a new position or
    // toggles `pinned`, the change lands here *immediately* — no per-frame
    // polling — and we mirror it onto the matching `SimNode` so the next
    // tick respects the user input. We also re-heat the simulation via
    // `alphaTarget(0.3)` so the rest of the graph reacts to the drag, then
    // schedule a cooldown so it eventually settles after the user lets go.
    let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleCooldown = (): void => {
      if (cooldownTimer) clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(() => {
        this.sim?.alphaTarget(0);
        cooldownTimer = null;
      }, 200);
    };

    const offNodeUpdate = store.events.on('node:update', ({ nodeId, patch }) => {
      if (writingBack) return;
      const idx = nodeIndex.get(nodeId);
      if (idx === undefined) return;
      const sn = simNodes[idx]!;

      let touched = false;
      if (patch.position) {
        sn.x = patch.position.x;
        sn.y = patch.position.y;
        // If the node is currently pinned in the sim, keep its lock in sync
        // with the new position — otherwise the next tick would snap it back
        // to the old fx/fy.
        if (sn.fx !== undefined) sn.fx = patch.position.x;
        if (sn.fy !== undefined) sn.fy = patch.position.y;
        touched = true;
      }
      if (patch.pinned !== undefined) {
        if (patch.pinned) {
          const stored = store.getNode(nodeId);
          const px = stored?.position?.x ?? sn.x ?? 0;
          const py = stored?.position?.y ?? sn.y ?? 0;
          sn.fx = px;
          sn.fy = py;
          sn.x = px;
          sn.y = py;
        } else {
          sn.fx = undefined;
          sn.fy = undefined;
        }
        touched = true;
      }

      if (touched && this.sim) {
        this.sim.alphaTarget(0.3).restart();
        scheduleCooldown();
      }
    });

    const fireStart = (): void => {
      try {
        this.opts.onStart?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[D3ForceLayout] onStart threw:', err);
      }
    };
    const fireTick = (): void => {
      try {
        this.opts.onTick?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[D3ForceLayout] onTick threw:', err);
      }
    };
    const fireEnd = (): void => {
      try {
        this.opts.onEnd?.();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[D3ForceLayout] onEnd threw:', err);
      }
    };

    // Write the initial scatter to the store so any `onStart` consumer that
    // reads `layer.getBounds()` sees the same positions the first tick will.
    writeBack();
    fireStart();

    if (this.opts.syncTicks) {
      // d3-force computes `numTicks = ceil(log(alphaMin) / log(1 - alphaDecay))`
      // ticks to settle when called with no argument.
      sim.tick();
      writeBack();
      fireTick();
      this.sim = null;
      offNodeUpdate();
      if (cooldownTimer) clearTimeout(cooldownTimer);
      fireEnd();
      return;
    }

    const teardown = (): void => {
      offNodeUpdate();
      if (cooldownTimer) {
        clearTimeout(cooldownTimer);
        cooldownTimer = null;
      }
    };

    return new Promise<void>((resolve) => {
      let stopped = false;
      const tick = (): void => {
        if (stopped) return;
        // Settle condition — but only when there's no active drag-cooldown
        // keeping the simulation hot. Without this guard, a drag right at the
        // settle boundary would exit the loop before the reheat takes effect.
        if (sim.alpha() < sim.alphaMin() && sim.alphaTarget() < sim.alphaMin()) {
          writeBack();
          fireTick();
          this.sim = null;
          this.cancelTick = null;
          teardown();
          fireEnd();
          resolve();
          return;
        }
        sim.tick();
        writeBack();
        fireTick();
        if (hasRAF) {
          const handle = (
            globalThis as { requestAnimationFrame: (cb: () => void) => number }
          ).requestAnimationFrame(tick);
          this.cancelTick = () => {
            stopped = true;
            (
              globalThis as { cancelAnimationFrame?: (h: number) => void }
            ).cancelAnimationFrame?.(handle);
            this.sim = null;
            teardown();
            fireEnd();
            resolve();
          };
        } else {
          // Test / node fallback — schedule via microtask so the loop
          // doesn't starve the event queue.
          queueMicrotask(tick);
          this.cancelTick = () => {
            stopped = true;
            this.sim = null;
            teardown();
            fireEnd();
            resolve();
          };
        }
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
