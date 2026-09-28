/**
 * The engine's built-in {@link CanvasCommand}s — registered on every `Canvas`'s
 * `commands` registry at construction, so a serialised control panel can drive
 * the camera, lock the view and run layouts with zero app code.
 *
 * | Name | Args | Kind |
 * |---|---|---|
 * | `camera.zoomIn` / `camera.zoomOut` | `{ factor? }` (default `1.2`) | button |
 * | `camera.fit` | `{ padding?, layerId? }` (default `80`; `layerId` fits that layer's bounds instead of all content) | button |
 * | `camera.pan` | `{ dx?, dy? }` screen px — the **content** moves by `(dx, dy)` | button |
 * | `camera.zoomTo` | `{ value?, levels? }` (default `1`) | button (`value` fixed) or choice over `levels` (default 25–400 %, plus the current zoom when it's between levels) |
 * | `camera.reset` | — | button: zoom 1, world origin at the viewport centre |
 * | `behaviour.toggle` | `{ id }` | toggle, active while behaviour `id` is enabled |
 * | `view.lock` | `{ behaviourIds? }` (default `['pan', 'drag-node']`) | toggle |
 * | `layout.run` | `{ id? }` (default: the active layout) | button |
 * | `layout.stop` | — | button, enabled while a layout runs |
 * | `layout.toggle` | `{ id? }` | button: stops a running layout, else runs `id` / the active one; active while running (a Run ⇄ Stop face) |
 * | `layout.activate` | `{ value }` | choice over the registered layouts; value = `activeLayout` |
 * | `background.grid` | `{ layerId?, patternType? }` (default `'background'`) | toggle, active while the background is a pattern |
 * | `layer.visible` | `{ id }` | toggle, active while layer `id` is visible |
 * | `history.undo` / `history.redo` | — | button over `canvas.history` (definition edits); `GraphCanvas` (or a `GraphHistoryProvider` on a plain canvas) overrides both to also cover graph edits |
 *
 * Each command also describes its args as data (`CanvasCommand.args`), so the
 * Studio's control-panel editor draws a field per key.
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { CanvasCommand, CommandArgSpec, CommandRegistry, Rect } from '@invana/canvas-core';

import type { BackgroundLayer } from '../layers/BackgroundLayer';

import type { Canvas } from './Canvas';
import { canLockView, isViewLocked, setViewLocked } from './viewLock';

/** Default zoom step for `camera.zoomIn` / `camera.zoomOut`. */
const ZOOM_STEP = 1.2;
/** Default `camera.zoomTo` levels, as scale factors. */
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];
/** Behaviours `view.lock` disables by default — shown as the arg's default (the rule is `viewLock.ts`). */
const DEFAULT_LOCK_IDS = ['pan', 'drag-node'];

/** Read a field off a JSON `args` bag, or `undefined`. */
function arg<T>(args: unknown, key: string): T | undefined {
  return args && typeof args === 'object' ? ((args as Record<string, unknown>)[key] as T | undefined) : undefined;
}

/** The background layer `background.grid` targets. */
function backgroundId(args: unknown): string {
  return arg<string>(args, 'layerId') ?? 'background';
}

/** A zoom level as a `camera.zoomTo` option value (`'1'`, `'0.5'`). */
const levelValue = (zoom: number): string => String(zoom);

/** The levels `camera.zoomTo` offers — `args.levels` or {@link ZOOM_LEVELS}. */
function zoomLevels(args: unknown): number[] {
  const levels = arg<number[]>(args, 'levels');
  return Array.isArray(levels) && levels.length > 0 ? levels : ZOOM_LEVELS;
}

/** The camera's zoom rounded to 2 dp, so a level it just landed on matches exactly. */
const currentLevel = (canvas: Canvas): number => Math.round(canvas.camera.scale * 100) / 100;

/** Enabled only once the engine has a camera. */
const whenInitialised = (canvas: Canvas): boolean => canvas.isInitialised;

const FACTOR_ARG: Record<string, CommandArgSpec> = {
  factor: { kind: 'number', label: 'Factor', default: ZOOM_STEP, description: 'Zoom step per click' },
};

