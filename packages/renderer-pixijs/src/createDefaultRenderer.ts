/**
 * The entry point `Canvas.init` reaches for when no `renderer` was supplied.
 *
 * Kept as a tiny named export of its own so the engine's dynamic
 * `import('@invana/renderer-pixijs')` has a stable, side-effect-light target —
 * and so that resolving the default backend never depends on the shape of this
 * package's barrel (design D1, §4.6).
 */

import type { CanvasEventBus } from '@invana/canvas-store';
import { PixiRenderer } from './PixiRenderer';
import type { PixiRendererOptions } from './PixiRenderer';

/** Build the default pixi backend. `events` is the canvas-wide bus. */
export function createDefaultRenderer(opts: { events: CanvasEventBus } & Partial<PixiRendererOptions>): PixiRenderer {
  return new PixiRenderer(opts);
}
