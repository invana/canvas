/**
 * Hiding whole types: every element of a hidden type, and the edges of a hidden
 * node type, are not visible — including ones that arrive later — and the
 * `graph.typeVisible` command toggles it as one undoable step.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';

import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import type { GraphData } from '../../src/layer/types';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {}, addEventListener: () => {}, removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
});

const DATA: GraphData = {
  nodes: [
    { id: 'ann', type: 'person' },
    { id: 'bob', type: 'person' },
    { id: 'acme', type: 'company' },
  ],
  edges: [
    { id: 'knows', type: 'KNOWS', source: 'ann', target: 'bob' },
    { id: 'works', type: 'WORKS_AT', source: 'ann', target: 'acme' },
  ],
};

describe('hidden types', () => {
  it('hides a node type with its edges, and a node of it that arrives later', () => {
    const layer = new GraphLayer({ id: 'graph', options: { hiddenTypes: { node: ['company'] } } });
    layer.store.addData(DATA);
    const s = layer.store;
    expect(s.isNodeVisible('acme')).toBe(false);
    expect(s.isEdgeVisible('works')).toBe(false);
    expect(s.isNodeVisible('ann')).toBe(true);
    expect(s.isEdgeVisible('knows')).toBe(true);

    s.addData({ nodes: [{ id: 'globex', type: 'company' }], edges: [] });
    expect(s.isNodeVisible('globex')).toBe(false);

    layer.setOptions({ hiddenTypes: { node: [], edge: ['KNOWS'] } });
    expect(s.isNodeVisible('acme')).toBe(true);
    expect(s.isEdgeVisible('works')).toBe(true);
    expect(s.isEdgeVisible('knows')).toBe(false);
  });

  it('toggles through graph.typeVisible as one undoable step', () => {
    const canvas = new GraphCanvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    const layer = new GraphLayer({ id: 'graph', options: { initData: DATA } });
    canvas.layers.add(layer);
    canvas.layers.mountAll();
    layer.store.flush();
    const args = { kind: 'node' as const, type: 'person' };

    expect(canvas.commands.isActive('graph.typeVisible', args)).toBe(true);
    canvas.commands.run('graph.typeVisible', args);
    expect(canvas.commands.isActive('graph.typeVisible', args)).toBe(false);
    expect(layer.store.isNodeVisible('ann')).toBe(false);
    expect(layer.store.isEdgeVisible('works')).toBe(false);
    // …and the drawing follows on the next flush, with nothing else changed.
    layer.store.flush();
    expect((canvas.store.specs['graph']!.get('ann') as { visible?: boolean }).visible).toBe(false);

    canvas.history.undo();
    expect(layer.store.isNodeVisible('ann')).toBe(true);
    expect(canvas.commands.isActive('graph.typeVisible', args)).toBe(true);
  });
});