/**
 * The engine's commands and their `args` — the command map (`CommandMap`) that types
 * `canvas.commands` (`canvas.commands.run('camera.fit', { padding: 40 })` is
 * checked; any other name still takes `unknown`). Keys match the table above;
 * the built-in registrations below are checked against it.
 */
export interface EngineCommandMap {
  'camera.zoomIn': { factor?: number } | undefined;
  'camera.zoomOut': { factor?: number } | undefined;
  'camera.fit': { padding?: number; layerId?: string } | undefined;
  'camera.pan': { dx?: number; dy?: number } | undefined;
  /** A picker hands `value` back as a string; a fixed-level button passes a number. */
  'camera.zoomTo': { value?: number | string; levels?: number[] } | undefined;
  'camera.reset': undefined;
  'behaviour.toggle': { id: string };
  'view.lock': { behaviourIds?: string[] } | undefined;
  'layout.run': { id?: string } | undefined;
  'layout.stop': undefined;
  'layout.toggle': { id?: string } | undefined;
  'layout.activate': { value?: string } | undefined;
  'background.grid': { layerId?: string; patternType?: 'dots' | 'grid' | 'lines' } | undefined;
  'layer.visible': { id: string };
  /** `layerId` is read by `GraphCanvas`'s override (which layer's graph history); the engine's ignores it. */
  'history.undo': { layerId?: string } | undefined;
  'history.redo': { layerId?: string } | undefined;
}

/** Each built-in, typed by its {@link EngineCommandMap} entry. */
type BuiltinCommands = { [K in keyof EngineCommandMap]: CanvasCommand<Canvas, EngineCommandMap[K]> };

