/**
 * The drawing and measuring tools against the headless canvas, with a stand-in for
 * the `MapLayer` (the real one needs a DOM and a WebGL map): it holds gestures by
 * count and emits the same events.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer, WorldLayer, type WorldLayerHit } from '@invana/canvas';

import { DrawGeoFeatureBehaviour } from '../src/tools/DrawGeoFeatureBehaviour';
import { MeasureBehaviour } from '../src/tools/MeasureBehaviour';
import { GeoFeaturesLayer } from '../src/features/GeoFeaturesLayer';
import type { MapLayer } from '../src/MapLayer';
import type { MapLayerEvents } from '../src/types';
import { haversineKm } from '../src/geo/geodesy';

/** A `MapLayer` stand-in: `suspendGestures` counts holds, events are emitted by the test. */
class FakeMap extends WorldLayer<object, object, MapLayerEvents, never, WorldLayerHit> {
  holds = 0;
  protected createState(): object {
    return {};
  }
  hitTest(): WorldLayerHit | null {
    return null;
  }
  suspendGestures(): () => void {
    this.holds++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.holds--;
    };
  }
  click(lngLat: [number, number]): void {
    this.events.emit('map:click', { lngLat, world: { x: 0, y: 0 } });
  }
  pointer(phase: 'move' | 'dblclick', lngLat: [number, number]): void {
    this.events.emit('map:pointer', { phase, lngLat, world: { x: 0, y: 0 }, button: 0 });
  }
}

const keys = new EventTarget();
const press = (key: string): void => {
  keys.dispatchEvent(Object.assign(new Event('keydown'), { key, preventDefault: () => {} }));
};

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  g['window'] = keys;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
});

const A: [number, number] = [78, 17];
const B: [number, number] = [79, 17];
const C: [number, number] = [79, 18];

function mount() {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  // Map zoom ~10, so "the same spot" is a few hundred metres and not a hundred kilometres.
  canvas.camera.setTransform({ x: 0, y: 0, zoom: 1024 }, { clamp: false });
  const map = new FakeMap({ id: 'map', options: {} });
  const geo = new GeoFeaturesLayer({ id: 'geo', options: { republishDebounceMs: 0 } });
  canvas.layers.add(map);
  canvas.layers.add(geo);
  canvas.layers.mountAll();
  const draw = new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo', enabled: true, author: 'analyst-3' });
  const measure = new MeasureBehaviour({ id: 'measure', mapLayerId: 'map', featuresLayerId: 'geo', enabled: true });
  canvas.behaviours.register(draw);
  canvas.behaviours.register(measure);
  return { canvas, map: map as unknown as FakeMap & MapLayer, geo, draw, measure };
}

