/**
 * The graph domain's {@link CanvasCommand}s — registered on every
 * `GraphCanvas`'s `commands` registry at construction, so a saved control panel
 * can switch the selection mode, route edges and clear the graph with no app
 * code.
 *
 * | Name | Args | Kind |
 * |---|---|---|
 * | `select.mode` | `{ modes?, labels?, value }` — `modes` maps mode → behaviour id (`''` = no behaviour) | choice |
 * | `graph.edgeType` | `{ layerId?, types?, value }` (default `'graph'`, {@link DEFAULT_EDGE_TYPES}) | choice |
 * | `graph.clear` | `{ layerId? }` (default `'graph'`) | button — the history provider overrides it with an undoable form |
 * | `graph.redraw` | `{ layerId? }` (default `'graph'`) | button — re-project the layer |
 * | `graph.erase` | `{ layerId?, clickSelectId? }` (default `'graph'` / `'click-select'`) | button — deletes the click-selection when there is one (active), else clears the layer via `graph.clear`; history / clipboard providers override it with an undoable form |
 * | `layout.activate` | `{ value }` | choice — overrides the engine's so the facade's auto-run is the only run |
 * | `tool.active` | `{ tools?, value }` — the modeller tool = `view.interaction.viewMode` | choice; also a per-tool toggle (active while the mode is `args.value`) |
 * | `tool.nodeKind` | `{ kinds?, value }` — `viewModeArgs.nodeKind`; `kinds` maps key → label | choice, enabled while the tool is `add` |
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { Canvas, CanvasCommand, CommandArgSpec, CommandOption, CommandRegistry } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import type { GraphHistory } from '../history/GraphHistory';
import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType, EdgeShapeOptions } from '../layer/types';
import { selectedElementIds } from './graphActions';
import { resolveSelectMode, selectModePatch } from './selectMode';

/**
 * Default path types an edge-type picker offers, in display order — the three
 * common routing styles plus the rounded / smooth orthogonal variants.
 */
export const DEFAULT_EDGE_TYPES: readonly EdgePathType[] = ['straight', 'orth', 'bezier', 'rounded', 'smooth'];

/** Human labels for the built-in {@link EdgePathType} values. */
export const DEFAULT_EDGE_TYPE_LABELS: Record<string, string> = {
  straight: 'Straight',
  orth: 'Orthogonal',
  bezier: 'Curved',
  quadratic: 'Quadratic',
  rounded: 'Rounded',
  smooth: 'Smooth',
  manhattan: 'Manhattan',
  'bump-radial': 'Bump (radial)',
  'bump-horizontal': 'Bump (horizontal)',
  'step-radial': 'Step (radial)',
  bundle: 'Bundled',
};

/** Default `select.mode` modes: click needs no behaviour; brush / lasso enable theirs. */
const DEFAULT_SELECT_MODES: Record<string, string> = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
const DEFAULT_SELECT_LABELS: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};
/** Icon names (the UI kit's registry) for the default modes / edge types. */
const SELECT_ICONS: Record<string, string> = { click: 'pointer', brush: 'select-box', lasso: 'lasso' };

/** Read a field off a JSON `args` bag, or `undefined`. */
function arg<T>(args: unknown, key: string): T | undefined {
  return args && typeof args === 'object' ? ((args as Record<string, unknown>)[key] as T | undefined) : undefined;
}

function graphLayer(canvas: Canvas, args: unknown): GraphLayer | undefined {
  return canvas.layers.get<GraphLayer>(arg<string>(args, 'layerId') ?? 'graph');
}

/** The current edge `shape`, or `{}`. */
function edgeShape(layer: GraphLayer): EdgeShapeOptions {
  const shape = (layer.edgeDefaults as { shape?: unknown } | undefined)?.shape;
  return (shape && typeof shape === 'object' ? shape : {}) as EdgeShapeOptions;
}

/** `{ layerId? }` — the graph layer a command targets (default `'graph'`). */
const LAYER_ARG: Record<string, CommandArgSpec> = {
  layerId: { kind: 'layer', label: 'Layer', default: 'graph' },
};
/** `graph.erase`'s args (the providers' overrides reuse {@link eraseCommand}, so they carry them too). */
const ERASE_ARGS: Readonly<Record<string, CommandArgSpec>> = {
  ...LAYER_ARG,
  clickSelectId: { kind: 'behaviour', label: 'Selection', default: 'click-select', description: 'The click-select behaviour to read' },
};

