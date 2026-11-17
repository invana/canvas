/**
 * `GeoFeaturesLayer` as a source of the canvas's operation log: edits are
 * undoable and redoable through `canvas.history`, the draft is not, loading is not.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';

import { GeoFeaturesLayer } from '../src/features/GeoFeaturesLayer';
import type { GeoFeature } from '../src/features/types';

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

const line = (id: string, props: Record<string, unknown> = {}): GeoFeature => ({
  type: 'Feature',
  id,
  properties: props,
  geometry: { type: 'LineString', coordinates: [[78, 17], [79, 18]] },
});
const ids = (layer: GeoFeaturesLayer): string[] => layer.features().map((f) => String(f.id));

function mount(features: GeoFeature[] = []) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GeoFeaturesLayer({ id: 'geo', options: { republishDebounceMs: 0, features } });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  return { canvas, layer };
}

describe('GeoFeaturesLayer history', () => {
  it('addFeature → undo removes it → redo restores it', () => {
    const { canvas, layer } = mount();
    layer.addFeature(line('a'));
    expect(ids(layer)).toEqual(['a']);
    expect(canvas.history.canUndo()).toBe(true);
    canvas.history.undo();
    expect(ids(layer)).toEqual([]);
    expect(canvas.history.canRedo()).toBe(true);
    canvas.history.redo();
    expect(ids(layer)).toEqual(['a']);
  });

  it('removeFeature → undo restores it at its old draw order', () => {
    const { canvas, layer } = mount([line('a'), line('b'), line('c')]);
    layer.removeFeature('b');
    expect(ids(layer)).toEqual(['a', 'c']);
    canvas.history.undo();
    expect(ids(layer)).toEqual(['a', 'b', 'c']);
    canvas.history.redo();
    expect(ids(layer)).toEqual(['a', 'c']);
  });

  it('updateFeature → undo restores the old properties, in place', () => {
    const { canvas, layer } = mount([line('a', { name: 'old' }), line('b')]);
    layer.updateFeature('a', { properties: { name: 'new' } });
    expect(layer.getFeature('a')!.properties).toMatchObject({ name: 'new' });
    canvas.history.undo();
    expect(layer.getFeature('a')!.properties).toMatchObject({ name: 'old' });
    expect(ids(layer)).toEqual(['a', 'b']);
    canvas.history.redo();
    expect(layer.getFeature('a')!.properties).toMatchObject({ name: 'new' });
  });

  it('records nothing for loaded features, setFeatures or the draft', () => {
    const { canvas, layer } = mount([line('a')]);
    expect(canvas.history.canUndo()).toBe(false);
    layer.setFeatures([line('x'), line('y')]);
    layer.setDraft(line('draft'));
    layer.setDraft(null);
    expect(canvas.history.canUndo()).toBe(false);
  });

  it('keeps the draft out of features(), toGeoJSON() and picking', () => {
    const { layer } = mount([line('a')]);
    layer.setDraft(line('anything'));
    expect(ids(layer)).toEqual(['a']);
    expect(layer.toGeoJSON().features).toHaveLength(1);
    layer.setDraft(null);
    layer.setDraft({ type: 'Feature', id: 'bad', geometry: { type: 'LineString', coordinates: [[0, 0]] } });
    expect(ids(layer)).toEqual(['a']); // an unusable draft just clears
  });

  it('a replay does not record again: undo/redo leave the log where it was', () => {
    const { canvas, layer } = mount();
    layer.addFeature(line('a'));
    layer.addFeature(line('b'));
    const entries = canvas.history.entries().length;
    canvas.history.undo();
    canvas.history.redo();
    expect(canvas.history.entries().length).toBe(entries);
    expect(ids(layer)).toEqual(['a', 'b']);
  });

  it('announces edits, undo and redo through feature:change', () => {
    const { canvas, layer } = mount();
    const seen: string[] = [];
    layer.events.on('feature:change', ({ kind, id }) => seen.push(`${kind}:${id}`));
    layer.addFeature(line('a'));
    canvas.history.undo();
    canvas.history.redo();
    expect(seen).toEqual(['add:a', 'remove:a', 'add:a']);
  });

  it('toGeoJSONString round-trips', () => {
    const { layer } = mount([line('a', { name: 'A' })]);
    expect(JSON.parse(layer.toGeoJSONString())).toEqual(layer.toGeoJSON());
    expect(layer.toGeoJSONString({ pretty: true })).toContain('\n  ');
  });
});
