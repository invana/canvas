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

/*
 * Resolved colours, keyed by the root's theme stamp. A probe forces a style
 * recalc, so reads are cached; a theme or mode switch changes the root's class
 * or inline style, so the stamp changes and the next read resolves again.
 */
let cacheStamp = '';
const cache = new Map<string, number | undefined>();

/**
 * Resolve any CSS colour — `var(--token)`, `hsl(…)`, `oklch(…)`, a hex, a name —
 * to a `0xRRGGBB` number, as the browser computes it against the document root
 * (where the theme class lives). `undefined` with no DOM, or for a value the
 * browser does not take as a colour.
 *
 * @example
 * ```ts
 * readCssColor('var(--color-primary)'); // 0x16a34a under the default theme
 * ```
 */
export function readCssColor(css: string): number | undefined {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return undefined;
  const root = document.documentElement;
  if (!root) return undefined;
  const stamp = `${root.className}|${root.getAttribute('style') ?? ''}`;
  if (stamp !== cacheStamp) {
    cacheStamp = stamp;
    cache.clear();
  }
  if (cache.has(css)) return cache.get(css);
  const probe = document.createElement('span');
  probe.style.color = css;
  probe.style.display = 'none';
  // An unparseable value leaves `style.color` empty: not a colour.
  const taken = probe.style.color !== '';
  root.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  const out = taken ? cssColorToNumber(rgb) : undefined;
  cache.set(css, out);
  return out;
}

/**
 * Read a CSS custom property (default `--color-primary`) as a colour number —
 * in any form the browser takes (`hsl`, `oklch`, hex). SSR-safe.
 */
export function resolveAccentVar(varName = '--color-primary'): number | undefined {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function' || !document.documentElement) return undefined;
  // An unset property would resolve to the inherited colour; it is no accent.
  if (!getComputedStyle(document.documentElement).getPropertyValue(varName).trim()) return undefined;
  return readCssColor(`var(${varName})`);
}
