/**
 * Type-only stub for `@invana/styling/themes.config`.
 *
 * `@invana/styling@0.0.6` maps its `./themes.config` subpath export straight at
 * raw, **un-compiled** `src/themes.config.ts` (no shipped `.d.ts`). `tsc` then
 * pulls that source into the program and reports the package's own latent type
 * errors (a `noUncheckedIndexedAccess` slip around line 134) — and because it's
 * a `.ts`, `skipLibCheck` can't suppress them.
 *
 * `@invana/themes`' published `.d.ts` (which `<GraphCanvasLiteApp>` imports for
 * `AppLayoutBase`) only needs the `Theme` / `ThemeVariant` *types* from it. The
 * tsconfig `paths`-redirects the specifier to this file (`tsc`-only; the bundler
 * still resolves the real module at runtime), so `tsc` sees these hand-written
 * declarations instead of the broken source. Mirror of the upstream shapes —
 * keep in sync, and delete the redirect + this file once the dependency ships
 * compiled types. (Sibling of the identical stub in `apps/storybook/types/`.)
 */

export interface ThemeVariant {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'system';
  icon?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  variants: ThemeVariant[];
}

export declare const themes: Theme[];
export declare function getAllThemeVariants(): ThemeVariant[];
export declare function getThemeById(id: string): Theme | undefined;
export declare function getThemeVariantById(
  id: string,
): { theme: Theme; variant: ThemeVariant } | undefined;
export declare function getDefaultThemeVariant(): ThemeVariant;
export declare function applyTheme(variantId: string): void;
export declare function getStorybookThemeItems(): unknown;
