import type { ControlItemSpec } from '@invana/canvas';

/**
 * Serialisable **control-panel presets** — ready-made `ControlItemSpec[]` built
 * from registered commands and the default icon / widget registries, so a panel
 * made from them saves, exports and loads intact.
 *
 * Spread them to compose: `items={[...ZOOM_CONTROL_ITEMS, { type: 'divider' }, …]}`.
 *
 * Where a preset's commands come from:
 * - engine (every canvas): camera, `view.lock`, `layout.*`, `background.grid`;
 * - `GraphCanvas`: `select.mode`, `graph.edgeType`, `graph.clear`;
 * - `<GraphHistoryProvider>` while mounted: `history.*` (+ an undoable `graph.clear`);
 * - `<GraphClipboardProvider>` while mounted: `clipboard.*`.
 * A control whose command isn't registered renders disabled.
 */

const divider = (key: string): ControlItemSpec => ({ type: 'divider', key });

/** Zoom in · live zoom % · zoom out. */
export const ZOOM_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
  { type: 'widget', key: 'zoom', widget: 'zoom-readout' },
  { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
];

/**
 * The view bar — zoom in / out, fit to content, lock view. The serialisable
 * counterpart of `ViewToolbar`; lock disables `pan` + `drag-node` (the
 * `view.lock` default) and leaves wheel zoom live.
 */
export const VIEW_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
  { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
  { type: 'command', key: 'fit', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
  {
    type: 'toggle',
    key: 'lock',
    command: 'view.lock',
    icon: 'lock-open',
    activeIcon: 'lock',
    label: 'Lock view',
    activeLabel: 'Unlock view',
  },
];

/** Undo · redo. Needs a `<GraphHistoryProvider>`. The counterpart of `HistoryToolbar`. */
export const HISTORY_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo' },
  { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo' },
];

/**
 * Cut · copy · paste · delete the selection. Needs a `<GraphClipboardProvider>`
 * (and a `<GraphHistoryProvider>` above it to make them undoable). The
 * counterpart of `EditToolbar`.
 */
export const EDIT_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'cut', command: 'clipboard.cut', icon: 'scissors', label: 'Cut' },
  { type: 'command', key: 'copy', command: 'clipboard.copy', icon: 'copy', label: 'Copy' },
  { type: 'command', key: 'paste', command: 'clipboard.paste', icon: 'clipboard-paste', label: 'Paste' },
  { type: 'command', key: 'delete', command: 'clipboard.delete', icon: 'eraser', label: 'Delete selection' },
];

/** Click / brush / lasso selection mode. Options come from the `select.mode` command. */
export const SELECT_MODE_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'choice', key: 'select-mode', command: 'select.mode', label: 'Select' },
];

/** Edge routing for the `graph` layer. Options come from the `graph.edgeType` command. */
export const EDGE_TYPE_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'choice', key: 'edge-type', command: 'graph.edgeType', label: 'Edges' },
];

/**
 * Pick a **registered** layout (`canvas.layouts`) · run it · stop it. Factory
 * layouts passed to `GraphControlsToolbar` aren't serialisable and stay a
 * toolbar feature.
 */
export const LAYOUT_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'choice', key: 'layout', command: 'layout.activate', label: 'Layout' },
  { type: 'command', key: 'run-layout', command: 'layout.run', icon: 'play', label: 'Run layout' },
  { type: 'command', key: 'stop-layout', command: 'layout.stop', icon: 'stop', label: 'Stop layout' },
];

/** Background grid on/off (the `'background'` layer). The counterpart of `GridToolbar`. */
export const GRID_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'toggle', key: 'grid', command: 'background.grid', icon: 'grid', label: 'Toggle grid' },
];

/**
 * The full graph bar — the serialisable counterpart of `GraphControlsToolbar`:
 * layout · undo / redo · select mode · edge routing · delete · fit / lock · grid.
 */
export const GRAPH_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  ...LAYOUT_CONTROL_ITEMS,
  divider('d-history'),
  ...HISTORY_CONTROL_ITEMS,
  divider('d-select'),
  ...SELECT_MODE_CONTROL_ITEMS,
  ...EDGE_TYPE_CONTROL_ITEMS,
  { type: 'command', key: 'delete', command: 'clipboard.delete', icon: 'eraser', label: 'Delete selection' },
  divider('d-view'),
  { type: 'command', key: 'fit', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
  {
    type: 'toggle',
    key: 'lock',
    command: 'view.lock',
    icon: 'lock-open',
    activeIcon: 'lock',
    label: 'Lock view',
    activeLabel: 'Unlock view',
  },
  ...GRID_CONTROL_ITEMS,
];
