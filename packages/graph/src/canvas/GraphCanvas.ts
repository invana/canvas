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

import { Canvas, deepMerge } from '@invana/canvas';
import type { Behaviour, CanvasConfig, CanvasOptions, CommandRegistry, Layer, Layout, LayoutRunOptions } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import { GraphLayer } from '../layer/GraphLayer';
import type { Vec2 } from '../store';
import { edgeShape } from './graphActions';
import { registerGraphCommands, type GraphCanvasCommandMap } from './graphCommands';
import { DEFAULT_LAYOUT_PRESETS, expandLayoutPreset, type LayoutPresetSpec } from './layoutPresets';

/** Construction options for {@link GraphCanvas}: the engine's, plus the clipboard and the layout presets. */
export interface GraphCanvasOptions extends CanvasOptions {
  /** Every `GraphLayer` gets a `GraphClipboard`; `pasteOffset` shifts pasted nodes (default `{ x: 24, y: 24 }`). */
  clipboard?: { pasteOffset?: Vec2 };
  /** The presets `applyLayoutPreset` and the `layout.preset` command offer. Default {@link DEFAULT_LAYOUT_PRESETS}. */
  layoutPresets?: readonly LayoutPresetSpec[];
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
  private presets: readonly LayoutPresetSpec[];
  /** Options for the run the next `activeLayout` wiring starts — set by a preset switch. */
  private pendingRun: LayoutRunOptions | undefined;

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
    this.presets = opts.layoutPresets ?? DEFAULT_LAYOUT_PRESETS;
    registerGraphCommands(this.commands, {
      clipboard: (layerId) => this.clipboard(layerId),
      layoutPresets: () => this.presets,
      applyLayoutPreset: (id, overrides) => this.applyLayoutPreset(id, overrides),
      runLayoutPreset: () => this.runLayoutPreset(),
    });
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

  /** The layout presets this canvas offers. */
  get layoutPresets(): readonly LayoutPresetSpec[] {
    return this.presets;
  }

  /**
   * Replace the layout presets — e.g. {@link DEFAULT_LAYOUT_PRESETS} remapped
   * to the ids this host registered its layouts under (`remapLayoutPresets`).
   */
  setLayoutPresets(presets: readonly LayoutPresetSpec[]): void {
    this.presets = presets;
    this.commands.invalidate();
  }

  /**
   * Switch to layout preset `id` with the options in `overrides` changed over
   * its defaults, as one undo step (action `edit:layout-preset`) that a
   * walkthrough step captures. The switch runs the layout once, framing the
   * result and — for a preset with `reseed` (Network) — solving from scratch.
   * See {@link update} for what a preset write expands to.
   */
  applyLayoutPreset(id: string, overrides: Readonly<Record<string, string>> = {}): void {
    this.pendingRun = expandLayoutPreset(this.presets, id, overrides)?.run;
    try {
      this.update({ layoutPreset: { id, overrides: { ...overrides } } }, 'edit:layout-preset');
    } finally {
      this.pendingRun = undefined;
    }
  }

  /**
   * *Run again*: run the active layout as the active preset's switch does —
   * framed, and from scratch for a preset with `reseed` — so a settled force
   * finds a new arrangement rather than falling back into the one it has.
   * Without a preset, runs the active layout plainly.
   */
  runLayoutPreset(): Promise<void> {
    const active = this.get().activeLayout;
    if (!active) return Promise.resolve();
    const preset = this.store.view.getState().definition.layoutPreset;
    const expansion = preset ? expandLayoutPreset(this.presets, preset.id, preset.overrides) : null;
    return this.runLayout(active, expansion?.layoutId === active ? expansion.run : undefined);
  }

  /** The `activeLayout` a write names is re-wired and run by {@link wireActiveLayout}. */
  protected override layoutsRunBy(patch: CanvasConfig): ReadonlySet<string> {
    return patch.activeLayout !== undefined ? new Set([patch.activeLayout]) : super.layoutsRunBy(patch);
  }

  override async init(opts: CanvasOptions): Promise<void> {
    await super.init(opts);
    this.wireActiveLayout();
  }

