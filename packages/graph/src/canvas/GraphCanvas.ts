/**
 * `GraphCanvas` — the graph-domain entry point. Register layers/behaviours
 * imperatively (their classes live in code, not config); drive their visual
 * options through the serialisable `update()` / `get()` config inherited from
 * `Canvas`. `GraphCanvas` adds graph-flavoured typed lookups, the graph
 * commands, and per-`GraphLayer` edit state — a `GraphHistory` (node drags
 * journalled) and a `GraphClipboard` — so undo and the clipboard work with no
 * UI provider (`graphHistory(id)` / `clipboard(id)`).
 *
 * @example
 * ```ts
 * const gc = new GraphCanvas();
 * await gc.init({ container: el });
 *
 * // register instances imperatively:
 * gc.layers.add(new BackgroundLayer({ id: 'bg' }));
 * gc.layers.add(new GraphLayer({ id: 'graph', options: { node: { style: { bgFill: tint } } } }));
 * gc.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
 *
 * const graph = gc.layer('graph')!;        // typed as GraphLayer
 * graph.setData({ nodes, edges });
 *
 * // serialisable config — drives a settings UI / save-load:
 * gc.update({ layers: { bg: { patternType: 'grid', color: 0x334155 } } });
 * ```
 */

import { Canvas } from '@invana/canvas';
import type { Behaviour, CanvasConfig, CanvasOptions, Layer, Layout } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import { GraphHistory } from '../history/GraphHistory';
import type { HistoryOp } from '../history/types';
import { GraphLayer } from '../layer/GraphLayer';
import type { Vec2 } from '../store';
import { registerGraphCommands } from './graphCommands';

/** Construction options for {@link GraphCanvas}: the engine's, plus the graph edit state. */
export interface GraphCanvasOptions extends CanvasOptions {
  /**
   * Undo for graph edits: every `GraphLayer` gets a `GraphHistory`, and node
   * drags are journalled on it (one entry per gesture). `limit` caps the undo
   * depth (default `100`). `false` opts out — no history and no drag capture;
   * `history.undo` then covers `canvas.history` alone.
   */
  history?: false | { limit?: number };
  /** Every `GraphLayer` gets a `GraphClipboard`; `pasteOffset` shifts pasted nodes (default `{ x: 24, y: 24 }`). */
  clipboard?: { pasteOffset?: Vec2 };
}

/** What `GraphCanvas` keeps per `GraphLayer`. */
interface GraphLayerEditState {
  /** `null` when the canvas was built with `history: false`. */
  history: GraphHistory | null;
  clipboard: GraphClipboard;
  /** Drops every bridge / listener set up for the layer. */
  dispose: () => void;
}

/**
 * Journal node drags on `history` as one "move" entry per gesture: every dragged
 * primary (a multi-selection drag moves them all) plus each one's descendants
 * (group drag) is snapshot at drag-start, and the net change is pushed at
 * drag-end. Nothing per frame, so layout-sim writes and programmatic moves stay
 * out of history. `GraphCanvas` does this for every graph layer's own history;
 * exported for a history built elsewhere. Returns the unsubscribe.
 */
export function captureNodeDrags(layer: GraphLayer, history: GraphHistory): () => void {
  const store = layer.store;
  let before: Map<string, Vec2> | null = null;
  const offStart = layer.events.on('node:drag-start', ({ nodeId, nodeIds }) => {
    const ids = new Set<string>();
    for (const primary of nodeIds ?? [nodeId]) {
      ids.add(primary);
      for (const desc of store.descendantsOf(primary)) ids.add(desc);
    }
    before = new Map();
    for (const id of ids) {
      const p = store.getPosition(id);
      if (p) before.set(id, { x: p.x, y: p.y });
    }
  });
  const offEnd = layer.events.on('node:drag-end', () => {
    const snap = before;
    before = null;
    if (!snap) return;
    const ops: HistoryOp[] = [];
    for (const [id, from] of snap) {
      const to = store.getPosition(id);
      if (to && (to.x !== from.x || to.y !== from.y)) {
        ops.push({ kind: 'moveNode', id, before: from, after: { x: to.x, y: to.y } });
      }
    }
    if (ops.length > 0) history.push({ ops, label: 'move' });
  });
  return () => {
    offStart();
    offEnd();
  };
}

export class GraphCanvas extends Canvas {
  private offActiveLayout: (() => void) | null = null;
  /** Per graph layer id, its history / clipboard and bridges (see the constructor). */
  private readonly editState = new Map<string, GraphLayerEditState>();
  private readonly historyOptions: false | { limit?: number };
  private readonly clipboardOptions: { pasteOffset?: Vec2 };

