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
 * | `graph.clear` | `{ layerId? }` (default `'graph'`) | button — one undoable `'clear'` entry in `canvas.history` |
 * | `graph.redraw` | `{ layerId? }` (default `'graph'`) | button — re-project the layer |
 * | `graph.erase` | `{ layerId?, clickSelectId? }` (default `'graph'` / `'click-select'`) | button — deletes the click-selection when there is one (active), else clears the layer via `graph.clear`; undoable |
 * | `clipboard.cut` / `.copy` / `.paste` / `.delete` | `{ layerId?, clickSelectId? }` | button — over the layer's `GraphClipboard` and the click-selection; undoable |
 * | `layout.activate` | `{ value }` | choice — overrides the engine's so the facade's auto-run is the only run |
 * | `tool.active` | `{ tools?, value }` — the modeller tool = `view.interaction.viewMode` | choice; also a per-tool toggle (active while the mode is `args.value`) |
 * | `tool.nodeKind` | `{ kinds?, value }` — `viewModeArgs.nodeKind`; `kinds` maps key → label | choice, enabled while the tool is `add` |
 *
 * The clipboard a command uses is the owning `GraphCanvas`'s, per layer
 * ({@link GraphEditAccess}) — so saved Cut / Paste controls work on every graph
 * canvas, with no provider mounted. Undo / redo are the engine's
 * `history.undo` / `history.redo` over `canvas.history`, which every graph
 * layer's store records into.
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { Canvas, CanvasCommand, CommandArgSpec, CommandOption, CommandRegistry, EngineCommandMap } from '@invana/canvas';