const BUILTIN_COMMANDS: BuiltinCommands = {
  'camera.zoomIn': {
    label: 'Zoom in',
    args: FACTOR_ARG,
    run: (canvas, args) => canvas.camera.zoomAt(arg<number>(args, 'factor') ?? ZOOM_STEP),
    isEnabled: whenInitialised,
  },
  'camera.zoomOut': {
    label: 'Zoom out',
    args: FACTOR_ARG,
    run: (canvas, args) => canvas.camera.zoomAt(1 / (arg<number>(args, 'factor') ?? ZOOM_STEP)),
    isEnabled: whenInitialised,
  },
  'camera.fit': {
    label: 'Fit to content',
    args: {
      padding: { kind: 'number', label: 'Padding', default: 80 },
      layerId: { kind: 'layer', label: 'Layer', description: 'Fit this layer instead of all content' },
    },
    run: (canvas, args) => {
      const padding = arg<number>(args, 'padding');
      const layerId = arg<string>(args, 'layerId');
      if (layerId === undefined) return canvas.fitView(padding);
      const layer = canvas.layers.get(layerId) as { getBounds?: () => Rect } | undefined;
      if (typeof layer?.getBounds === 'function') canvas.camera.fitContent(layer.getBounds(), padding ?? 80);
    },
    isEnabled: whenInitialised,
  },
  'camera.pan': {
    label: 'Pan',
    args: {
      dx: { kind: 'number', label: 'Δx (px)', default: 0 },
      dy: { kind: 'number', label: 'Δy (px)', default: 0 },
    },
    run: (canvas, args) => canvas.camera.pan(arg<number>(args, 'dx') ?? 0, arg<number>(args, 'dy') ?? 0),
    isEnabled: whenInitialised,
  },
  'camera.zoomTo': {
    label: 'Zoom to',
    args: {
      value: { kind: 'number', label: 'Zoom', default: 1, pick: true },
      levels: { kind: 'json', label: 'Levels', default: ZOOM_LEVELS, description: 'Zoom factors the picker offers' },
    },
    // A picker's `value` arrives as a string; a fixed-level button passes a number.
    run: (canvas, args) => {
      const zoom = Number(arg<number | string>(args, 'value') ?? 1);
      if (Number.isFinite(zoom) && zoom > 0) canvas.camera.setZoom(zoom);
    },
    isEnabled: whenInitialised,
    // The current zoom, to 2 dp. When it sits between levels `options` adds it,
    // so the picker reads "137%" rather than a wrong level.
    value: (canvas) => (canvas.isInitialised ? levelValue(currentLevel(canvas)) : null),
    options: (canvas, args) => {
      const levels = zoomLevels(args);
      const current = canvas.isInitialised ? currentLevel(canvas) : null;
      const all = current === null || levels.includes(current) ? levels : [...levels, current].sort((a, b) => a - b);
      return all.map((l) => ({ value: levelValue(l), label: `${Math.round(l * 100)}%` }));
    },
  },
  'camera.reset': {
    label: 'Reset view',
    run: (canvas) => {
      const cam = canvas.camera;
      cam.setTransform({ x: cam.screenWidth / 2, y: cam.screenHeight / 2, zoom: 1 });
    },
    isEnabled: whenInitialised,
  },
  'behaviour.toggle': {
    label: 'Toggle behaviour',
    args: { id: { kind: 'behaviour', label: 'Behaviour', required: true } },
    isActive: (canvas, args) => {
      const id = arg<string>(args, 'id');
      return id ? canvas.behaviours.get(id)?.enabled === true : false;
    },
    isEnabled: (canvas, args) => {
      const id = arg<string>(args, 'id');
      return !!id && canvas.behaviours.has(id);
    },
    // Through the registry, so `scene:behaviour:enable`/`disable` fire and a
    // bound toggle re-renders.
    run: (canvas, args) => {
      const id = arg<string>(args, 'id');
      const b = id ? canvas.behaviours.get(id) : undefined;
      if (id && b) canvas.behaviours.setEnabled(id, !b.enabled);
    },
  },
  'view.lock': {
    label: 'Lock view',
    args: { behaviourIds: { kind: 'strings', label: 'Behaviours', default: DEFAULT_LOCK_IDS } },
    // The rule is `viewLock.ts`, shared with `useLock`.
    isActive: (canvas, args) => isViewLocked(canvas, arg<string[]>(args, 'behaviourIds')),
    isEnabled: (canvas, args) => canLockView(canvas, arg<string[]>(args, 'behaviourIds')),
    run: (canvas, args) => {
      const ids = arg<string[]>(args, 'behaviourIds');
      setViewLocked(canvas, !isViewLocked(canvas, ids), ids);
    },
  },
  'layout.run': {
    label: 'Run layout',
    args: { id: { kind: 'layout', label: 'Layout', description: 'Default: the active layout' } },
    run: (canvas, args) => {
      const id = arg<string>(args, 'id');
      void (id ? canvas.runLayout(id) : canvas.runActiveLayout());
    },
    isEnabled: (canvas, args) => {
      const id = arg<string>(args, 'id');
      return id ? canvas.layouts.has(id) : canvas.store.view.getState().definition.activeLayout !== null;
    },
  },
  'layout.activate': {
    label: 'Layout',
    args: { value: { kind: 'layout', label: 'Layout', pick: true } },
    value: (canvas) => canvas.store.view.getState().definition.activeLayout,
    options: (canvas) => canvas.layouts.list().map((l) => ({ value: l.id, label: l.id })),
    isEnabled: (canvas) => canvas.layouts.list().length > 0,
    // Record it, then run it. A domain facade that auto-runs `activeLayout`
    // (`GraphCanvas`) overrides this to skip the second run.
    run: (canvas, args) => {
      const id = arg<string>(args, 'value');
      if (!id || !canvas.layouts.has(id)) return;
      canvas.update({ activeLayout: id });
      void canvas.runLayout(id);
    },
  },
  'background.grid': {
    label: 'Toggle grid',
    args: {
      layerId: { kind: 'layer', label: 'Layer', default: 'background' },
      patternType: {
        kind: 'enum',
        label: 'Pattern',
        options: [
          { value: 'dots', label: 'Dots' },
          { value: 'grid', label: 'Grid' },
          { value: 'lines', label: 'Lines' },
        ],
      },
    },
    // Read the definition first — `canvas.update` writes it, so the toggle
    // follows every write path — falling back to the layer's own options.
    isActive: (canvas, args) => {
      const id = backgroundId(args);
      const fromDefinition = canvas.store.view.getState().definition.layers[id]?.type;
      const type = fromDefinition ?? canvas.layers.get<BackgroundLayer>(id)?.getOptions().type;
      return type === 'pattern';
    },
    isEnabled: (canvas, args) => canvas.layers.has(backgroundId(args)),
    run: (canvas, args) => {
      const id = backgroundId(args);
      const on = !BUILTIN_COMMANDS['background.grid']!.isActive!(canvas, args);
      const patternType = arg<string>(args, 'patternType');
      canvas.update({ layers: { [id]: { type: on ? 'pattern' : 'solid', ...(on && patternType ? { patternType } : {}) } } });
    },
  },
  'layout.stop': {
    label: 'Stop layout',
    run: (canvas) => canvas.stopLayout(),
    isEnabled: (canvas) => canvas.store.view.getState().runtime.layout.running,
  },
  'history.undo': {
    label: 'Undo',
    isEnabled: (canvas) => canvas.history.canUndo(),
    run: (canvas) => canvas.history.undo(),
  },
  'history.redo': {
    label: 'Redo',
    isEnabled: (canvas) => canvas.history.canRedo(),
    run: (canvas) => canvas.history.redo(),
  },
  'layer.visible': {
    label: 'Show layer',
    args: { id: { kind: 'layer', label: 'Layer', required: true } },
    isActive: (canvas, args) => {
      const id = arg<string>(args, 'id');
      return id ? canvas.layers.get(id)?.visible === true : false;
    },
    isEnabled: (canvas, args) => {
      const id = arg<string>(args, 'id');
      return !!id && canvas.layers.has(id);
    },
    run: (canvas, args) => {
      const id = arg<string>(args, 'id');
      const layer = id ? canvas.layers.get(id) : undefined;
      if (!layer) return;
      // `setVisible` emits `scene:layer:visibilitychange`, which the canvas
      // bridges to `commands.invalidate()` — bound toggles re-read.
      layer.setVisible(!layer.visible);
    },
  },
  'layout.toggle': {
    label: 'Run layout',
    args: { id: { kind: 'layout', label: 'Layout', description: 'Default: the active layout' } },
    isActive: (canvas) => canvas.store.view.getState().runtime.layout.running,
    isEnabled: (canvas, args) =>
      canvas.store.view.getState().runtime.layout.running || BUILTIN_COMMANDS['layout.run']!.isEnabled!(canvas, args),
    run: (canvas, args) => {
      if (canvas.store.view.getState().runtime.layout.running) canvas.stopLayout();
      else BUILTIN_COMMANDS['layout.run']!.run(canvas, args);
    },
  },
};

