/**
 * Control-item **spec builders** for the `*Toolbar`s. A toolbar describes its
 * controls as `ControlItemSpec`s (the same data a saved control panel holds) and
 * draws them through `useControlItems` — so a toolbar and a panel built from the
 * same specs can't drift. Each builder takes the toolbar's own props, which is
 * why these are functions rather than the static `*_CONTROL_ITEMS` presets.
 *
 * Item `key`s are the toolbars' historical keys (`'undo'`, `'fit'`, `'lock'`,
 * …): their `icons` override props match on them.
 *
 * @internal
 */

import type { ControlItemSpec } from '@invana/canvas';

/** Join non-empty groups with dividers (no leading / trailing / doubled dividers). */
export function joinGroups(groups: readonly (readonly ControlItemSpec[])[]): ControlItemSpec[] {
  const present = groups.filter((g) => g.length > 0);
  return present.flatMap((g, i) => (i === 0 ? [...g] : [{ type: 'divider', key: `d${i}` } as ControlItemSpec, ...g]));
}

/** Zoom in / out (`camera.zoomIn` / `camera.zoomOut`). */
export function zoomSpecs(): ControlItemSpec[] {
  return [
    { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
    { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
  ];
}

/** Fit the camera to one layer's bounds (`camera.fit { layerId }`). */
export function fitSpec(layerId: string): ControlItemSpec {
  return { type: 'command', key: 'fit', command: 'camera.fit', args: { layerId }, icon: 'maximize', label: 'Fit to content' };
}

/** Lock / unlock the view (`view.lock`); `behaviourIds` overrides the default pan + drag-node. */
export function lockSpec(behaviourIds?: readonly string[]): ControlItemSpec {
  return {
    type: 'toggle',
    key: 'lock',
    command: 'view.lock',
    ...(behaviourIds ? { args: { behaviourIds: [...behaviourIds] } } : {}),
    icon: 'lock-open',
    activeIcon: 'lock',
    label: 'Lock view',
    activeLabel: 'Unlock view',
  };
}

/** Undo / redo (`history.*` — over graph edits too on a `GraphCanvas`). */
export function historySpecs(): ControlItemSpec[] {
  return [
    { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo' },
    { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo' },
  ];
}

/**
 * Selection-aware erase (`graph.erase`): "Clear canvas", or "Erase selection"
 * with a "Selection" caption while something is selected.
 */
export function eraseSpec(opts: { icon: string; layerId?: string; clickSelectId?: string }): ControlItemSpec {
  const args = {
    ...(opts.layerId ? { layerId: opts.layerId } : {}),
    ...(opts.clickSelectId ? { clickSelectId: opts.clickSelectId } : {}),
  };
  return {
    type: 'command',
    key: 'erase',
    command: 'graph.erase',
    ...(Object.keys(args).length > 0 ? { args } : {}),
    icon: opts.icon,
    label: 'Clear canvas',
    activeLabel: 'Erase selection',
    activeText: 'Selection',
  };
}

/** Background grid on / off (`background.grid`). */
export function gridSpec(opts: { layerId?: string; patternType?: string } = {}): ControlItemSpec {
  const args = {
    ...(opts.layerId ? { layerId: opts.layerId } : {}),
    ...(opts.patternType ? { patternType: opts.patternType } : {}),
  };
  return {
    type: 'toggle',
    key: 'grid',
    command: 'background.grid',
    ...(Object.keys(args).length > 0 ? { args } : {}),
    icon: 'grid',
    label: 'Toggle grid',
  };
}
