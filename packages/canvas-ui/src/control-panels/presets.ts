import type { ControlItemSpec } from '@invana/canvas';

/**
 * Serialisable **control-panel presets** — ready-made `ControlItemSpec[]` built
 * from registered commands and the default icon / widget registries, so a panel
 * made from them saves, exports and loads intact.
 *
 * Spread them to compose: `items={[...ZOOM_CONTROL_ITEMS, { type: 'divider' }, …]}`.
 *
 * Where a preset's commands come from:
 * - engine (every canvas): `camera.*` (zoom / fit / pan / zoomTo / reset),
 *   `view.lock`, `behaviour.toggle`, `layout.*`, `background.grid`;
 * - `GraphCanvas`: `select.mode`, `graph.edgeType`, `graph.clear`, and the modeller
 *   tool `tool.active` / `tool.nodeKind` (the store's `interaction.viewMode`);
 * - `<CanvasThemeSync>` under a `<ThemeProvider>`: `theme.toggle`;
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
 * Pick a **registered** layout (`canvas.layouts`) · Run, which reads Stop while
 * a layout runs (`layout.toggle`). Factory layouts passed to
 * `GraphControlsToolbar` aren't serialisable and stay a toolbar feature.
 */
export const LAYOUT_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'choice', key: 'layout', command: 'layout.activate', label: 'Layout' },
  {
    type: 'command',
    key: 'run-layout',
    command: 'layout.toggle',
    icon: 'play',
    activeIcon: 'stop',
    label: 'Run layout',
    activeLabel: 'Stop layout',
  },
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

// ── Camera + input ────────────────────────────────────────────────────────

/** Default `camera.pan` step for the arrow presets, in screen px. */
const PAN_STEP = 80;

/** Fit to content — shared by the mode presets. */
const FIT_ITEM: ControlItemSpec = { type: 'command', key: 'fit', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' };

/** Zoom 1, world origin centred. */
const RESET_ITEM: ControlItemSpec = { type: 'command', key: 'reset', command: 'camera.reset', icon: 'locate', label: 'Reset view' };

/** Lock / unlock panning + node drag. */
const LOCK_ITEM: ControlItemSpec = {
  type: 'toggle',
  key: 'lock',
  command: 'view.lock',
  icon: 'lock-open',
  activeIcon: 'lock',
  label: 'Lock view',
  activeLabel: 'Unlock view',
};

/**
 * Pan ← ↑ ↓ → one step (80 px) · reset. Each arrow reveals what lies that way,
 * so the content moves the other way (`camera.pan` moves the content by `dx`/`dy`).
 */
export const PAN_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'pan-left', command: 'camera.pan', args: { dx: PAN_STEP }, icon: 'arrow-left', label: 'Pan left' },
  { type: 'command', key: 'pan-up', command: 'camera.pan', args: { dy: PAN_STEP }, icon: 'arrow-up', label: 'Pan up' },
  { type: 'command', key: 'pan-down', command: 'camera.pan', args: { dy: -PAN_STEP }, icon: 'arrow-down', label: 'Pan down' },
  { type: 'command', key: 'pan-right', command: 'camera.pan', args: { dx: -PAN_STEP }, icon: 'arrow-right', label: 'Pan right' },
  RESET_ITEM,
];

/** The arrows + reset as one 3×3 pad (the `pan-pad` widget). Set `options.step` to change the step. */
export const PAN_PAD_CONTROL_ITEMS: readonly ControlItemSpec[] = [{ type: 'widget', key: 'pan-pad', widget: 'pan-pad' }];

/** Zoom out · a zoom-level picker (25–400 %) · zoom in · 100 %. */
export const ZOOM_LEVEL_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
  { type: 'choice', key: 'zoom-level', command: 'camera.zoomTo', label: 'Zoom' },
  { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
  { type: 'command', key: 'zoom-100', command: 'camera.zoomTo', args: { value: 1 }, label: 'Zoom to 100%', text: '100%' },
];

/**
 * Turn each camera gesture on / off through `behaviour.toggle`: drag-pan
 * (`pan`), wheel zoom (`zoom`) and keyboard camera (`keyboard-camera`) — the
 * canvas-react wrappers' default ids. A behaviour that isn't registered renders
 * disabled; for other ids, copy the items and change `args.id`.
 */
export const INPUT_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'toggle', key: 'input-pan', command: 'behaviour.toggle', args: { id: 'pan' }, icon: 'hand', label: 'Drag to pan' },
  { type: 'toggle', key: 'input-zoom', command: 'behaviour.toggle', args: { id: 'zoom' }, icon: 'mouse', label: 'Wheel zoom' },
  { type: 'toggle', key: 'input-keyboard', command: 'behaviour.toggle', args: { id: 'keyboard-camera' }, icon: 'keyboard', label: 'Keyboard camera' },
];

/** Pan pad · zoom in / readout / out · fit — every way to move the camera, in one panel. */
export const NAVIGATION_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  ...PAN_PAD_CONTROL_ITEMS,
  divider('d-zoom'),
  ...ZOOM_CONTROL_ITEMS,
  divider('d-fit'),
  FIT_ITEM,
];

/** Theme light / dark. Needs `<CanvasThemeSync>` under a `<ThemeProvider>` (`GraphCanvasApp` mounts both). */
export const THEME_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'toggle', key: 'theme', command: 'theme.toggle', icon: 'moon', activeIcon: 'sun', label: 'Switch to dark theme', activeLabel: 'Switch to light theme' },
];

// ── App modes ─────────────────────────────────────────────────────────────

/** A plain canvas: zoom in / out · fit · reset · lock · grid. Engine commands only. */
export const CANVAS_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
  { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
  FIT_ITEM,
  RESET_ITEM,
  divider('d-lock'),
  LOCK_ITEM,
  ...GRID_CONTROL_ITEMS,
];

/**
 * Read-only graph exploring: layout · select mode · edge routing · fit · lock.
 * No history or delete — nothing here edits the graph. Needs a `GraphCanvas`.
 */
export const EXPLORER_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  ...LAYOUT_CONTROL_ITEMS,
  divider('d-select'),
  ...SELECT_MODE_CONTROL_ITEMS,
  ...EDGE_TYPE_CONTROL_ITEMS,
  divider('d-view'),
  FIT_ITEM,
  LOCK_ITEM,
];

/**
 * Graph modelling: tool (select / add / connect / delete) · node shape (while
 * adding) · undo / redo · delete selection · clear · fit. The serialisable
 * counterpart of `ModellerToolbar`. The tool works on any `GraphCanvas`; draw
 * behaviours follow it through their `modes`. History and delete need
 * `<GraphHistoryProvider>` / `<GraphClipboardProvider>`. Give the shape picker its kinds by copying the item
 * with `args: { kinds: { circle: 'Circle', … } }`.
 */
export const MODELLER_CONTROL_ITEMS: readonly ControlItemSpec[] = [
  { type: 'choice', key: 'tool', command: 'tool.active', label: 'Tool', display: 'segmented' },
  { type: 'choice', key: 'node-kind', command: 'tool.nodeKind', label: 'Shape' },
  divider('d-history'),
  ...HISTORY_CONTROL_ITEMS,
  divider('d-edit'),
  { type: 'command', key: 'delete', command: 'clipboard.delete', icon: 'eraser', label: 'Delete selection' },
  { type: 'command', key: 'clear', command: 'graph.clear', icon: 'trash', label: 'Clear canvas' },
  divider('d-view'),
  FIT_ITEM,
];
