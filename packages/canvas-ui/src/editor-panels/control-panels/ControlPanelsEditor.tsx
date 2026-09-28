import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Canvas, CommandArgSpec, ControlItemSpec, ControlPanelSpec } from '@invana/canvas';
import { useControlPanels, useResolvedCanvas } from '@invana/canvas-react';

import type { ToolbarIcon } from '../../components';
import { DEFAULT_CONTROL_ICONS } from '../../control-panels/icons';
import {
  CANVAS_CONTROL_ITEMS,
  EDGE_TYPE_CONTROL_ITEMS,
  EDIT_CONTROL_ITEMS,
  EXPLORER_CONTROL_ITEMS,
  GRAPH_CONTROL_ITEMS,
  GRID_CONTROL_ITEMS,
  HISTORY_CONTROL_ITEMS,
  INPUT_CONTROL_ITEMS,
  LAYOUT_CONTROL_ITEMS,
  MODELLER_CONTROL_ITEMS,
  NAVIGATION_CONTROL_ITEMS,
  PAN_CONTROL_ITEMS,
  PAN_PAD_CONTROL_ITEMS,
  SELECT_MODE_CONTROL_ITEMS,
  THEME_CONTROL_ITEMS,
  VIEW_CONTROL_ITEMS,
  ZOOM_CONTROL_ITEMS,
  ZOOM_LEVEL_CONTROL_ITEMS,
} from '../../control-panels/presets';
import { DEFAULT_CONTROL_WIDGETS, type ControlWidget } from '../../control-panels/widgets';
import { ControlPanelsEditorPanel } from './ControlPanelsEditorPanel';

/** The canvas-ui presets, by display name — the default "Insert preset" list. */
export const DEFAULT_CONTROL_PRESETS: Readonly<Record<string, readonly ControlItemSpec[]>> = {
  Zoom: ZOOM_CONTROL_ITEMS,
  'Zoom level': ZOOM_LEVEL_CONTROL_ITEMS,
  View: VIEW_CONTROL_ITEMS,
  Pan: PAN_CONTROL_ITEMS,
  'Pan pad': PAN_PAD_CONTROL_ITEMS,
  Navigation: NAVIGATION_CONTROL_ITEMS,
  Input: INPUT_CONTROL_ITEMS,
  Canvas: CANVAS_CONTROL_ITEMS,
  Explorer: EXPLORER_CONTROL_ITEMS,
  Modeller: MODELLER_CONTROL_ITEMS,
  Graph: GRAPH_CONTROL_ITEMS,
  History: HISTORY_CONTROL_ITEMS,
  Edit: EDIT_CONTROL_ITEMS,
  'Select mode': SELECT_MODE_CONTROL_ITEMS,
  'Edge type': EDGE_TYPE_CONTROL_ITEMS,
  Layout: LAYOUT_CONTROL_ITEMS,
  Grid: GRID_CONTROL_ITEMS,
  Theme: THEME_CONTROL_ITEMS,
};

/** Snapshot of the canvas's layer / behaviour / layout ids, refreshed on (un)registration. */
function useRegistryIds(canvas: Canvas): { layers: string[]; behaviours: string[]; layouts: string[] } {
  const subscribe = useCallback(
    (onChange: () => void) => {
      // The registries' bus events (behaviours announce registration only).
      const offs = [
        canvas.events.on('scene:layer:add', onChange),
        canvas.events.on('scene:layer:remove', onChange),
        canvas.events.on('scene:behaviour:register', onChange),
        canvas.events.on('scene:layout:add', onChange),
        canvas.events.on('scene:layout:remove', onChange),
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [canvas],
  );
  const read = useCallback(
    () =>
      [canvas.layers.list(), canvas.behaviours.list(), canvas.layouts.list()]
        .map((list) => list.map((i) => i.id).join(','))
        .join('|'),
    [canvas],
  );
  const key = useSyncExternalStore(subscribe, read, read);
  return useMemo(() => {
    const [layers = '', behaviours = '', layouts = ''] = key.split('|');
    const split = (s: string) => (s ? s.split(',') : []);
    return { layers: split(layers), behaviours: split(behaviours), layouts: split(layouts) };
  }, [key]);
}

export interface ControlPanelsEditorProps {
  /** Extra icons the host's `<ControlPanels icons>` registers, so the pickers offer them. */
  icons?: Record<string, ToolbarIcon>;
  /** Extra widgets the host's `<ControlPanels widgets>` registers. */
  widgets?: Record<string, ControlWidget>;
  /** "Insert preset" choices. Default {@link DEFAULT_CONTROL_PRESETS}; `{}` hides the picker. */
  presets?: Readonly<Record<string, readonly ControlItemSpec[]>>;
  /** Explicit canvas; defaults to the context canvas. */
  canvas?: Canvas | null;
  className?: string;
}

/**
 * The **connected** control-panel editor: reads `definition.controlPanels` and
 * the live command registry from the canvas, and applies every edit with
 * `canvas.update({ controlPanels }, 'edit:control-panels')` — so `canvas.history`
 * (and the `history.undo` command) can undo it, and it exports like any other
 * definition change, and `<ControlPanels>` redraws at once. Drop it in
 * anywhere under a canvas root (or pass `canvas`).
 *
 * A panel declared by a mounted `<ControlPanel>` is re-declared when that
 * component's `items` change; edit such panels in code, or remove the
 * component.
 */
export function ControlPanelsEditor({ icons, widgets, presets = DEFAULT_CONTROL_PRESETS, canvas, className }: ControlPanelsEditorProps) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);

  // Registered command names, re-read whenever a registration changes.
  const subscribe = useCallback((onChange: () => void) => resolved.commands.subscribe(onChange), [resolved]);
  const getNames = useCallback(() => resolved.commands.list().join('\n'), [resolved]);
  const names = useSyncExternalStore(subscribe, getNames, getNames);
  const commands = useMemo(() => (names ? names.split('\n') : []), [names]);
  // Each command's arg descriptor — re-read with the names, so an override
  // (the undoable `graph.clear`) shows its own.
  const commandArgs = useMemo(() => {
    const out: Record<string, Readonly<Record<string, CommandArgSpec>>> = {};
    for (const name of commands) {
      const args = resolved.commands.get(name)?.args;
      if (args) out[name] = args;
    }
    return out;
  }, [resolved, commands]);
  // Registry ids for the layer / behaviour / layout argument pickers.
  const ids = useRegistryIds(resolved);

  const iconNames = useMemo(() => Object.keys({ ...DEFAULT_CONTROL_ICONS, ...icons }), [icons]);
  const widgetNames = useMemo(() => Object.keys({ ...DEFAULT_CONTROL_WIDGETS, ...widgets }), [widgets]);
  const apply = useCallback(
    (patch: Record<string, ControlPanelSpec | null>) => resolved.update({ controlPanels: patch }, 'edit:control-panels'),
    [resolved],
  );

  return (
    <ControlPanelsEditorPanel
      panels={panels}
      commands={commands}
      icons={iconNames}
      widgets={widgetNames}
      commandArgs={commandArgs}
      layers={ids.layers}
      behaviours={ids.behaviours}
      layouts={ids.layouts}
      presets={presets}
      onSubmit={apply}
      {...(className ? { className } : {})}
    />
  );
}
