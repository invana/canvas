/**
 * Shared layer utilities for stories.
 *
 * `GenericLayer`  — bare `WorldLayer`. No renderer, no opinions. Used by
 *                   stories that paint into a `Graphics` directly via the
 *                   low-level `draw` module (e.g. `Renderer/Draw/*`).
 *
 * `RendererLayer` — `GenericLayer` + a `renderer: ShapesRenderer` field
 *                   wired up on mount. Used by stories that exercise the
 *                   registry-managed entity flow (e.g. `Renderer/Shapes/*`,
 *                   `Renderer/Connectors/*`, `Renderer/Markers/*`, etc.).
 *
 *                   Accepts an optional `textureRegistry` in `options` so
 *                   stories that preload textures can share the registry with
 *                   the renderer (e.g. `Images.stories.ts`).
 *
 * Both opt out of hit-testing (return `null`) — stories that need it can
 * subclass and override.
 */

import { ShapesRenderer, TextureRegistry, WorldLayer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

/** Minimal `WorldLayer` — no renderer, no hit-test. */
export class GenericLayer extends WorldLayer {
  protected createState(): object {
    return {};
  }
  hitTest(): null {
    return null;
  }
}

/** `WorldLayer` with a `ShapesRenderer` wired up on mount. */
export class RendererLayer extends WorldLayer<{ textureRegistry?: TextureRegistry }> {
  renderer!: ShapesRenderer;
  protected createState(): object {
    return {};
  }
  protected override onMount(ctx: CanvasContext): void {
    this.renderer = new ShapesRenderer({
      subLayer: this.subLayer,
      camera: ctx.camera,
      textureRegistry: this.options.textureRegistry,
    });
  }
  hitTest(): null {
    return null;
  }
}
