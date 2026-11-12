/**
 * `ZoomStateBehaviour` — level of detail as **state**: while the camera is inside
 * a zoom band, every node (and/or edge) of the layer carries one runtime state;
 * outside it, none does. What that state *changes* is the style catalogue's job,
 * so any style can follow the zoom — a longer label, a label that only appears
 * up close, a thicker stroke, a badge.
 *
 * - **Text that grows with zoom.** A node reads `MO-12` at overview and
 *   `MO-12 · Create a model` up close: base `labelText: 'MO-12'`, and
 *   `state: { detail: { labelText: 'MO-12 · Create a model' } }`.
 * - **Labels only up close.** No base `labelText`, and the label in the state's
 *   overlay.
 *
 * The content-LOD behaviours (`NodeLabelLODBehaviour`, …) only show or hide one
 * kind of content; this one swaps any style, per element, through the same
 * overlay catalogue as `hovered` or `selected` (the layer's `node.state[name]` /
 * `edge.state[name]`, or an element's own `state[name]`). States compose in the
 * order they were set, so a hover or a focus overlay still applies on top.
 *
 * Written as runtime states through `store.internal`, so they are never recorded
 * — undo never replays a zoom. The sweep runs only when the camera **crosses**
 * the band (RAF-coalesced), or for elements a data change added; disabling
 * clears every state it wrote.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ZoomStateBehaviour({
 *     id: 'detail',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     minZoom: 0.9,     // up close …
 *     state: 'detail',  // … every node carries `detail`
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { ZoomBand } from './ContentLODBehaviour';

/** Constructor options for {@link ZoomStateBehaviour}. */
export interface ZoomStateBehaviourOptions extends BehaviourOptions, ZoomBand {
  /** Required — the `GraphLayer` id whose elements carry the state. */
  targetLayerId: string;
  /** The runtime state written inside the band. Default `'zoomed-in'`. */
  state?: string;
  /** Which elements carry it. Default `'nodes'`. */
  target?: 'nodes' | 'edges' | 'both';
}

/** Is `scale` inside the band? An unset bound is unbounded on that side. */
function inBand(scale: number, band: ZoomBand): boolean {
  return (
    (band.minZoom == null || scale >= band.minZoom) &&
    (band.maxZoom == null || scale <= band.maxZoom)
  );
}

export class ZoomStateBehaviour extends Behaviour<ZoomStateBehaviourOptions> {
  override readonly kind = 'zoom-state';

  private layer: GraphLayer | null = null;
  private readonly subs: Array<() => void> = [];
  /** The state name last written and where — so a renamed state still clears the old one. */
  private written: { state: string; nodes: boolean; edges: boolean } | null = null;
  /** Band membership last applied; `undefined` = never applied. */
  private applied: boolean | undefined;
  private rafHandle: number | null = null;
  private pendingFull = false;

  constructor(opts: ZoomStateBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  /** The state name in force. */
  get stateName(): string {
    return this._options.state ?? 'zoomed-in';
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ZoomStateBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this.subs.push(
      ctx.events.on('input:camera:zoom', () => this.schedule(false)),
      layer.events.on('data:changed', (e) => {
        if (e.addedNodes > 0 || e.addedEdges > 0) this.schedule(true);
      }),
    );
    if (this._enabled) this.schedule(true);
  }

  protected override onEnable(): void {
    this.applied = undefined;
    this.schedule(true);
  }

  protected override onDisable(): void {
    this.cancel();
    this.clear();
    this.applied = undefined;
  }

  protected override onOptionsChanged(): void {
    this.applied = undefined;
    if (this._enabled) {
      this.clear();
      this.schedule(true);
    }
  }

  protected override onDestroy(): void {
    this.cancel();
    this.clear();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  // ─── Scheduling ─────────────────────────────────────────────────────────

  private schedule(full: boolean): void {
    if (!this._enabled) return;
    if (full) this.pendingFull = true;
    if (this.rafHandle !== null) return;
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
    const run = (): void => {
      this.rafHandle = null;
      const full2 = this.pendingFull;
      this.pendingFull = false;
      this.apply(full2);
    };
    this.rafHandle = raf ? raf(run) : (setTimeout(run, 0) as unknown as number);
  }

  private cancel(): void {
    if (this.rafHandle === null) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.rafHandle);
    else clearTimeout(this.rafHandle);
    this.rafHandle = null;
    this.pendingFull = false;
  }

  // ─── Apply ──────────────────────────────────────────────────────────────

  /** Reconcile the state to the camera: on a band crossing, or for every element when `full`. */
  private apply(full: boolean): void {
    const scale = this.ctx?.camera.scale;
    if (!this.layer || scale === undefined) return;
    const on = inBand(scale, this._options);
    if (!full && this.applied === on) return;
    this.applied = on;
    this.write(on);
  }

  /** Set (or clear) the state on every targeted element, in one store batch. */
  private write(on: boolean): void {
    const store = this.layer?.store;
    if (!store) return;
    const target = this._options.target ?? 'nodes';
    const nodes = target !== 'edges';
    const edges = target !== 'nodes';
    const state = this.stateName;
    store.batch(() => {
      if (nodes) for (const n of store.nodes()) store.internal.setNodeState(n.id, state, on);
      if (edges) for (const e of store.edges()) store.internal.setEdgeState(e.id, state, on);
    });
    this.written = on ? { state, nodes, edges } : null;
  }

  /** Remove whatever this behaviour last wrote. */
  private clear(): void {
    const store = this.layer?.store;
    const w = this.written;
    this.written = null;
    if (!store || !w) return;
    store.batch(() => {
      if (w.nodes) for (const n of store.nodes()) store.internal.setNodeState(n.id, w.state, false);
      if (w.edges) for (const e of store.edges()) store.internal.setEdgeState(e.id, w.state, false);
    });
  }
}