/** Palette / menu metadata per built-in (`CanvasCommand.category` / `.keywords`). */
const BUILTIN_META: { [K in keyof EngineCommandMap]: Pick<CanvasCommand<Canvas>, 'category' | 'keywords'> } = {
  'camera.zoomIn': { category: 'Camera', keywords: ['magnify', 'bigger'] },
  'camera.zoomOut': { category: 'Camera', keywords: ['smaller'] },
  'camera.fit': { category: 'Camera', keywords: ['frame', 'zoom to fit', 'show all'] },
  'camera.pan': { category: 'Camera', keywords: ['move', 'scroll'] },
  'camera.zoomTo': { category: 'Camera', keywords: ['zoom level', 'percent'] },
  'camera.reset': { category: 'Camera', keywords: ['home', 'actual size', 'origin'] },
  'behaviour.toggle': { category: 'Behaviours' },
  'view.lock': { category: 'View', keywords: ['freeze', 'pin view'] },
  'layout.run': { category: 'Layout', keywords: ['arrange', 'start'] },
  'layout.stop': { category: 'Layout', keywords: ['halt', 'pause'] },
  'layout.toggle': { category: 'Layout', keywords: ['run', 'stop'] },
  'layout.activate': { category: 'Layout', keywords: ['switch layout'] },
  'background.grid': { category: 'View', keywords: ['dots', 'lines', 'pattern'] },
  'layer.visible': { category: 'View', keywords: ['show', 'hide'] },
  'history.undo': { category: 'Edit', keywords: ['revert', 'back'] },
  'history.redo': { category: 'Edit', keywords: ['again', 'forward'] },
};

/** Register every built-in command on `registry`, with its palette metadata. */
export function registerBuiltinCommands(registry: CommandRegistry<Canvas>): void {
  for (const [name, command] of Object.entries(BUILTIN_COMMANDS)) {
    registry.register(name, { ...BUILTIN_META[name as keyof EngineCommandMap], ...command });
  }
}
