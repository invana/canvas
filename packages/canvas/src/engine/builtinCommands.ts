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
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { CanvasCommand, CommandRegistry, Rect } from '@invana/canvas-core';

import type { BackgroundLayer } from '../layers/BackgroundLayer';

import type { Canvas } from './Canvas';

/** Default zoom step for `camera.zoomIn` / `camera.zoomOut`. */
const ZOOM_STEP = 1.2;
/** Default `camera.zoomTo` levels, as scale factors. */
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 4];
/** Behaviours `view.lock` disables by default — pan + node drag; zoom stays live. */
const DEFAULT_LOCK_IDS = ['pan', 'drag-node'];

/** Read a field off a JSON `args` bag, or `undefined`. */
function arg<T>(args: unknown, key: string): T | undefined {
  return args && typeof args === 'object' ? ((args as Record<string, unknown>)[key] as T | undefined) : undefined;
}

/** The ids `view.lock` targets that are actually registered. */
function lockIds(canvas: Canvas, args: unknown): string[] {
  return (arg<string[]>(args, 'behaviourIds') ?? DEFAULT_LOCK_IDS).filter((id) => canvas.behaviours.has(id));
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

const BUILTIN_COMMANDS: Record<string, CanvasCommand<Canvas>> = {
  'camera.zoomIn': {
    label: 'Zoom in',
    run: (canvas, args) => canvas.camera.zoomAt(arg<number>(args, 'factor') ?? ZOOM_STEP),
    isEnabled: whenInitialised,
  },
  'camera.zoomOut': {
    label: 'Zoom out',
    run: (canvas, args) => canvas.camera.zoomAt(1 / (arg<number>(args, 'factor') ?? ZOOM_STEP)),
    isEnabled: whenInitialised,
  },
  'camera.fit': {
    label: 'Fit to content',
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
    run: (canvas, args) => canvas.camera.pan(arg<number>(args, 'dx') ?? 0, arg<number>(args, 'dy') ?? 0),
    isEnabled: whenInitialised,
  },
  'camera.zoomTo': {
    label: 'Zoom to',
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
    // Locked ⇔ every targeted behaviour that exists is disabled.
    isActive: (canvas, args) => {
      const ids = lockIds(canvas, args);
      return ids.length > 0 && ids.every((id) => !canvas.behaviours.get(id)?.enabled);
    },
    isEnabled: (canvas, args) => lockIds(canvas, args).length > 0,
    // Through the registry, so `scene:behaviour:enable`/`disable` fire and a
    // bound toggle re-renders.
    run: (canvas, args) => {
      const lock = !BUILTIN_COMMANDS['view.lock']!.isActive!(canvas, args);
      for (const id of lockIds(canvas, args)) canvas.behaviours.setEnabled(id, !lock);
    },
  },
  'layout.run': {
    label: 'Run layout',
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
  'layout.toggle': {
    label: 'Run layout',
    isActive: (canvas) => canvas.store.view.getState().runtime.layout.running,
    isEnabled: (canvas, args) =>
      canvas.store.view.getState().runtime.layout.running || BUILTIN_COMMANDS['layout.run']!.isEnabled!(canvas, args),
    run: (canvas, args) => {
      if (canvas.store.view.getState().runtime.layout.running) canvas.stopLayout();
      else BUILTIN_COMMANDS['layout.run']!.run(canvas, args);
    },
  },
};

/** Register every built-in command on `registry`. */
export function registerBuiltinCommands(registry: CommandRegistry<Canvas>): void {
  for (const [name, command] of Object.entries(BUILTIN_COMMANDS)) registry.register(name, command);
}