  /**
   * The engine's `update`, plus: a write carrying `layoutPreset` is **expanded**
   * before it lands — the preset's layout becomes `activeLayout`, its options
   * (merged over any the write already carries for that layout) go to
   * `layouts[layoutId]`, the layer's edge `pathType` to its `edge.style.shape`,
   * and `layoutPreset` is stored with only the overrides that differ from the
   * defaults. So a preset acts the same however it arrives: the picker
   * ({@link applyLayoutPreset}), a declarative `config`, an import, or a
   * replayed walkthrough step. A preset that can't expand (unknown id, layout
   * not registered) is recorded as given.
   */
  override update(patch: CanvasConfig, action?: string): void {
    const expanded = patch.layoutPreset ? this.expandPresetPatch(patch, patch.layoutPreset) : patch;
    super.update(expanded, action);
    if (expanded.activeLayout !== undefined) this.wireActiveLayout();
  }

  private expandPresetPatch(patch: CanvasConfig, preset: NonNullable<CanvasConfig['layoutPreset']>): CanvasConfig {
    const expansion = expandLayoutPreset(this.presets, preset.id, preset.overrides);
    const layout = expansion ? this.layouts.get(expansion.layoutId) : undefined;
    const layer = layout?.targetLayerId ? this.layers.get<GraphLayer>(layout.targetLayerId) : undefined;
    if (!expansion || !(layer instanceof GraphLayer)) return patch;

    const layers = { ...patch.layers };
    if (expansion.edge) {
      // The layer's shape, with the preset-owned option keys replaced.
      const current = edgeShape(layer);
      const opts: Record<string, unknown> = { ...current.pathStyleOpts };
      for (const key of expansion.edgeOptionKeys) delete opts[key];
      Object.assign(opts, expansion.edge.pathStyleOpts);
      const shape = {
        ...current,
        pathType: expansion.edge.pathType,
        pathStyleOpts: Object.keys(opts).length > 0 ? opts : undefined,
      };
      const own = layers[layer.id] ?? {};
      const edge = (own['edge'] as Record<string, unknown> | undefined) ?? {};
      const style = (edge['style'] as Record<string, unknown> | undefined) ?? {};
      layers[layer.id] = { ...own, edge: { ...edge, style: { ...style, shape } } };
    }
    return {
      ...patch,
      activeLayout: expansion.layoutId,
      layouts: {
        ...patch.layouts,
        [expansion.layoutId]: deepMerge(patch.layouts?.[expansion.layoutId] ?? {}, expansion.layout) as Record<string, unknown>,
      },
      layers,
      layoutPreset: {
        id: preset.id,
        ...(Object.keys(expansion.overrides).length > 0 ? { overrides: expansion.overrides } : {}),
      },
    };
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
   * A node that arrives **pinned** was put where it is by hand (the Add tool, *Add
   * a node here*), so a flush that adds or removes only such nodes leaves the
   * board — and the camera — alone: the drawing does not re-flow under the
   * pointer, and undoing a drop does not either.
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
      void this.runLayout(activeId, this.pendingRun);
    }
    // `node:add` / `node:remove` fire per id before the flush's `data:changed`,
    // so this flush's ids are collected here and judged there. A removed node is
    // gone by then, so whether it was placed by hand is remembered from its add.
    const handPlaced = new Set<string>();
    const added: string[] = [];
    const removed: string[] = [];
    const offAdd = layer.store.events.on('node:add', ({ nodeId }) => {
      added.push(nodeId);
      if (layer.store.isPinned(nodeId)) handPlaced.add(nodeId);
    });
    const offRemove = layer.store.events.on('node:remove', ({ nodeId }) => void removed.push(nodeId));
    const off = layer.events.on('data:changed', (e) => {
      const byHand = (ids: string[], count: number) => ids.length === count && ids.every((id) => handPlaced.has(id));
      const reflow =
        (e.addedNodes > 0 && !byHand(added, e.addedNodes)) ||
        (e.removedNodes > 0 && !byHand(removed, e.removedNodes)) ||
        e.hiddenNodes > 0 ||
        e.shownNodes > 0;
      for (const id of removed) handPlaced.delete(id);
      added.length = 0;
      removed.length = 0;
      if (reflow) onDataChange();
    });
    this.offActiveLayout = () => {
      off();
      offAdd();
      offRemove();
      if (trailing !== undefined) clearTimeout(trailing);
    };
  }
}