/** Every modeller tool, in toolbar order, with its default label + icon name. */
const TOOL_OPTIONS: Record<string, CommandOption> = {
  select: { value: 'select', label: 'Select', icon: 'pointer' },
  add: { value: 'add', label: 'Add node', icon: 'plus' },
  connect: { value: 'connect', label: 'Connect', icon: 'spline' },
  delete: { value: 'delete', label: 'Delete', icon: 'eraser' },
};

/** The live interaction slice (mode + mode args). */
const interaction = (canvas: Canvas) => canvas.store.view.getState().interaction;

/** The click-select behaviour's current selection (`args.clickSelectId`, default `'click-select'`). */
const clickSelection = (canvas: Canvas, args: unknown) =>
  selectedElementIds(canvas, arg<string>(args, 'clickSelectId') ?? 'click-select');

/**
 * The `graph.erase` command body: delete the click-selection (as one
 * transaction, journalled on `history(layerId)` when it returns one), or clear the layer when
 * nothing is selected — through the registry's `graph.clear`, so an undoable
 * override applies. Exported for the providers that override `graph.erase`
 * with their own history / clipboard.
 */
export function eraseCommand(
  history?: (layerId: string) => GraphHistory | null | undefined,
): CanvasCommand<Canvas> {
  return {
    label: 'Erase',
    args: ERASE_ARGS,
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
    isActive: (canvas, args) => {
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      return nodeIds.length + edgeIds.length > 0;
    },
    run: (canvas, args) => {
      const layer = graphLayer(canvas, args);
      if (!layer) return;
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      if (nodeIds.length + edgeIds.length === 0) {
        canvas.commands.run('graph.clear', args);
        return;
      }
      new GraphClipboard(layer.store).delete(nodeIds, edgeIds, history?.(layer.id) ?? undefined);
    },
  };
}

const selectModes = (args: unknown) => arg<Record<string, string>>(args, 'modes') ?? DEFAULT_SELECT_MODES;

