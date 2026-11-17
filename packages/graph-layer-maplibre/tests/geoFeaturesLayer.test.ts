/**
 * `GeoFeaturesLayer` against the headless canvas: features in → specs out,
 * events and hit tests, config patches.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';

import { GeoFeaturesLayer } from '../src/features/GeoFeaturesLayer';
import type { GeoFeature } from '../src/features/types';
import { projectLngLat } from '../src/mercator';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
});

const ring = (x: number, y: number, s: number): [number, number][] => [[x, y], [x + s, y], [x + s, y + s], [x, y + s], [x, y]];

const donut: GeoFeature = {
  type: 'Feature',
  id: 'donut',
  geometry: { type: 'Polygon', coordinates: [ring(78, 17, 1), ring(78.3, 17.3, 0.3).reverse()] },
  properties: { name: 'Donut' },
};
const multi: GeoFeature = {
  type: 'Feature',
  id: 'multi',
  geometry: { type: 'MultiPolygon', coordinates: [[ring(70, 10, 1)], [ring(72, 10, 1)]] },
};
const route: GeoFeature = { type: 'Feature', id: 'route', geometry: { type: 'LineString', coordinates: [[75, 12], [76, 13], [77, 12.5]] }, properties: { name: 'Route' } };
const zone: GeoFeature = { type: 'Feature', id: 'zone', geometry: { type: 'Point', coordinates: [80, 15] }, properties: { radiusKm: 25, uncertaintyKm: 40, name: 'Zone' } };

function mount(options: Record<string, unknown> = {}, features: GeoFeature[] = []) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GeoFeaturesLayer({ id: 'geo', options: { republishDebounceMs: 0, features, ...options } });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  return { canvas, layer };
}
const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 10));

describe('GeoFeaturesLayer', () => {
  it('publishes a fill and a stroke ring per boundary (donut = 1 fill + 2 rings)', async () => {
    const { layer } = mount({}, [donut]);
    await flush();
    expect(layer.publishedCount).toBe(3);
  });

  it('draws each polygon of a MultiPolygon, a line, and a point with a radius and an uncertainty ring', async () => {
    const { layer } = mount({}, [multi, route, zone]);
    await flush();
    // multi: 2 × (fill + ring) = 4 · route: 1 · zone: ring + circle = 2
    expect(layer.publishedCount).toBe(7);
  });

  it('draws no fill for a zero fill opacity', async () => {
    const { layer } = mount({ defaults: { polygon: { fillOpacity: 0 } } }, [donut]);
    await flush();
    expect(layer.publishedCount).toBe(2); // the two rings only
  });

  it('drops unusable features with one warning each and keeps the rest', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad: GeoFeature = { type: 'Feature', id: 'bad', geometry: { type: 'LineString', coordinates: [[0, 0]] } };
    const { layer } = mount({}, [bad, route]);
    expect(layer.features().map((f) => f.id)).toEqual(['route']);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('warns about a bad provenance value but keeps the feature', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f: GeoFeature = { ...route, id: 'p', properties: { reliability: 'Z9', confidence: 3 } };
    const { layer } = mount({}, [f]);
    expect(layer.getFeature('p')).toBeDefined();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('add / update / remove / toGeoJSON round-trip', async () => {
    const { layer } = mount({}, [route]);
    expect(layer.addFeature(zone)).toBe(true);
    expect(layer.addFeature(zone)).toBe(false); // duplicate id
    expect(layer.updateFeature('zone', { properties: { name: 'Renamed' } })).toBe(true);
    expect(layer.getFeature('zone')!.properties).toMatchObject({ name: 'Renamed', radiusKm: 25 }); // merged
    await flush();
    expect(layer.removeFeature('route')).toBe(true);
    expect(layer.removeFeature('route')).toBe(false);
    const out = layer.toGeoJSON();
    expect(out.type).toBe('FeatureCollection');
    expect(out.features.map((f) => f.id)).toEqual(['zone']);
  });

  it('a bad update keeps the old feature', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { layer } = mount({}, [route]);
    expect(layer.updateFeature('route', { geometry: { type: 'LineString', coordinates: [[0, 0]] } })).toBe(false);
    expect(layer.getFeature('route')!.geometry).toEqual(route.geometry);
    warn.mockRestore();
  });

  it('hit tests: inside, in a hole, near a line, in a circle; points beat areas', () => {
    const { canvas, layer } = mount({}, [donut, route, zone]);
    // Map zoom ~10: a 6 px tolerance is then a few hundred metres, not four degrees.
    canvas.camera.setTransform({ x: 0, y: 0, zoom: 1024 }, { clamp: false });
    const at = (lng: number, lat: number): string | null => {
      const p = projectLngLat([lng, lat]);
      return layer.featureAt(p.x, p.y);
    };
    expect(at(78.1, 17.1)).toBe('donut');
    expect(at(78.45, 17.45)).toBeNull(); // in the hole
    expect(at(75.5, 12.5)).toBe('route');
    expect(at(80.1, 15.1)).toBe('zone'); // inside 25 km
    expect(at(60, 0)).toBeNull();
  });

  it('emits feature:click for a map click, through a MapLayer-shaped source', () => {
    const { canvas, layer } = mount({}, [donut]);
    const seen: string[] = [];
    layer.events.on('feature:click', ({ id }) => seen.push(id));
    // No MapLayer here: drive the click the way the canvas path does.
    const p = projectLngLat([78.1, 17.1]);
    (layer as unknown as { click(w: { x: number; y: number }, l: [number, number]): void }).click(p, [78.1, 17.1]);
    expect(seen).toEqual(['donut']);
    void canvas;
  });

  it('reports hover changes once, and null on leaving', () => {
    const { layer } = mount({}, [donut]);
    const seen: Array<string | null> = [];
    layer.events.on('feature:hover', ({ id }) => seen.push(id));
    const hover = (lng: number, lat: number): void => {
      const p = projectLngLat([lng, lat]);
      (layer as unknown as { hover(w: { x: number; y: number }, l: [number, number]): void }).hover(p, [lng, lat]);
    };
    hover(78.1, 17.1);
    hover(78.2, 17.1); // still the donut: no event
    hover(60, 0);
    expect(seen).toEqual(['donut', null]);
  });

  it('applies a config patch: features replace, mapLayerId is wiring', async () => {
    const { layer } = mount({}, [donut]);
    layer.setOptions({ features: [route], mapLayerId: 'other', labelFontPx: 20 });
    await flush();
    expect(layer.features().map((f) => f.id)).toEqual(['route']);
    expect(layer.options.labelFontPx).toBe(20);
    expect(layer.options.mapLayerId).toBeUndefined();
  });

  it('attaches one label decoration per feature, at the visual centre, only inside the label zoom band', async () => {
    const labelled = (layer: GeoFeaturesLayer): string[] => {
      const prim = (layer as unknown as { surface: { primitives: { setDecoration: (...a: unknown[]) => void } } }).surface.primitives;
      const calls: string[] = [];
      const orig = prim.setDecoration.bind(prim);
      prim.setDecoration = (id: unknown, slot: unknown, ...rest: unknown[]) => {
        if (slot === 'label') calls.push(String(id));
        orig(id, slot, ...rest);
      };
      layer.setOptions({}); // repaint with the spy in place
      return calls;
    };
    const off = mount({ labelMinZoom: 1e9 }, [donut]);
    const offCalls = labelled(off.layer);
    await flush();
    expect(offCalls).toEqual([]);
    const on = mount({}, [donut]);
    const onCalls = labelled(on.layer);
    await flush();
    // One label per feature, however many specs it has (a fill and two rings here).
    expect(onCalls).toEqual(['geo:donut:fill0']);
  });
});
