/**
 * Accent resolution — pull the host app's live primary colour off a CSS custom
 * property so the canvas accent role tracks the design-kit theme.
 */

/**
 * Parse a CSS colour string into a `0xRRGGBB` number. Handles `#rgb`, `#rrggbb`,
 * and `rgb()/rgba()` forms (alpha dropped). Returns `undefined` for anything it
 * can't read so callers fall back to the palette's own accent.
 */
export function cssColorToNumber(input: string | null | undefined): number | undefined {
  if (!input) return undefined;
  const s = input.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      const n = Number.parseInt(hex.slice(0, 6), 16);
      return Number.isNaN(n) ? undefined : n;
    }
    return undefined;
  }
  const m = s.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) {
    const r = Number(m[1]) & 0xff;
    const g = Number(m[2]) & 0xff;
    const b = Number(m[3]) & 0xff;
    return (r << 16) | (g << 8) | b;
  }
  return undefined;
}

/**
 * Read a CSS custom property (default `--color-primary`) off the document root
 * and parse it to a number. SSR-safe (`undefined` when there's no `document`).
 */
export function resolveAccentVar(varName = '--color-primary'): number | undefined {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return undefined;
  const root = document.documentElement;
  if (!root) return undefined;
  const raw = getComputedStyle(root).getPropertyValue(varName);
  return cssColorToNumber(raw);
}
