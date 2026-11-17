/**
 * `AreaQueryBehaviour` against a real `GraphLayer` and `GeoFeaturesLayer` on the
 * headless canvas.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';

import { AreaQueryBehaviour } from '../src/tools/AreaQueryBehaviour';
import { GeoFeaturesLayer } from '../src/features/GeoFeaturesLayer';
import { destinationPoint } from '../src/geo/geodesy';
import { projectLngLat } from '../src/mercator';
import type { GeoFeature, Position } from '../src/features/types';

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

const node = (id: string, lngLat: Position) => ({ id, type: 'p', position: projectLngLat([lngLat[0], lngLat[1]]) });
const zone: GeoFeature = {
  type: 'Feature',
  id: 'zone',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [[78, 17], [79, 17], [79, 18], [78, 18], [78, 17]],
      [[78.4, 17.4], [78.6, 17.4], [78.6, 17.6], [78.4, 17.6], [78.4, 17.4]],
    ],
  },
};
const route: GeoFeature = { type: 'Feature', id: 'route', properties: {}, geometry: { type: 'LineString', coordinates: [[80, 17], [81, 17]] } };

function mount(options: Record<string, unknown> = {}, selector?: { selectMultiple: (e: unknown[]) => void }) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const graph = new GraphLayer({
    id: 'graph',
    options: {
      initData: {
        nodes: [
          node('in', [78.2, 17.2]),
          node('hole', [78.5, 17.5]),
          node('out', [80.5, 19.5]),
          node('near-west', destinationPoint([78, 17.5], 270, 15)),
          node('on-route', [80.5, 17.01]),
        ],
        edges: [],
      },
    },
  });
  const geo = new GeoFeaturesLayer({ id: 'geo', options: { republishDebounceMs: 0, features: [zone, route] } });
  canvas.layers.add(graph);
  canvas.layers.add(geo);
  canvas.layers.mountAll();
  void selector;
  const q = new AreaQueryBehaviour({ id: 'query', targetLayerId: 'graph', featuresLayerId: 'geo', enabled: true, ...options });
  canvas.behaviours.register(q);
  return { canvas, graph, geo, q };
}

describe('AreaQueryBehaviour', () => {
  it('finds the nodes inside a feature, holes respected', () => {
    const { q } = mount();
    expect(q.query({ featureId: 'zone' }).sort()).toEqual(['in']);
  });

  it('widens to "or within km" of the feature', () => {
    const { q } = mount();
    expect(q.query({ featureId: 'zone', km: 25 }).sort()).toEqual(['hole', 'in', 'near-west']);
  });

  it('within km of a point and of a route (geodesic)', () => {
    const { q } = mount();
    expect(q.query({ point: [78.2, 17.2], km: 10 })).toEqual(['in']);
    expect(q.query({ line: [[80, 17], [81, 17]], km: 5 })).toEqual(['on-route']);
    expect(q.query({ featureId: 'route', km: 5 })).toEqual(['on-route']);
  });

  it('an unknown feature matches nothing; a route with no km matches nothing', () => {
    const { q } = mount();
    expect(q.query({ featureId: 'nope' })).toEqual([]);
    expect(q.query({ featureId: 'route' })).toEqual([]);
  });

  it('select goes through the ClickSelectBehaviour found by id', () => {
    const selectMultiple = vi.fn();
    const { canvas, q } = mount({ clickSelectId: 'select' });
    // A stand-in registered under the id: anything with `selectMultiple` will do.
    (canvas.behaviours as unknown as { get: (id: string) => unknown }).get = ((orig) => (id: string) => (id === 'select' ? { selectMultiple } : orig(id)))(
      canvas.behaviours.get.bind(canvas.behaviours),
    );
    const ids = q.select({ featureId: 'zone' });
    expect(ids).toEqual(['in']);
    expect(selectMultiple).toHaveBeenCalledWith([{ id: 'in', type: 'shape' }]);
  });

  it('without a selector, the nodes get the selected state', () => {
    const { graph, q } = mount();
    q.select({ featureId: 'zone' });
    expect(graph.store.nodeStatesOf('in')).toContain('selected');
    expect(graph.store.nodeStatesOf('out')).not.toContain('selected');
  });

  it('does not select while disabled, but still reads', () => {
    const { graph, q } = mount({ enabled: false });
    expect(q.select({ featureId: 'zone' })).toEqual([]);
    expect(graph.store.nodeStatesOf('in')).not.toContain('selected');
    expect(q.query({ featureId: 'zone' })).toEqual(['in']);
  });

  it('autoQuery re-selects when a feature is added', () => {
    const { graph, geo } = mount({ autoQuery: true });
    geo.addFeature({
      type: 'Feature',
      id: 'drawn',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[[80, 19], [81, 19], [81, 20], [80, 20], [80, 19]]] },
    });
    expect(graph.store.nodeStatesOf('out')).toContain('selected');
  });

  it('autoQuery is off by default', () => {
    const { graph, geo } = mount();
    geo.addFeature({ type: 'Feature', id: 'drawn', properties: {}, geometry: { type: 'Polygon', coordinates: [[[80, 19], [81, 19], [81, 20], [80, 20], [80, 19]]] } });
    expect(graph.store.nodeStatesOf('out')).not.toContain('selected');
  });
});
