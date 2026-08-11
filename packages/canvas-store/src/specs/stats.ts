/**
 * Renderer-reported statistics. Fields are advisory and backend-specific.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

export interface RenderStats {
  readonly shapes: number;
  readonly connectors: number;
  readonly animatedDecorations: number;
}
