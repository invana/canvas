/**
 * The engine's built-in {@link CanvasCommand}s — registered on every `Canvas`'s
 * `commands` registry at construction, so a serialised control panel can drive
 * the camera, lock the view and run layouts with zero app code.
 *
 * | Name | Args | Kind |
 * |---|---|---|
 * | `camera.zoomIn` / `camera.zoomOut` | `{ factor? }` (default `1.2`) | button |
 * | `camera.fit` | `{ padding? }` (default `80`) | button |
 * | `view.lock` | `{ behaviourIds? }` (default `['pan', 'drag-node']`) | toggle |
 * | `layout.run` | `{ id? }` (default: the active layout) | button |
 * | `layout.stop` | — | button, enabled while a layout runs |
 * | `layout.activate` | `{ value }` | choice over the registered layouts; value = `activeLayout` |
 * | `background.grid` | `{ layerId?, patternType? }` (default `'background'`) | toggle, active while the background is a pattern |
 *
 * Names are public API (`namespace.verb`): renaming one breaks saved panels.
 */

import type { CanvasCommand, CommandRegistry } from '@invana/canvas-core';

import type { BackgroundLayer } from '../layers/BackgroundLayer';

import type { Canvas } from './Canvas';

/** Default zoom step for `camera.zoomIn` / `camera.zoomOut`. */
const ZOOM_STEP = 1.2;
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
    run: (canvas, args) => canvas.fitView(arg<number>(args, 'padding')),
    isEnabled: whenInitialised,
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
};

/** Register every built-in command on `registry`. */
export function registerBuiltinCommands(registry: CommandRegistry<Canvas>): void {
  for (const [name, command] of Object.entries(BUILTIN_COMMANDS)) registry.register(name, command);
}
