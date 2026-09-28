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
 * | `graph.clear` | `{ layerId? }` (default `'graph'`) | button — one undoable step on the layer's `GraphHistory` |
 * | `graph.redraw` | `{ layerId? }` (default `'graph'`) | button — re-project the layer |
 * | `graph.erase` | `{ layerId?, clickSelectId? }` (default `'graph'` / `'click-select'`) | button — deletes the click-selection when there is one (active), else clears the layer via `graph.clear`; undoable |
 * | `history.undo` / `history.redo` | `{ layerId? }` (default `'graph'`) | button — the newer of the layer's `GraphHistory` top and `canvas.history`'s (overrides the engine's, which covers `canvas.history` alone) |
 * | `clipboard.cut` / `.copy` / `.paste` / `.delete` | `{ layerId?, clickSelectId? }` | button — over the layer's `GraphClipboard` and the click-selection; undoable |
 * | `layout.activate` | `{ value }` | choice — overrides the engine's so the facade's auto-run is the only run |
 * | `tool.active` | `{ tools?, value }` — the modeller tool = `view.interaction.viewMode` | choice; also a per-tool toggle (active while the mode is `args.value`) |
 * | `tool.nodeKind` | `{ kinds?, value }` — `viewModeArgs.nodeKind`; `kinds` maps key → label | choice, enabled while the tool is `add` |
 *
 * The history / clipboard a command uses is the owning `GraphCanvas`'s, per
 * layer ({@link GraphEditAccess}) — so saved Undo / Cut / Paste controls work on
 * every graph canvas, with no provider mounted.
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { Canvas, CanvasCommand, CommandArgSpec, CommandOption, CommandRegistry, EngineCommandMap } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import type { GraphHistory } from '../history/GraphHistory';
import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType } from '../layer/types';
import {
  canRedoEither,
  canUndoEither,
  clearGraphLayer,
  copySelection,
  cutSelection,
  deleteSelection,
  edgePathType,
  pasteAndSelect,
  redoNewest,
  selectedElementIds,
  setEdgePathType,
  undoNewest,
} from './graphActions';
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

/** `{ layerId? }` args (default `'graph'`). */
type LayerArgs = { layerId?: string } | undefined;
/** `{ layerId?, clickSelectId? }` args — a command over the click-selection of a layer. */
type SelectionArgs = { layerId?: string; clickSelectId?: string } | undefined;

/**
 * The graph commands and their `args` — the command map `GraphCanvas.commands`
 * is typed with (over {@link GraphCanvasCommandMap}). Keys match the table above.
 */
export interface GraphCommandMap {
  'select.mode': { value?: string; modes?: Record<string, string>; labels?: Record<string, string> } | undefined;
  'graph.edgeType': { layerId?: string; types?: string[]; value?: string } | undefined;
  'graph.clear': LayerArgs;
  'graph.redraw': LayerArgs;
  'graph.erase': SelectionArgs;
  'history.undo': LayerArgs;
  'history.redo': LayerArgs;
  'clipboard.cut': SelectionArgs;
  'clipboard.copy': SelectionArgs;
  'clipboard.paste': SelectionArgs;
  'clipboard.delete': SelectionArgs;
  'tool.active': { value?: string; tools?: string[] } | undefined;
  'tool.nodeKind': { value?: string; kinds?: Record<string, string> } | undefined;
  'layout.activate': { value?: string } | undefined;
}

/**
 * Every command a `GraphCanvas` holds: the engine's, with the graph's
 * overrides (`history.*`, `layout.activate`) replacing theirs.
 */
export type GraphCanvasCommandMap = Omit<EngineCommandMap, keyof GraphCommandMap> & GraphCommandMap;

/**
 * How the graph commands reach the per-layer edit state their canvas owns —
 * `GraphCanvas.graphHistory` / `GraphCanvas.clipboard`.
 */
export interface GraphEditAccess {
  /** The `GraphHistory` over graph layer `layerId`'s store, or `null` (none, or history turned off). */
  history(layerId: string): GraphHistory | null;
  /** The `GraphClipboard` over graph layer `layerId`'s store, or `null`. */
  clipboard(layerId: string): GraphClipboard | null;
}

/** The graph layer id a command targets (`args.layerId`, default `'graph'`). */
const layerIdOf = (args: unknown): string => arg<string>(args, 'layerId') ?? 'graph';
/** The click-select behaviour id a command reads (`args.clickSelectId`, default `'click-select'`). */
const clickSelectIdOf = (args: unknown): string => arg<string>(args, 'clickSelectId') ?? 'click-select';

/** `clipboard.*` args, described for the Studio's control-panel editor. */
const CLIPBOARD_ARGS: Readonly<Record<string, CommandArgSpec>> = ERASE_ARGS;

/**
 * The commands over the canvas's per-layer history and clipboard: undo / redo
 * across the graph history and `canvas.history`, the clipboard, and the
 * undoable `graph.clear` / `graph.erase`. Bodies are the shared
 * `graphActions` functions — the same ones canvas-react's hooks call.
 */
