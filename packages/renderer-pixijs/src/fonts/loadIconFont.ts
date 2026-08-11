/**
 * `loadIconFont` — inject an icon-font stylesheet at runtime, then await
 * font readiness so the very first paint rasterises against the real
 * webfont (not a fallback with the wrong metrics).
 *
 * The mechanic:
 *
 *   1. Attaching `<link rel="stylesheet" href=…>` kicks off:
 *      stylesheet download → CSS parse → `@font-face` registration → WOFF
 *      fetch.
 *   2. The browser's `FontFaceSet` only knows about the family **after**
 *      the `@font-face` declaration is parsed — calling
 *      `document.fonts.load(…)` before that returns an empty result.
 *   3. So we wait for the link's `load` event first, then ask the
 *      `FontFaceSet` to actually load the face.
 *
 * Vendor-agnostic: takes any stylesheet URL and any font-family name. The
 * canvas library does not know about Font Awesome / Material Symbols /
 * Phosphor / Heroicons / etc. — consumers point this at whichever icon
 * font (or regular webfont) they want.
 *
 * @example
 * ```ts
 * await loadIconFont(
 *   'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
 *   'Font Awesome 6 Free',
 * );
 * // now safe to render `{ kind: 'glyph', char: '', fontFamily: 'Font Awesome 6 Free', fontWeight: 900 }`.
 * ```
 *
 * Idempotent: subsequent calls with the same `stylesheetUrl` reuse the
 * existing `<link>` element. Safe to call from N stories that all use the
 * same icon font.
 *
 * SSR-safe: a no-op when `document` is undefined.
 */
export async function loadIconFont(
  stylesheetUrl: string,
  fontFamilyToProbe?: string,
  fontWeightToProbe?: number | string,
  fontStyleToProbe?: 'normal' | 'italic',
): Promise<void> {
  if (typeof document === 'undefined') return;

  const dedupeKey = encodeURIComponent(stylesheetUrl);
  await ensureStylesheet(stylesheetUrl, dedupeKey);

  if (fontFamilyToProbe && document.fonts) {
    // CSS font shorthand: [style] [weight] size family. Including the
    // weight matters for icon fonts that pack different glyph sets per
    // weight (e.g. Font Awesome 6 Free Solid = 900, Regular = 400).
    const style = fontStyleToProbe ?? '';
    const weight = fontWeightToProbe ?? '';
    const probe = `${style} ${weight} 16px "${fontFamilyToProbe}"`.trim().replace(/\s+/g, ' ');
    await document.fonts.load(probe);
  }
}

function ensureStylesheet(href: string, dedupeKey: string): Promise<void> {
  const selector = `link[data-icon-font="${cssEscape(dedupeKey)}"]`;
  const existing = document.querySelector<HTMLLinkElement>(selector);
  if (existing) {
    if (existing.sheet) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`loadIconFont: stylesheet load failed: ${href}`)),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.iconFont = dedupeKey;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`loadIconFont: stylesheet load failed: ${href}`));
    document.head.appendChild(link);
  });
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
