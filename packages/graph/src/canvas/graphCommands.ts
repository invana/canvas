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
 * | `layout.activate` | `{ value }` | choice — overrides the engine's so the facade's auto-run is the only run |
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { Canvas, CanvasCommand, CommandOption, CommandRegistry } from '@invana/canvas';

import type { GraphLayer } from '../layer/GraphLayer';
import type { EdgePathType, EdgeShapeOptions } from '../layer/types';

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

const selectModes = (args: unknown) => arg<Record<string, string>>(args, 'modes') ?? DEFAULT_SELECT_MODES;

const GRAPH_COMMANDS: Record<string, CanvasCommand<Canvas>> = {
  'select.mode': {
    label: 'Select',
    // The first mode whose behaviour is enabled, else the behaviour-less mode
    // (`click`), else the first — the same rule as `useSelectMode`.
    value: (canvas, args) => {
      const modes = selectModes(args);
      for (const [mode, id] of Object.entries(modes)) {
        if (id && canvas.behaviours.get(id)?.enabled) return mode;
      }
      const keys = Object.keys(modes);
      return keys.find((k) => !modes[k]) ?? keys[0] ?? null;
    },
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
      const patch: Record<string, { enabled: boolean }> = {};
      for (const [mode, id] of Object.entries(selectModes(args))) {
        if (id) patch[id] = { enabled: mode === next };
      }
      canvas.update({ behaviours: patch });
    },
  },
  'graph.edgeType': {
    label: 'Edges',
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
    isEnabled: (canvas, args) => graphLayer(canvas, args) !== undefined,
    run: (canvas, args) => graphLayer(canvas, args)?.clear(),
  },
  'layout.activate': {
    label: 'Layout',
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
