/**
 * Built-in colour ramps for {@link DensityContourLayer}.
 *
 * Each palette is an ordered array of `0xRRGGBB` stops from low-density to
 * high-density. The layer interpolates between adjacent stops so any band
 * count (3, 10, 30...) lands on a perceptually-smooth colour.
 *
 * Sequential single-hue palettes (`blues`, `greens`, ...) are drawn from
 * ColorBrewer; perceptual ramps (`viridis`, `plasma`, `magma`, `inferno`)
 * are 10-stop quantizations of matplotlib's perceptual colour maps. `warm`
 * and `cool` are ColorBrewer YlOrRd / BuPu equivalents.
 */

export type DensityContourPaletteName =
  | 'blues'
  | 'greens'
  | 'oranges'
  | 'purples'
  | 'reds'
  | 'viridis'
  | 'plasma'
  | 'magma'
  | 'inferno'
  | 'warm'
  | 'cool';

export const DENSITY_CONTOUR_PALETTES: Record<DensityContourPaletteName, number[]> = {
  blues: [
    0xf7fbff, 0xdeebf7, 0xc6dbef, 0x9ecae1, 0x6baed6, 0x4292c6, 0x2171b5, 0x08519c, 0x08306b,
  ],
  greens: [
    0xf7fcf5, 0xe5f5e0, 0xc7e9c0, 0xa1d99b, 0x74c476, 0x41ab5d, 0x238b45, 0x006d2c, 0x00441b,
  ],
  oranges: [
    0xfff5eb, 0xfee6ce, 0xfdd0a2, 0xfdae6b, 0xfd8d3c, 0xf16913, 0xd94801, 0xa63603, 0x7f2704,
  ],
  purples: [
    0xfcfbfd, 0xefedf5, 0xdadaeb, 0xbcbddc, 0x9e9ac8, 0x807dba, 0x6a51a3, 0x54278f, 0x3f007d,
  ],
  reds: [
    0xfff5f0, 0xfee0d2, 0xfcbba1, 0xfc9272, 0xfb6a4a, 0xef3b2c, 0xcb181d, 0xa50f15, 0x67000d,
  ],
  viridis: [
    0x440154, 0x482878, 0x3e4989, 0x31688e, 0x26828e, 0x1f9e89, 0x35b779, 0x6ece58, 0xb5de2b,
    0xfde725,
  ],
  plasma: [
    0x0d0887, 0x46039f, 0x7201a8, 0x9c179e, 0xbd3786, 0xd8576b, 0xed7953, 0xfa9e3b, 0xfdca26,
    0xf0f921,
  ],
  magma: [
    0x000004, 0x180f3d, 0x440f76, 0x721f81, 0x9e2f7f, 0xcd4071, 0xf1605d, 0xfd9668, 0xfeca8d,
    0xfcfdbf,
  ],
  inferno: [
    0x000004, 0x1b0c41, 0x4a0c6b, 0x781c6d, 0xa52c60, 0xcf4446, 0xed6925, 0xfb9a06, 0xf7d13d,
    0xfcffa4,
  ],
  warm: [0xffeda0, 0xfed976, 0xfeb24c, 0xfd8d3c, 0xfc4e2a, 0xe31a1c, 0xb10026],
  cool: [0xe0ecf4, 0xbfd3e6, 0x9ebcda, 0x8c96c6, 0x8c6bb1, 0x88419d, 0x6e016b],
};

/** All built-in palette names in declaration order. Useful for GUI menus. */
export const DENSITY_CONTOUR_PALETTE_NAMES: readonly DensityContourPaletteName[] = Object.keys(
  DENSITY_CONTOUR_PALETTES,
) as DensityContourPaletteName[];

/**
 * Linear interpolation between two `0xRRGGBB` colours in sRGB space.
 * `t` is clamped to `[0, 1]`. sRGB-linear is "good enough" for adjacent
 * stops in a smooth ramp; for perceptually-uniform mixing across distant
 * hues, supply a function via `paletteFn`.
 */
export function lerpColor(a: number, b: number, t: number): number {
  const u = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * u);
  const g = Math.round(ag + (bg - ag) * u);
  const bl = Math.round(ab + (bb - ab) * u);
  return (r << 16) | (g << 8) | bl;
}

/**
 * Linearly interpolate a `0xRRGGBB` colour from a stop array based on the
 * band's position `(index / (total - 1))`. Returns the last stop if there's
 * only one band or one stop.
 */
export function sampleStops(stops: number[], index: number, total: number): number {
  if (stops.length === 0) return 0x000000;
  if (total <= 1 || stops.length === 1) return stops[stops.length - 1]!;
  const t = index / (total - 1);
  const pos = Math.max(0, Math.min(1, t)) * (stops.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(stops.length - 1, lo + 1);
  return lerpColor(stops[lo]!, stops[hi]!, pos - lo);
}
