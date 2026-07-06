/**
 * `EraseBehaviour` — click a node or edge to delete it from a `GraphLayer`.
 *
 * The "eraser" tool of a drawing toolbar: clicking a node removes it **and**
 * cascades its incident edges; clicking an edge removes just that edge. Like
 * {@link CreateNodeBehaviour} / `DrawEdgeBehaviour` it mutates the store
 * directly and fires a callback — but `onErase` reports the *removed* element
 * with enough captured state (the node + its incident edges, or the edge) to
 * reconstruct it, so a consumer can journal an undoable delete.
 *
 * Hit detection rides the renderer's synchronous `shape:click` /
 * `connector:click` channels — the same ones `ClickSelectBehaviour` uses — so
 * the clicked element's id arrives directly; no world-space hit-testing needed.
 *
 * Default `enabled: false` — register, then explicitly enable (e.g. a "Delete"
 * tool mode toggles it on). Don't run it enabled alongside `ClickSelect` /
 * `DragNode` on the same layer: all three react to a node press, so a tool-mode
 * switch should leave exactly one on.
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { GraphEdge, GraphNode } from '../store/types';

/** Which element kinds the eraser removes. */
export type EraseTargetKind = 'node' | 'edge' | 'both';

/**
 * Payload describing what {@link EraseBehaviour} just removed. Carries the full
 * pre-removal element(s) so a consumer can rebuild them (undo). A removed node
 * carries its cascade-removed incident `edges`.
 */
export type ErasedElement =
  | { kind: 'node'; node: GraphNode; edges: GraphEdge[] }
  | { kind: 'edge'; edge: GraphEdge };

/** Constructor options for `EraseBehaviour`. */
export interface EraseBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour erases from. */
  targetLayerId: string;

  /** Which element kinds a click removes. Default `'both'`. */
  target?: EraseTargetKind;

  /** Fired after an element is removed, with the captured pre-removal state. */
  onErase?: (removed: ErasedElement) => void;
}

export class EraseBehaviour extends Behaviour<EraseBehaviourOptions> {
  private layer: GraphLayer | null = null;

  // Both live-read from `_options` (consulted at click-time) so `setOptions` applies.
  private get target(): EraseTargetKind { return this._options.target ?? 'both'; }
  private get onErase(): ((removed: ErasedElement) => void) | undefined {
    return this._options.onErase;
  }

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  constructor(opts: EraseBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(`EraseBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`);
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`EraseBehaviour "${this.id}": target layer is not mounted.`);
    }

    const onShapeClick = (e: { id: string; button: number }): void => {
      if (!this.isEnabled || e.button !== 0) return;
      if (this.target === 'edge') return;
      this.eraseNode(e.id);
    };
    const onConnClick = (e: { id: string; button: number }): void => {
      if (!this.isEnabled || e.button !== 0) return;
      if (this.target === 'node') return;
      this.eraseEdge(e.id);
    };

    renderer.events.on('shape:click', onShapeClick);
    renderer.events.on('connector:click', onConnClick);
    this.subs.push(
      () => renderer.events.off('shape:click', onShapeClick),
      () => renderer.events.off('connector:click', onConnClick),
    );
  }

  protected override onDestroy(): void {
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  // ─── Removal ──────────────────────────────────────────────────────────────

  /** Capture node + incident edges, cascade-remove, then report. */
  private eraseNode(id: string): void {
    const store = this.layer?.store;
    if (!store) return;
    const node = store.getNode(id);
    if (!node) return;
    const edges = this.incidentEdges(id);
    store.removeNode(id, { cascade: true });
    this.onErase?.({ kind: 'node', node, edges });
  }

  /** Capture the edge, remove it, then report. */
  private eraseEdge(id: string): void {
    const store = this.layer?.store;
    if (!store) return;
    const edge = store.getEdge(id);
    if (!edge) return;
    store.removeEdge(id);
    this.onErase?.({ kind: 'edge', edge });
  }

  /** Cloned incident edges (both directions), deduped — self-loops appear once. */
  private incidentEdges(nodeId: string): GraphEdge[] {
    const store = this.layer!.store;
    const seen = new Set<string>();
    const out: GraphEdge[] = [];
    for (const edge of store.edgesOf(nodeId, 'both')) {
      if (seen.has(edge.id)) continue;
      seen.add(edge.id);
      out.push(edge);
    }
    return out;
  }
}
