/**
 * Story-only OS dark-mode follow.
 *
 * The engine is theme-agnostic — it holds one concrete config and knows nothing
 * about light/dark. These helpers are the *external* piece that watches
 * `prefers-color-scheme` and pushes a concrete config patch in:
 *
 * - {@link SystemThemeBehaviour} for imperative `play()` stories — registered
 *   like any behaviour; its `light` / `dark` patches live in the serialisable
 *   `init` config, and it applies them through the context it already receives.
 * - {@link useSystemTheme} for React (`<Canvas>`) stories.
 */

import { useEffect } from 'react';
import { Behaviour, type CanvasConfig } from '@invana/canvas';
import { useCanvas } from '@invana/canvas-react';

/** Theme styling applied to the target layer per scheme. */
export interface ThemeStyle {
  backgroundColor?: string | number;
  color?: string | number;
}

function watchScheme(apply: (dark: boolean) => void): () => void {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const run = () => apply(mq.matches);
  run();
  mq.addEventListener('change', run);
  return () => mq.removeEventListener('change', run);
}

/**
 * Themes a single layer (the behaviour's `layerId`) responsively. Register it
 * with the target layer — `new SystemThemeBehaviour({ id: 'theme', layerId: 'bg' })`
 * — and set its `light` / `dark` styles in the serialisable `init` config
 * (`behaviours: { theme: { enabled: true, light: {...}, dark: {...} } }`). On
 * each OS-scheme flip it pushes the matching style to the layer via `setOptions`.
 */
export class SystemThemeBehaviour extends Behaviour {
  private light: ThemeStyle = {};
  private dark: ThemeStyle = {};
  private off: (() => void) | null = null;

  setOptions(patch: { light?: ThemeStyle; dark?: ThemeStyle }): void {
    if (patch.light) this.light = patch.light;
    if (patch.dark) this.dark = patch.dark;
  }

  protected override onRegister(): void {
    /* nothing to wire until enabled */
  }

  protected override onEnable(): void {
    this.off = watchScheme((dark) => this.apply(dark ? this.dark : this.light));
  }

  protected override onDisable(): void {
    this.off?.();
    this.off = null;
  }

  private apply(style: ThemeStyle): void {
    if (!this.layerId) return;
    (this.ctx?.layers.get(this.layerId) as { setOptions?: (o: unknown) => void } | undefined)
      ?.setOptions?.(style);
  }
}

/** React stories: `useSystemTheme(lightConfig, darkConfig)`. */
export function useSystemTheme(light: CanvasConfig, dark: CanvasConfig): void {
  const canvas = useCanvas();
  useEffect(() => watchScheme((d) => canvas.update(d ? dark : light)), [canvas, light, dark]);
}
