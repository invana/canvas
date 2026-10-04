/**
 * Type-only stub for `@invana/styling/themes.config`.
 *
 * `@invana/styling@0.0.19` maps its `./themes.config` subpath export straight at
 * raw, **un-compiled** `src/themes.config.ts` (no shipped `.d.ts`). `@invana/themes`'
 * published `index.d.ts` imports that specifier, so `tsc` pulls the source into
 * this package's program and reports the dependency's own latent type errors (a
 * `noUncheckedIndexedAccess` slip at `getDefaultThemeVariant`, line 114) — and
 * because it's a `.ts`, `skipLibCheck` can't suppress them.
 *
 * The tsconfig `paths`-redirects the specifier here (`tsc`-only; bundlers still
 * resolve the real module at runtime), so `tsc` sees these hand-written
 * declarations instead of the broken source. Mirror of the upstream shapes —
 * keep in sync, and delete the redirect + this file once the dependency ships
 * compiled types.
 *
 * Twin of `apps/storybook/types/styling-themes-config.d.ts`, which solves the
 * same problem for the storybook program.
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
