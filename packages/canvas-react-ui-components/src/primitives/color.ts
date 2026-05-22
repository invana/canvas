/**
 * Color conversion helpers. NodeStyle stores colors as 24-bit RGB numbers
 * (`0xRRGGBB`); HTML `<input type="color">` and most web tooling use
 * `#rrggbb` strings. These helpers bridge the two formats.
 */

export function numberToHex(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return '#000000';
  const clamped = Math.max(0, Math.min(0xffffff, Math.floor(n)));
  return '#' + clamped.toString(16).padStart(6, '0');
}

export function hexToNumber(hex: string): number {
  const stripped = hex.startsWith('#') ? hex.slice(1) : hex;
  const parsed = Number.parseInt(stripped, 16);
  return Number.isNaN(parsed) ? 0 : parsed;
}