  /**
   * Adds the graph commands (`select.mode`, `graph.edgeType`, `graph.clear`,
   * `history.*`, `clipboard.*`, …) to `commands`, and gives every `GraphLayer`
   * — on `scene:layer:add`, disposed on remove / destroy — its own:
   *
   * - **`GraphHistory`** ({@link graphHistory}) with node drags journalled on it,
   *   unless `opts.history` is `false`;
   * - **`GraphClipboard`** ({@link clipboard});
   * - **command-state bridges** to `commands.invalidate()`: the history's and the
   *   clipboard's `change`, and the layer's edge-template changes (`style:changed`,
   *   scope `edge`). None of that state is in the view store, and each has
   *   several writers, so bound controls follow all of them.
   */
  constructor(opts: GraphCanvasOptions = {}) {
    super(opts);
    this.historyOptions = opts.history ?? {};
    this.clipboardOptions = opts.clipboard ?? {};
    registerGraphCommands(this.commands, {
      history: (layerId) => this.graphHistory(layerId),
      clipboard: (layerId) => this.clipboard(layerId),
    });
    this.events.on('scene:layer:add', ({ id }) => {
      this.disposeEditState(id);
      const layer = this.layers.get(id);
      if (layer instanceof GraphLayer) this.editState.set(id, this.createEditState(layer));
    });
    this.events.on('scene:layer:remove', ({ id }) => this.disposeEditState(id));
  }

  /**
   * The `GraphHistory` journalling graph layer `layerId`'s store, or `null` —
   * no such `GraphLayer`, or the canvas was built with `history: false`. The
   * `history.*`, `clipboard.*`, `graph.clear` and `graph.erase` commands, and
   * canvas-react's history hooks, use it. A layer removed and re-added gets a
   * fresh one.
   */
  graphHistory(layerId = 'graph'): GraphHistory | null {
    return this.editState.get(layerId)?.history ?? null;
  }

  /**
   * The `GraphClipboard` over graph layer `layerId`'s store, or `null` when
   * there is no such `GraphLayer`. The `clipboard.*` commands and canvas-react's
   * `useClipboard` use it.
   */
  clipboard(layerId = 'graph'): GraphClipboard | null {
    return this.editState.get(layerId)?.clipboard ?? null;
  }

  /** Typed layer lookup; defaults to `GraphLayer`. */
  layer<T extends Layer = GraphLayer>(id: string): T | undefined {
    return this.layers.get<T>(id);
  }

  /** Typed behaviour lookup. */
  behaviour<T extends Behaviour = Behaviour>(id: string): T | undefined {
    return this.behaviours.get<T>(id);
  }

  /** Typed layout lookup. */
  layout<T extends Layout = Layout>(id: string): T | undefined {
    return this.layouts.get<T>(id);
  }

  override async init(opts: CanvasOptions): Promise<void> {
    await super.init(opts);
    this.wireActiveLayout();
  }

  override update(patch: CanvasConfig, action?: string): void {
    super.update(patch, action);
    if (patch.activeLayout !== undefined) this.wireActiveLayout();
  }

  override destroy(): void {
    this.offActiveLayout?.();
    this.offActiveLayout = null;
    for (const id of [...this.editState.keys()]) this.disposeEditState(id);
    super.destroy();
  }

  /** Build `layer`'s history / clipboard and bridge their state to bound controls. */
  private createEditState(layer: GraphLayer): GraphLayerEditState {
    const invalidate = () => this.commands.invalidate();
    const history =
      this.historyOptions === false
        ? null
        : new GraphHistory(layer.store, this.historyOptions.limit !== undefined ? { limit: this.historyOptions.limit } : {});
    const clipboard = new GraphClipboard(
      layer.store,
      this.clipboardOptions.pasteOffset ? { pasteOffset: this.clipboardOptions.pasteOffset } : {},
    );
    const offs = [
      clipboard.events.on('change', invalidate),
      layer.events.on('style:changed', ({ scope }) => {
        if (scope === 'edge') invalidate();
      }),
    ];
    if (history) offs.push(history.events.on('change', invalidate), captureNodeDrags(layer, history));
    return {
      history,
      clipboard,
      dispose: () => {
        for (const off of offs) off();
        history?.clear();
      },
    };
  }

  private disposeEditState(id: string): void {
    const state = this.editState.get(id);
    if (!state) return;
    this.editState.delete(id);
    state.dispose();
  }

  /**
   * Auto-run the active layout (`config.activeLayout`) against its target
   * layer, now if it already has data and again whenever the target's topology
   * changes (nodes added / removed). Position-only updates (drags, the sim's
   * own writes) don't re-trigger it, so there's no loop.
   */
  private wireActiveLayout(): void {
    this.offActiveLayout?.();
    this.offActiveLayout = null;

    const activeId = this.get().activeLayout;
    const targetId = activeId ? this.layouts.get(activeId)?.targetLayerId : undefined;
    const layer = targetId ? this.layers.get<GraphLayer>(targetId) : undefined;
    if (!activeId || !layer) return;

    if (layer.store.nodeCount() > 0) void this.runLayout(activeId);
    this.offActiveLayout = layer.events.on('data:changed', (e) => {
      if (e.addedNodes > 0 || e.removedNodes > 0) void this.runLayout(activeId);
    });
  }
}