describe('DrawGeoFeatureBehaviour', () => {
  it('draws a polygon: click · click · click · double-click → one feature with provenance', () => {
    const { map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    map.click(A);
    map.click(B);
    map.click(C);
    expect(geo.features()).toHaveLength(0); // not yet
    map.pointer('dblclick', C);
    expect(geo.features()).toHaveLength(1);
    const f = geo.features()[0]!;
    expect(f.geometry).toEqual({ type: 'Polygon', coordinates: [[A, B, C, A]] });
    expect(f.properties).toMatchObject({ author: 'analyst-3', tool: 'polygon' });
    expect(Number.isNaN(Date.parse(String(f.properties!.reportedAt)))).toBe(false);
  });

  it('the second click of a double-click does not add a duplicate vertex', () => {
    const { map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    map.click(A);
    map.click(B);
    map.click(C);
    map.click(C); // the double-click's second click, same spot
    map.pointer('dblclick', C);
    const ring = (geo.features()[0]!.geometry as { coordinates: number[][][] }).coordinates[0]!;
    expect(ring).toHaveLength(4); // 3 vertices + the closing point
  });

  it('draws a line and a circle (a Point with radiusKm)', () => {
    const { map, geo, draw } = mount();
    draw.setOptions({ tool: 'line' });
    map.click(A);
    map.click(B);
    press('Enter');
    expect(geo.features()[0]!.geometry).toEqual({ type: 'LineString', coordinates: [A, B] });
    draw.setOptions({ tool: 'circle' });
    map.click(A);
    map.click(B);
    const circle = geo.features()[1]!;
    expect(circle.geometry).toEqual({ type: 'Point', coordinates: A });
    expect(circle.properties!.radiusKm).toBeCloseTo(haversineKm(A, B), 2);
  });

  it('one drawn feature is one undo step, and undo / redo work', () => {
    const { canvas, map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    for (const p of [A, B, C]) map.click(p);
    map.pointer('dblclick', C);
    expect(canvas.history.entries()).toHaveLength(1);
    canvas.history.undo();
    expect(geo.features()).toHaveLength(0);
    canvas.history.redo();
    expect(geo.features()).toHaveLength(1);
  });

  it('while drawing, the draft shows and is not a feature or a history entry', () => {
    const { canvas, map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    map.click(A);
    map.pointer('move', B);
    map.click(B);
    expect(geo.features()).toHaveLength(0);
    expect(canvas.history.canUndo()).toBe(false);
    expect(geo.publishedCount).toBe(0); // the draft is not counted among features
  });

  it('holds the map only while a tool is set, and gives it back every way out', () => {
    const { map, draw } = mount();
    expect(map.holds).toBe(0);
    draw.setOptions({ tool: 'polygon' });
    expect(map.holds).toBe(1);
    draw.setOptions({ tool: 'line' }); // switching tools keeps one hold, not two
    expect(map.holds).toBe(1);
    draw.setOptions({ tool: null });
    expect(map.holds).toBe(0);

    draw.setOptions({ tool: 'polygon' });
    draw.disable();
    expect(map.holds).toBe(0);
    draw.enable();
    expect(map.holds).toBe(1);
    press('Escape'); // nothing in progress → leaves the tool
    expect(map.holds).toBe(0);
    expect(draw.getOptions().tool).toBeNull();

    draw.setOptions({ tool: 'polygon' });
    expect(map.holds).toBe(1);
    draw.disable();
    expect(map.holds).toBe(0);
  });

  it('Escape abandons the shape first, then leaves the tool; Backspace drops a vertex', () => {
    const { map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    map.click(A);
    map.click(B);
    press('Backspace');
    map.click(C);
    map.click(B);
    press('Escape'); // abandon
    expect(draw.drawing).toBe(false);
    expect(draw.getOptions().tool).toBe('polygon'); // still in the tool
    press('Enter'); // nothing to finish
    expect(geo.features()).toHaveLength(0);
    press('Escape'); // now leave
    expect(draw.getOptions().tool).toBeNull();
  });

  it('a double-click with too few vertices makes nothing', () => {
    const { map, geo, draw } = mount();
    draw.setOptions({ tool: 'polygon' });
    map.click(A);
    map.click(B);
    map.pointer('dblclick', B);
    expect(geo.features()).toHaveLength(0);
    expect(draw.drawing).toBe(true);
  });

  it('ignores the map when no tool is set, and gives it back on destroy', () => {
    const { canvas, map, geo, draw } = mount();
    map.click(A);
    map.click(B);
    map.click(C);
    map.pointer('dblclick', C);
    expect(geo.features()).toHaveLength(0);
    draw.setOptions({ tool: 'polygon' });
    expect(map.holds).toBe(1);
    canvas.behaviours.unregister('draw');
    expect(map.holds).toBe(0);
  });

  it('tells subscribers when the tool or the shape changes', () => {
    const { map, draw } = mount();
    let n = 0;
    draw.subscribe(() => n++);
    draw.setOptions({ tool: 'polygon' });
    const afterTool = n;
    map.click(A);
    expect(n).toBeGreaterThan(afterTool);
  });
});

describe('MeasureBehaviour', () => {
  it('distance: the reading follows the pointer and freezes on the finished line', () => {
    const { map, geo, measure } = mount();
    measure.setOptions({ tool: 'distance' });
    map.click(A);
    map.pointer('move', B);
    map.click(B);
    map.click(C);
    map.pointer('dblclick', C);
    const km = haversineKm(A, B) + haversineKm(B, C);
    expect(measure.reading).toMatch(new RegExp(`^${Math.round(km).toLocaleString('en-US')} km · 0\\d\\d°$`));
    expect(geo.features()).toHaveLength(0); // never stored
  });

  it('area: reads km² for the ring', () => {
    const { map, measure } = mount();
    measure.setOptions({ tool: 'area' });
    for (const p of [[78, 17], [79, 17], [79, 18], [78, 18]] as [number, number][]) map.click(p);
    press('Enter');
    expect(measure.reading).toMatch(/^\d{1,3}(,\d{3})* km²$/);
    expect(measure.reading).toContain('11,');
  });

  it('records nothing, and Escape clears the reading before leaving the tool', () => {
    const { canvas, map, measure } = mount();
    measure.setOptions({ tool: 'distance' });
    map.click(A);
    map.click(B);
    press('Enter');
    expect(measure.reading).toBeDefined();
    expect(canvas.history.canUndo()).toBe(false);
    press('Escape');
    expect(measure.reading).toBeUndefined();
    expect(measure.getOptions().tool).toBe('distance');
    press('Escape');
    expect(measure.getOptions().tool).toBeNull();
  });

  it('the next click after a finished measurement starts a new one', () => {
    const { map, measure } = mount();
    measure.setOptions({ tool: 'distance' });
    map.click(A);
    map.click(B);
    press('Enter');
    expect(measure.reading).toBeDefined();
    map.click(C);
    expect(measure.reading).toBeUndefined();
  });
});

describe('two tools hold the map together', () => {
  it('is handed back only when the last lets go', () => {
    const { map, draw, measure } = mount();
    draw.setOptions({ tool: 'polygon' });
    measure.setOptions({ tool: 'distance' });
    expect(map.holds).toBe(2);
    draw.setOptions({ tool: null });
    expect(map.holds).toBe(1);
    measure.setOptions({ tool: null });
    expect(map.holds).toBe(0);
  });
});
