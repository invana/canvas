/**
 * `IconRegistry` — name-keyed lookup for icon refs, modelled on the CSS
 * pattern for icon fonts.
 *
 * The CSS analogue:
 *
 *   <link rel="stylesheet" href="…fontawesome…/css/all.min.css">
 *   <i class="fa-solid fa-database"></i>
 *
 * The CSS file declares `@font-face` once, then a `.fa-solid` class that
 * sets `font-family`+`font-weight`, then a `.fa-database` selector with
 * `content: "\f1c0"`. Authors only ever type the human-readable name —
 * codepoints stay hidden.
 *
 * `IconRegistry` reproduces the same split:
 *
 *   1. `registerPack(name, { fontFamily, fontWeight?, fontStyle? })`
 *      — analogous to a `.fa-solid` class.
 *   2. `registerGlyphs(packName, { database: '', rocket: '', … })`
 *      — analogous to the per-icon `content` declarations.
 *   3. `registerSvg(name, { pathD, … })`
 *      — for SVG-path icons (e.g. Lucide).
 *
 * Shapes refer to icons via `IconRef.kind === 'ref'` with a `name` of
 * `'<pack>:<icon>'` for glyphs or `'<icon>'` for SVGs. The renderer
 * resolves the ref to a concrete `IconRef` at draw time.
 *
 * Created once (e.g. by the app), passed to `PrimitivesRenderer` via
 * `PrimitivesRendererOptions.iconRegistry`. The registry only describes
 * how to render — it does not load fonts or fetch SVGs (call
 * `loadFonts()` to await `document.fonts` for registered packs).
 */

import type { IconRef } from '../primitives/types';

export interface IconFontPack {
  readonly fontFamily: string;
  /**
   * CSS font-weight. Required for fonts that pack different glyph sets per
   * weight (e.g. Font Awesome 6 Free Solid is `900`, Regular is `400`).
   */
  readonly fontWeight?: number | string;
  readonly fontStyle?: 'normal' | 'italic';
}

type SvgDef = {
  readonly pathD: string;
  readonly viewBox?: { readonly width: number; readonly height: number };
  readonly strokeWidth?: number;
};

export class IconRegistry {
  private readonly packs = new Map<string, IconFontPack>();
  /** packName → (iconName → codepoint/char). */
  private readonly glyphs = new Map<string, Map<string, string>>();
  private readonly svgs = new Map<string, SvgDef>();

  /** Declare a font pack — analogous to a CSS class like `.fa-solid`. */
  registerPack(name: string, pack: IconFontPack): void {
    this.packs.set(name, pack);
    if (!this.glyphs.has(name)) this.glyphs.set(name, new Map());
  }

  /**
   * Register one or more glyph icons against a previously-declared pack.
   * `glyphs` maps the human-readable name → the codepoint character (use
   * `''` or the literal Private-Use char).
   */
  registerGlyphs(packName: string, glyphs: Record<string, string>): void {
    if (!this.packs.has(packName)) {
      throw new Error(
        `IconRegistry.registerGlyphs: pack "${packName}" not declared. ` +
          `Call registerPack("${packName}", …) first.`,
      );
    }
    const map = this.glyphs.get(packName)!;
    for (const [iconName, char] of Object.entries(glyphs)) map.set(iconName, char);
  }

  /** Register a single SVG icon (path-d). */
  registerSvg(name: string, def: SvgDef): void {
    this.svgs.set(name, def);
  }

  /**
   * Resolve a ref name to a concrete `IconRef` (always `glyph` or `svg`,
   * never `ref` — the registry never returns another lookup form).
   * Returns `undefined` when not found (callers throw with context).
   *
   *   `'fa-solid:database'` → glyph in pack `fa-solid` → `{ kind: 'glyph', … }`
   *   `'lucide-database'`   → svg                       → `{ kind: 'svg',   … }`
   */
  resolve(name: string): Exclude<IconRef, { kind: 'ref' }> | undefined {
    const colon = name.indexOf(':');
    if (colon > -1) {
      const packName = name.slice(0, colon);
      const iconName = name.slice(colon + 1);
      const pack = this.packs.get(packName);
      const char = this.glyphs.get(packName)?.get(iconName);
      if (!pack || char === undefined) return undefined;
      return {
        kind: 'glyph',
        char,
        fontFamily: pack.fontFamily,
        fontWeight: pack.fontWeight,
        fontStyle: pack.fontStyle,
      };
    }
    const svg = this.svgs.get(name);
    if (svg) return { kind: 'svg', ...svg };
    return undefined;
  }

  /**
   * Convenience: await `document.fonts.load()` for every registered pack
   * so `Text` rasterizes against the real webfont. Call once after the
   * stylesheet `<link>` has been injected and before the first shape
   * uses a glyph from the pack.
   */
  async loadFonts(): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) return;
    const probes: string[] = [];
    for (const pack of this.packs.values()) {
      const weight = pack.fontWeight ?? 'normal';
      const style = pack.fontStyle ?? 'normal';
      probes.push(`${style} ${weight} 16px "${pack.fontFamily}"`);
    }
    await Promise.all(probes.map((p) => document.fonts.load(p)));
  }
}
