import type { ControlItemSpec } from '@invana/canvas';

/**
 * Serialisable **control-panel presets** — ready-made `ControlItemSpec[]` built
 * only from the engine's built-in commands and the default icon / widget
 * registries, so a panel made from them saves, exports and loads intact.
 *
 * Spread them to compose: `items={[...ZOOM_CONTROL_ITEMS, { type: 'divider' }, …]}`.
 */

/** Zoom out · live zoom % · zoom in. */
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