const GRAPH_COMMANDS: Record<string, CanvasCommand<Canvas>> = {
  'select.mode': {
    label: 'Select',
    args: {
      value: { kind: 'string', label: 'Mode', pick: true },
      modes: { kind: 'json', label: 'Modes', default: DEFAULT_SELECT_MODES, description: 'Mode → behaviour id' },
      labels: { kind: 'json', label: 'Labels', default: DEFAULT_SELECT_LABELS, description: 'Mode → label' },
    },
    // The first mode whose behaviour is enabled, else the behaviour-less mode
    // (`click`), else the first — `resolveSelectMode`, shared with `useSelectMode`.
    // Reads the live behaviours (the hook reads the definition).
    value: (canvas, args) => resolveSelectMode(selectModes(args), (id) => !!canvas.behaviours.get(id)?.enabled),
    options: (_canvas, args) => {
      const labels = arg<Record<string, string>>(args, 'labels') ?? DEFAULT_SELECT_LABELS;
      return Object.keys(selectModes(args)).map((mode): CommandOption => ({
        value: mode,
        label: labels[mode] ?? mode,
        ...(SELECT_ICONS[mode] ? { icon: SELECT_ICONS[mode] } : {}),
      }));
    },
    // Through `canvas.update`, so the definition and the behaviours move together.
    run: (canvas, args) => {
      const next = arg<string>(args, 'value');
      if (next === undefined) return;
      canvas.update({ behaviours: selectModePatch(selectModes(args), next) });
    },
  },
  'graph.edgeType': {
    label: 'Edges',
    args: {
      ...LAYER_ARG,
      value: { kind: 'string', label: 'Edge type', pick: true },
      types: { kind: 'strings', label: 'Types', default: DEFAULT_EDGE_TYPES },
    },
    value: (canvas, args) => {
      const layer = graphLayer(canvas, args);
      if (!layer) return null;
      const types = arg<string[]>(args, 'types') ?? DEFAULT_EDGE_TYPES;
      return edgeShape(layer).pathType ?? types[0] ?? null;
    },
    options: (_canvas, args) =>
      (arg<string[]>(args, 'types') ?? DEFAULT_EDGE_TYPES).map((t) => ({
        value: t,
        label: DEFAULT_EDGE_TYPE_LABELS[t] ?? t,
        icon: `edge-${t}`,
      })),
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
    run: (canvas, args) => {
      const layer = graphLayer(canvas, args);
      const next = arg<string>(args, 'value');
      if (!layer || !next) return;
      // `setEdgeDefaults` replaces `shape` wholesale — keep anchors / waypoints.
      layer.setEdgeDefaults({ shape: { ...edgeShape(layer), pathType: next as EdgePathType } });
      // Edge defaults live on the layer, not in the view store: tell bound controls.
      canvas.commands.invalidate();
    },
  },
  'graph.clear': {
    label: 'Clear canvas',
    args: LAYER_ARG,
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
    run: (canvas, args) => graphLayer(canvas, args)?.clear(),
  },
  'graph.erase': eraseCommand(),
  'graph.redraw': {
    label: 'Redraw',
    args: LAYER_ARG,
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
    run: (canvas, args) => graphLayer(canvas, args)?.redraw(),
  },
  // The modeller tool lives in the view store, so these re-read on every mode
  // write with no `invalidate()`. Behaviours follow it through their `modes`.
  'tool.active': {
    label: 'Tool',
    args: {
      value: { kind: 'enum', label: 'Tool', pick: true, options: Object.values(TOOL_OPTIONS) },
      tools: { kind: 'strings', label: 'Tools', default: Object.keys(TOOL_OPTIONS), description: 'Tools the picker offers, in order' },
    },
    value: (canvas) => interaction(canvas).viewMode,
    // As a toggle item (`args: { value: 'add' }`): pressed while that tool is on.
    isActive: (canvas, args) => interaction(canvas).viewMode === arg<string>(args, 'value'),
    // `args.tools` narrows / reorders the offered tools.
    options: (_canvas, args) => {
      const tools = arg<string[]>(args, 'tools') ?? Object.keys(TOOL_OPTIONS);
      return tools.filter((t) => t in TOOL_OPTIONS).map((t) => TOOL_OPTIONS[t]!);
    },
    run: (canvas, args) => {
      const value = arg<string>(args, 'value');
      if (value) canvas.store.actions.viewMode.set(value);
    },
  },
  'tool.nodeKind': {
    label: 'Shape',
    args: {
      value: { kind: 'string', label: 'Shape', pick: true },
      kinds: { kind: 'json', label: 'Shapes', description: 'Shape key → label' },
    },
    value: (canvas) => interaction(canvas).viewModeArgs.nodeKind ?? null,
    // `args.kinds` (key → label) lists the shapes; without it, only the current one.
    options: (canvas, args) => {
      const kinds = arg<Record<string, string>>(args, 'kinds');
      if (kinds) return Object.entries(kinds).map(([value, label]) => ({ value, label }));
      const current = interaction(canvas).viewModeArgs.nodeKind;
      return current ? [{ value: current, label: current }] : [];
    },
    isEnabled: (canvas) => interaction(canvas).viewMode === 'add',
    run: (canvas, args) => {
      const value = arg<string>(args, 'value');
      if (value) canvas.store.actions.viewMode.setArgs({ nodeKind: value });
    },
  },
  'layout.activate': {
    label: 'Layout',
    args: { value: { kind: 'layout', label: 'Layout', pick: true } },
    value: (canvas) => canvas.store.view.getState().definition.activeLayout,
    options: (canvas) => canvas.layouts.list().map((l) => ({ value: l.id, label: l.id })),
    isEnabled: (canvas) => canvas.layouts.list().length > 0,
    // `GraphCanvas.update` re-wires and runs `activeLayout` itself.
    run: (canvas, args) => {
      const id = arg<string>(args, 'value');
      if (id && canvas.layouts.has(id)) canvas.update({ activeLayout: id });
    },
  },
};

/** Register every graph command on `registry` (overriding same-named engine built-ins). */
export function registerGraphCommands(registry: CommandRegistry<Canvas>): void {
  for (const [name, command] of Object.entries(GRAPH_COMMANDS)) registry.register(name, command);
}
