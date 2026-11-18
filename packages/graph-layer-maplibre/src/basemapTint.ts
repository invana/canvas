/**
 * Basemap tint — turns the canvas's published theme palette into MapLibre paint
 * overrides, so a basemap wears the active design-kit family (Rose, Ocean, …) and
 * not just a light / dark flip.
 *
 * Pure: {@link computeTint} maps `(style layer list, theme)` → a list of
 * `setPaintProperty` operations and touches no map, so it is unit-tested with a
 * stub layer list. `MapLayer` applies the result.
 *
 * ## What it matches
 *
 * Layers are matched by **id and type**, against the ids the OpenFreeMap styles
 * (`positron` / `dark` / `liberty`) share: a `background`, a `water` fill,
 * `landcover` / `landuse` / `park` fills, `building`, road / rail / bridge / tunnel
 * lines (casings separately), `boundary` lines, and every `symbol` layer. A style
 * that lacks a layer simply gets nothing for it; a style that matches none yields
 * no operations, which `MapLayer` reports once.
 *
 * @module
 */

import type { ResolvedTheme } from '@invana/canvas';

/** The slice of a MapLibre style layer the tint needs. */
export interface TintLayer {
  /** Style layer id. */
  id: string;
  /** Style layer type (`background` · `fill` · `line` · `symbol` · …). */
  type: string;
}

/** One `map.setPaintProperty(layer, prop, value)` call. */
export interface TintOp {
  /** Style layer id. */
  layer: string;
  /** Paint property name, e.g. `'fill-color'`. */
  prop: string;
  /** CSS colour string. */
  value: string;
}

/** The theme fields the tint reads. */
export type TintTheme = Pick<ResolvedTheme, 'kind' | 'palette'>;

/** `0xRRGGBB` → `[r, g, b]`. */
function rgb(n: number): [number, number, number] {
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Blend `a` toward `b` by `t` (0 = `a`, 1 = `b`) in sRGB, as a `#rrggbb` string.
 * Roles are `0xRRGGBB` numbers, so this is the one place they become CSS.
 */
export function mix(a: number, b: number, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  const ch = (x: number, y: number): string =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0');
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

/** `0xRRGGBB` → `#rrggbb`. */
export function hex(n: number): string {
  return mix(n, n, 0);
}

/** Road-like line ids across the OpenFreeMap styles. */
const ROAD = /(road|highway|motorway|street|path|bridge|tunnel|rail|ferry|transit)/;
/** Land-cover-like fill ids. */
const LAND = /(park|landcover|landuse|wood|grass|sand|pitch|cemetery|hospital|school|glacier|ice)/;

/**
 * The paint overrides that dress `layers` in `theme`'s palette.
 *
 * Needs at least `surface` and `foreground`; with a sparse palette — the
 * `{ light, dark }` shorthand publishes an **empty** one on purpose — returns
 * `[]` and the style is left as authored. `muted` and `accent` fall back to
 * `foreground` when absent.
 *
 * @param layers  The style's layers (`map.getStyle().layers`).
 * @param theme   The published theme (`ctx.theme.current()`).
 */
export function computeTint(layers: readonly TintLayer[], theme: TintTheme): TintOp[] {
  const p = theme.palette;
  const surface = p.surface;
  const foreground = p.foreground;
  if (surface === undefined || foreground === undefined) return [];
  const muted = p.muted ?? foreground;
  const accent = p.accent ?? foreground;
  const dark = theme.kind === 'dark';

  const water = mix(surface, accent, dark ? 0.28 : 0.22);
  const land = mix(surface, muted, dark ? 0.12 : 0.1);
  const building = mix(surface, muted, dark ? 0.2 : 0.16);
  const road = mix(surface, foreground, dark ? 0.12 : 0.08);
  const casing = mix(surface, foreground, dark ? 0.2 : 0.16);
  const boundary = mix(surface, muted, 0.5);
  const text = mix(foreground, surface, 0.2);

  const ops: TintOp[] = [];
  const set = (layer: string, prop: string, value: string): void => {
    ops.push({ layer, prop, value });
  };

  for (const { id, type } of layers) {
    if (type === 'background') {
      set(id, 'background-color', hex(surface));
    } else if (type === 'fill') {
      if (id.startsWith('water')) set(id, 'fill-color', water);
      else if (id === 'building') set(id, 'fill-color', building);
      else if (LAND.test(id)) set(id, 'fill-color', land);
    } else if (type === 'line') {
      if (id.startsWith('water')) set(id, 'line-color', water);
      else if (id.startsWith('boundary')) set(id, 'line-color', boundary);
      else if (ROAD.test(id)) set(id, 'line-color', id.includes('casing') ? casing : road);
    } else if (type === 'symbol') {
      set(id, 'text-color', text);
      set(id, 'text-halo-color', hex(surface));
    }
  }
  return ops;
}
