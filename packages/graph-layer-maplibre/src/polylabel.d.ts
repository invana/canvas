// `polylabel` ships no types. Only the one call the layer makes is declared.
declare module 'polylabel' {
  /** Pole of inaccessibility of a polygon (outer ring first, then holes): `[x, y]` with a `.distance` property. */
  export default function polylabel(polygon: number[][][], precision?: number, debug?: boolean): number[] & { distance: number };
}