import { GraphClipboard } from '../clipboard/GraphClipboard';
import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType } from '../layer/types';
import {
  clearGraphLayer,
  copySelection,
  cutSelection,
  deleteSelection,
  edgePathType,
  pasteAndSelect,
  selectedElementIds,
  setEdgePathType,
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

/** The graph layer a command targets (`args.layerId`, else `defaultLayerId`). */
function graphLayer(canvas: Canvas, args: unknown, defaultLayerId = 'graph'): GraphLayer | undefined {
  return canvas.layers.get<GraphLayer>(arg<string>(args, 'layerId') ?? defaultLayerId);
}

/** `{ layerId? }` — the graph layer a command targets, described with its default. */
function layerArg(defaultLayerId: string): Record<string, CommandArgSpec> {
  return { layerId: { kind: 'layer', label: 'Layer', default: defaultLayerId } };
}
/** `{ layerId? }` with the usual default, `'graph'`. */
const LAYER_ARG = layerArg('graph');

/** `{ layerId?, clickSelectId? }` — `graph.erase`'s and the `clipboard.*` args. */
function selectionArgs(defaultLayerId: string): Readonly<Record<string, CommandArgSpec>> {
  return {
    ...layerArg(defaultLayerId),
    clickSelectId: { kind: 'behaviour', label: 'Selection', default: 'click-select', description: 'The click-select behaviour to read' },
  };
}

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
 * The `graph.erase` command body: delete the click-selection (one undoable
 * entry), or clear the layer when nothing is selected — through the
 * registry's `graph.clear` (aimed at the same layer), so an override applies.
 * Carries no palette metadata — {@link registerGraphEditCommands} adds it.
 *
 * @param defaultLayerId The layer when `args.layerId` is absent. Default `'graph'`.
 */
export function eraseCommand(defaultLayerId = 'graph'): CanvasCommand<Canvas> {
  return {
    label: 'Erase',
    args: selectionArgs(defaultLayerId),
    isEnabled: (canvas, args) => graphLayer(canvas, args, defaultLayerId) !== undefined,
    isActive: (canvas, args) => {
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      return nodeIds.length + edgeIds.length > 0;
    },
    run: (canvas, args) => {
      const layer = graphLayer(canvas, args, defaultLayerId);
      if (!layer) return;
      const { nodeIds, edgeIds } = clickSelection(canvas, args);
      if (nodeIds.length + edgeIds.length === 0) {
        // Name the layer: whichever `graph.clear` is live may default to another.
        canvas.commands.run('graph.clear', { ...(args && typeof args === 'object' ? args : {}), layerId: layer.id });
        return;
      }
      new GraphClipboard(layer.store).delete(nodeIds, edgeIds);
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
 * override (`layout.activate`) replacing its.
 */
export type GraphCanvasCommandMap = Omit<EngineCommandMap, keyof GraphCommandMap> & GraphCommandMap;

/**
 * How the graph commands reach the per-layer edit state their canvas owns —
 * `GraphCanvas.clipboard`.
 */
export interface GraphEditAccess {
  /** The `GraphClipboard` over graph layer `layerId`'s store, or `null`. */
  clipboard(layerId: string): GraphClipboard | null;
}

/** The click-select behaviour id a command reads (`args.clickSelectId`, default `'click-select'`). */
const clickSelectIdOf = (args: unknown): string => arg<string>(args, 'clickSelectId') ?? 'click-select';

/**
 * The commands over the per-layer clipboard, and the undoable `graph.clear` /
 * `graph.erase` — with their palette metadata. Bodies are the
 * shared `graphActions` functions, the same ones canvas-react's hooks call.
 * Every one honours `args.layerId`, falling back to `defaultLayerId`.
 */
function editCommands(access: GraphEditAccess, defaultLayerId = 'graph'): EditCommands {
  /** The graph layer id a command targets (`args.layerId`, else `defaultLayerId`). */
  const layerIdOf = (args: unknown): string => arg<string>(args, 'layerId') ?? defaultLayerId;
  const clipboardArgs = selectionArgs(defaultLayerId);
  const hasSelection = (canvas: Canvas, args: unknown) => {
    const { nodeIds, edgeIds } = clickSelection(canvas, args);
    return nodeIds.length + edgeIds.length > 0;
  };
  /** A clipboard command: enabled while its clipboard exists and `when` holds. */
  const clipboardCommand = (
    label: string,
    when: (canvas: Canvas, args: unknown, clipboard: GraphClipboard) => boolean,
    run: (canvas: Canvas, clipboard: GraphClipboard, clickSelectId: string) => void,
  ): CanvasCommand<Canvas> => ({
    label,
    args: clipboardArgs,
    isEnabled: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      return clipboard !== null && when(canvas, args, clipboard);
    },
    run: (canvas, args) => {
      const clipboard = access.clipboard(layerIdOf(args));
      if (clipboard) run(canvas, clipboard, clickSelectIdOf(args));
    },
  });
  const commands: EditCommands = {
    'graph.clear': {
      label: 'Clear canvas',
      args: layerArg(defaultLayerId),
      isEnabled: (canvas, args) => graphLayer(canvas, args, defaultLayerId) !== undefined,
      run: (canvas, args) => clearGraphLayer(canvas, layerIdOf(args)),
    },
    'graph.erase': eraseCommand(defaultLayerId),
    'clipboard.cut': clipboardCommand('Cut', (c, a) => hasSelection(c, a), (c, cb, sel) => cutSelection(c, cb, sel)),
    'clipboard.copy': clipboardCommand('Copy', (c, a) => hasSelection(c, a), (c, cb, sel) => copySelection(c, cb, sel)),
    'clipboard.paste': clipboardCommand('Paste', (_c, _a, cb) => cb.hasContent, (c, cb, sel) => pasteAndSelect(c, cb, sel)),
    'clipboard.delete': clipboardCommand('Delete', (c, a) => hasSelection(c, a), (c, cb, sel) => deleteSelection(c, cb, sel)),
  };
  for (const name of Object.keys(commands) as EditCommandName[]) commands[name] = { ...GRAPH_META[name], ...commands[name] } as never;
  return commands;
}

const selectModes = (args: unknown) => arg<Record<string, string>>(args, 'modes') ?? DEFAULT_SELECT_MODES;

/** The graph commands that don't touch the per-layer edit state. */
type StatelessGraphCommands = {
  [K in Exclude<keyof GraphCommandMap, keyof EditCommands>]: CanvasCommand<Canvas, GraphCommandMap[K]>;
};
/** The graph commands over the per-layer clipboard — see {@link registerGraphEditCommands}. */
export type EditCommandName =
  | 'graph.clear'
  | 'graph.erase'
  | 'clipboard.cut'
  | 'clipboard.copy'
  | 'clipboard.paste'
  | 'clipboard.delete';
/** The graph commands over the per-layer clipboard ({@link editCommands}). */
type EditCommands = {
  [K in EditCommandName]: CanvasCommand<Canvas, GraphCommandMap[K]>;
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
 * built-ins), with the clipboard commands over `access`.
 */
export function registerGraphCommands(registry: CommandRegistry<Canvas>, access: GraphEditAccess): void {
  for (const [name, command] of Object.entries(GRAPH_COMMANDS)) {
    registry.register(name, { ...GRAPH_META[name as keyof GraphCommandMap], ...command });
  }
  registerGraphEditCommands(registry, access);
}

/** Options for {@link registerGraphEditCommands}. */
export interface RegisterGraphEditCommandsOptions {
  /** The layer a command targets when `args.layerId` is absent (and its described default). Default `'graph'`. */
  layerId?: string;
  /** Register only these (default: all of {@link EditCommandName}). */
  only?: readonly EditCommandName[];
}

/**
 * Register the clipboard commands (`clipboard.*`, `graph.clear`,
 * `graph.erase`) over `access`, with the same args, bodies and palette
 * metadata `GraphCanvas` registers — so an override (canvas-react's
 * `GraphClipboardProvider`) can't drift from the built-ins. Each honours `args.layerId`, falling back to `opts.layerId`; an
 * override covering one layer delegates the others through `access`.
 *
 * Registrations stack over same-named ones. Returns a disposer that removes
 * exactly these, restoring whatever was underneath.
 */
export function registerGraphEditCommands(
  registry: CommandRegistry<Canvas>,
  access: GraphEditAccess,
  opts: RegisterGraphEditCommandsOptions = {},
): () => void {
  const commands = editCommands(access, opts.layerId ?? 'graph');
  const names = opts.only ?? (Object.keys(commands) as EditCommandName[]);
  const offs = names.map((name) => registry.register(name, commands[name] as CanvasCommand<Canvas>));
  return () => {
    for (const off of offs) off();
  };
}
