/**
 * `GraphCanvas` — the graph-domain entry point. Register layers/behaviours
 * imperatively (their classes live in code, not config); drive their visual
 * options through the serialisable `update()` / `get()` config inherited from
 * `Canvas`. `GraphCanvas` adds graph-flavoured typed lookups, the graph
 * commands, and a `GraphClipboard` per `GraphLayer` (`clipboard(id)`), so the
 * clipboard works with no UI provider. Undo is the canvas's own
 * `canvas.history`: every `GraphLayer`'s store records into it.
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
import type { Behaviour, CanvasConfig, CanvasOptions, CommandRegistry, Layer, Layout } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import { GraphLayer } from '../layer/GraphLayer';
import type { Vec2 } from '../store';
import { registerGraphCommands, type GraphCanvasCommandMap } from './graphCommands';

/** Construction options for {@link GraphCanvas}: the engine's, plus the clipboard. */
export interface GraphCanvasOptions extends CanvasOptions {
  /** Every `GraphLayer` gets a `GraphClipboard`; `pasteOffset` shifts pasted nodes (default `{ x: 24, y: 24 }`). */
  clipboard?: { pasteOffset?: Vec2 };
}

/** What `GraphCanvas` keeps per `GraphLayer`. */
interface GraphLayerEditState {
  clipboard: GraphClipboard;
  /** Drops every bridge / listener set up for the layer. */
  dispose: () => void;
}

export class GraphCanvas extends Canvas {
  /**
   * The engine's commands plus the graph's (`select.mode`, `graph.*`,
   * `clipboard.*`, `tool.*`), typed with
   * {@link GraphCanvasCommandMap}. Type-only redeclaration — same instance.
   */
  declare readonly commands: CommandRegistry<Canvas, GraphCanvasCommandMap>;
  private offActiveLayout: (() => void) | null = null;
  /** Per graph layer id, its clipboard and bridges (see the constructor). */
  private readonly editState = new Map<string, GraphLayerEditState>();
  private readonly clipboardOptions: { pasteOffset?: Vec2 };

  /**
   * Adds the graph commands (`select.mode`, `graph.edgeType`, `graph.clear`,
   * `clipboard.*`, …) to `commands`, and gives every `GraphLayer` — on
   * `scene:layer:add`, disposed on remove / destroy — its own:
   *
   * - **`GraphClipboard`** ({@link clipboard});
   * - **command-state bridges** to `commands.invalidate()`: the clipboard's
   *   `change`, and the layer's edge-template changes (`style:changed`, scope
   *   `edge`). Neither is in the view store, so bound controls follow both.
   */
  constructor(opts: GraphCanvasOptions = {}) {
    super(opts);
    this.clipboardOptions = opts.clipboard ?? {};
    registerGraphCommands(this.commands, { clipboard: (layerId) => this.clipboard(layerId) });
    this.events.on('scene:layer:add', ({ id }) => {
      this.disposeEditState(id);
      const layer = this.layers.get(id);
      if (layer instanceof GraphLayer) this.editState.set(id, this.createEditState(layer));
    });
    this.events.on('scene:layer:remove', ({ id }) => this.disposeEditState(id));
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

  /** Build `layer`'s clipboard and bridge its state to bound controls. */
  private createEditState(layer: GraphLayer): GraphLayerEditState {
    const invalidate = () => this.commands.invalidate();
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
    return {
      clipboard,
      dispose: () => {
        for (const off of offs) off();
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
   * layer, now if it already has data and again whenever what it places
   * changes: nodes added / removed, or explicitly hidden / shown (layouts skip
   * hidden nodes, so a hide re-flows the rest). Position-only updates (drags,
   * the sim's own writes) don't re-trigger it, so there's no loop. Collapse
   * doesn't either — `CollapseExpandBehaviour` owns that re-flow (anchored,
   * opt-in via `relayoutOnToggle`).
   *
   * Data-triggered runs follow the layout's {@link Layout.onData}: throttled
   * to one run per `throttleMs` (leading + trailing), and with
   * `preserveCamera` they leave the view where it is.
   */
  private wireActiveLayout(): void {
    this.offActiveLayout?.();
    this.offActiveLayout = null;

    const activeId = this.get().activeLayout;
    const layout = activeId ? this.layouts.get(activeId) : undefined;
    const targetId = layout?.targetLayerId;
    const layer = targetId ? this.layers.get<GraphLayer>(targetId) : undefined;
    if (!activeId || !layout || !layer) return;

    let lastRun = -Infinity;
    let trailing: ReturnType<typeof setTimeout> | undefined;
    const now = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const runOnData = (): void => {
      lastRun = now();
      void this.runLayout(activeId, layout.onData.preserveCamera ? { preserveCamera: true } : undefined);
    };
    const onDataChange = (): void => {
      const throttleMs = layout.onData.throttleMs ?? 0;
      if (throttleMs <= 0) return runOnData();
      if (trailing !== undefined) return; // this window's run is already queued
      const wait = lastRun + throttleMs - now();
      if (wait <= 0) return runOnData();
      trailing = setTimeout(() => {
        trailing = undefined;
        runOnData();
      }, wait);
    };

    if (layer.store.nodeCount() > 0) {
      lastRun = now();
      void this.runLayout(activeId);
    }
    const off = layer.events.on('data:changed', (e) => {
      if (e.addedNodes > 0 || e.removedNodes > 0 || e.hiddenNodes > 0 || e.shownNodes > 0) onDataChange();
    });
    this.offActiveLayout = () => {
      off();
      if (trailing !== undefined) clearTimeout(trailing);
    };
  }
}
