/**
 * Story-only OS dark-mode follow for imperative `play()` stories.
 *
 * The engine is theme-agnostic — it holds one concrete config and knows nothing
 * about light/dark. {@link SystemThemeBehaviour} is the *external* piece:
 * registered like any behaviour, its `light` / `dark` patches live in the
 * serialisable `init` config, and it applies them through the context it
 * already receives on each `prefers-color-scheme` flip.
 *
 * React (`<Canvas>`) stories use `useSystemTheme` from `@invana/canvas-react`.
 */

import { Behaviour } from '@invana/canvas';

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
 * Themes a single layer (the behaviour's `targetLayerId`) responsively. Register it
 * with the target layer — `new SystemThemeBehaviour({ id: 'theme', targetLayerId: 'bg' })`
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
    if (!this.targetLayerId) return;
    (this.ctx?.layers.get(this.targetLayerId) as { setOptions?: (o: unknown) => void } | undefined)
      ?.setOptions?.(style);
  }
}