function editCommands(access: GraphEditAccess): EditCommands {
  const hasSelection = (canvas: Canvas, args: unknown) => {
    const { nodeIds, edgeIds } = clickSelection(canvas, args);
    return nodeIds.length + edgeIds.length > 0;
  };
  /** A clipboard command: enabled while its clipboard exists and `when` holds. */
  const clipboardCommand = (
    label: string,
    when: (canvas: Canvas, args: unknown, clipboard: GraphClipboard) => boolean,
    run: (canvas: Canvas, clipboard: GraphClipboard, history: GraphHistory | null, clickSelectId: string) => void,
  ): CanvasCommand<Canvas> => ({
    label,
    args: CLIPBOARD_ARGS,
    isEnabled: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      return clipboard !== null && when(canvas, args, clipboard);
    },
    run: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      if (clipboard) run(canvas, clipboard, access.history(layerIdOf(args)), clickSelectIdOf(args));
    },
  });
  return {
    // One Undo button for two stacks: the layer's graph edits and the definition
    // edits (`canvas.history`) — `undoNewest` / `redoNewest`. `args.layerId`
    // (default `'graph'`) is accepted but not described: a saved Undo is arg-less.
    'history.undo': {
      label: 'Undo',
      isEnabled: (canvas, args) => canUndoEither(canvas, access.history(layerIdOf(args))),
      run: (canvas, args) => undoNewest(canvas, access.history(layerIdOf(args))),
    },
    'history.redo': {
      label: 'Redo',
      isEnabled: (canvas, args) => canRedoEither(canvas, access.history(layerIdOf(args))),
      run: (canvas, args) => redoNewest(canvas, access.history(layerIdOf(args))),
    },
    'graph.clear': {
      label: 'Clear canvas',
      args: LAYER_ARG,
      isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
      run: (canvas, args) => clearGraphLayer(canvas, layerIdOf(args), access.history(layerIdOf(args))),
    },
    'graph.erase': eraseCommand((layerId) => access.history(layerId)),
    'clipboard.cut': clipboardCommand('Cut', (c, a) => hasSelection(c, a), (c, cb, h, sel) => cutSelection(c, cb, h, sel)),
    'clipboard.copy': clipboardCommand('Copy', (c, a) => hasSelection(c, a), (c, cb, _h, sel) => copySelection(c, cb, sel)),
    'clipboard.paste': clipboardCommand('Paste', (_c, _a, cb) => cb.hasContent, (c, cb, h, sel) => pasteAndSelect(c, cb, h, sel)),
    'clipboard.delete': clipboardCommand('Delete', (c, a) => hasSelection(c, a), (c, cb, h, sel) => deleteSelection(c, cb, h, sel)),
  };
}

const selectModes = (args: unknown) => arg<Record<string, string>>(args, 'modes') ?? DEFAULT_SELECT_MODES;

/** The graph commands that don't touch the per-layer edit state. */
type StatelessGraphCommands = {
  [K in Exclude<keyof GraphCommandMap, keyof EditCommands>]: CanvasCommand<Canvas, GraphCommandMap[K]>;
};
/** The graph commands over the per-layer history / clipboard ({@link editCommands}). */
type EditCommands = {
  [K in 'history.undo' | 'history.redo' | 'graph.clear' | 'graph.erase' | 'clipboard.cut' | 'clipboard.copy' | 'clipboard.paste' | 'clipboard.delete']: CanvasCommand<
    Canvas,
    GraphCommandMap[K]
  >;
};

const GRAPH_COMMANDS: StatelessGraphCommands = {
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
      return edgePathType(layer) ?? types[0] ?? null;
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
      // Shared with `useEdgeType`. The layer's `style:changed` is bridged to
      // `commands.invalidate()` by `GraphCanvas`, so bound controls re-read.
      setEdgePathType(layer, next);
    },
  },
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

/** Palette / menu metadata per graph command (`CanvasCommand.category` / `.keywords`). */
const GRAPH_META: { [K in keyof GraphCommandMap]: Pick<CanvasCommand<Canvas>, 'category' | 'keywords'> } = {
  'select.mode': { category: 'Selection', keywords: ['brush', 'lasso', 'click'] },
  'graph.edgeType': { category: 'View', keywords: ['routing', 'curved', 'straight', 'orthogonal'] },
  'graph.clear': { category: 'Edit', keywords: ['empty', 'remove all', 'reset'] },
  'graph.redraw': { category: 'View', keywords: ['refresh', 'repaint'] },
  'graph.erase': { category: 'Edit', keywords: ['delete', 'remove'] },
  'history.undo': { category: 'Edit', keywords: ['revert', 'back'] },
  'history.redo': { category: 'Edit', keywords: ['again', 'forward'] },
  'clipboard.cut': { category: 'Edit' },
  'clipboard.copy': { category: 'Edit', keywords: ['duplicate'] },
  'clipboard.paste': { category: 'Edit', keywords: ['insert'] },
  'clipboard.delete': { category: 'Edit', keywords: ['remove', 'erase'] },
  'tool.active': { category: 'Tools', keywords: ['select', 'add', 'connect', 'delete', 'mode'] },
  'tool.nodeKind': { category: 'Tools', keywords: ['shape'] },
  'layout.activate': { category: 'Layout', keywords: ['switch layout'] },
};

/**
 * Register every graph command on `registry` (overriding same-named engine
 * built-ins), with the history / clipboard commands over `access`.
 */
export function registerGraphCommands(registry: CommandRegistry<Canvas>, access: GraphEditAccess): void {
  for (const [name, command] of Object.entries({ ...GRAPH_COMMANDS, ...editCommands(access) })) {
    registry.register(name, { ...GRAPH_META[name as keyof GraphCommandMap], ...command });
  }
}
