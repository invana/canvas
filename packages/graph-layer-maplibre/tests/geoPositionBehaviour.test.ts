import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';

import { GeoPositionBehaviour } from '../src/GeoPositionBehaviour';
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

function mount(options: Record<string, unknown> = {}) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({
    id: 'graph',
    options: {
      initData: {
        nodes: [
          { id: 'a', type: 'p', position: { x: 0, y: 0 }, data: { lng: 78.4867, lat: 17.385 } },
          { id: 'b', type: 'p', position: { x: 5, y: 5 }, data: { name: 'no coordinates' } },
          { id: 'c', type: 'p', position: { x: 1, y: 1 }, data: { lng: 'x', lat: 3 } },
          { id: 'd', type: 'p', position: { x: 0, y: 0 }, data: { place: { lon: 100.5, la: 13.75 } } },
        ],
        edges: [],
      },
    },
  });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const behaviour = new GeoPositionBehaviour({ id: 'geo-pos', targetLayerId: 'graph', enabled: true, ...options });
  canvas.behaviours.register(behaviour);
  return { layer, behaviour };
}

describe('GeoPositionBehaviour', () => {
  it('projects nodes with a numeric lng and lat, and leaves the rest where they are', () => {
    const { layer } = mount();
    const p = projectLngLat([78.4867, 17.385]);
    expect(layer.store.getNode('a')!.position!.x).toBeCloseTo(p.x, 4);
    expect(layer.store.getNode('a')!.position!.y).toBeCloseTo(p.y, 4);
    expect(layer.store.getNode('b')!.position).toEqual({ x: 5, y: 5 });
    expect(layer.store.getNode('c')!.position).toEqual({ x: 1, y: 1 }); // lng is a string
  });

  it('reads other paths, and re-applies when the options change', () => {
    const { layer, behaviour } = mount({ lngPath: 'data.place.lon', latPath: 'data.place.la' });
    const p = projectLngLat([100.5, 13.75]);
    expect(layer.store.getNode('d')!.position!.x).toBeCloseTo(p.x, 4);
    behaviour.setOptions({ lngPath: 'data.lng', latPath: 'data.lat' });
    expect(layer.store.getNode('a')!.position!.x).toBeCloseTo(projectLngLat([78.4867, 17.385]).x, 4);
  });

  it('does not touch a node that is already there, and never writes .data', () => {
    const { layer, behaviour } = mount();
    expect(behaviour.apply()).toBe(0); // nothing left to move
    expect(layer.store.getNode('a')!.data).toEqual({ lng: 78.4867, lat: 17.385 });
  });

  it('follows data changes', () => {
    const { layer, behaviour } = mount();
    layer.store.addNode({ id: 'e', type: 'p', position: { x: 0, y: 0 }, data: { lng: 10, lat: 10 } } as never);
    behaviour.apply();
    expect(layer.store.getNode('e')!.position!.x).toBeCloseTo(projectLngLat([10, 10]).x, 4);
  });
});
