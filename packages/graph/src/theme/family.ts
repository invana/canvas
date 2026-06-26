/**
 * Map a host app theme id (`@invana/themes`) onto a canvas {@link Theme} family
 * name. The app theme and the canvas theme are linked only by a loose name
 * match — strip the light/dark mode token from either end and what's left is
 * the family (`'forest'`, `'ocean'`, `'default'`).
 *
 * @example
 * themeFamily('default-dark') // 'default'
 * themeFamily('dark-forest')  // 'forest'
 * themeFamily('ocean-light')  // 'ocean'
 * themeFamily(undefined)      // 'default'
 */
export function themeFamily(themeId: string | null | undefined): string {
  if (!themeId) return 'default';
  const s = themeId
    .toLowerCase()
    .trim()
    .replace(/^(light|dark)[-_]/, '')
    .replace(/[-_](light|dark)$/, '');
  return s || 'default';
}
