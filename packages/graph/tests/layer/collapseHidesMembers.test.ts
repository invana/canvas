/**
 * Collapsing a group must hide its members whichever way the flip arrives.
 *
 * The renderer split turns on this inversion: a layer resolves style +
 * templates into specs and puts them in the kernel, so a renderer can subscribe
 * and project rather than being pushed at. These tests pin the contract that
 * makes that possible — specs land, deltas report, and removals clean up.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`, so this runs
 * with no GPU and no DOM beyond the text-metrics stub below.
 *
 * See `docs/renderer-split-design.md` §2 and §4.2b.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas , HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { COLLAPSED_STATE, type NodeStyle } from '../../src/layer/types';

/**
 * Two node-environment gaps to fill: pixi measures text through a 2D context,
 * and `pixi-viewport` attaches listeners to a DOM element at construction.
 */
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
    getContext: () => ({
      font: '',
      measureText: (t: string) => ({
        width: t.length * 7,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 3,
      }),
    }),
  });
  g['document'] ??= { createElement: element };
});

function mountGroup(groupStates?: string[]): { canvas: Canvas; layer: GraphLayer } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({
    id: 'graph',
    options: {
      initData: {
        nodes: [
          { type: 'node', id: 'g', position: { x: 0, y: 0 }, ...(groupStates ? { states: groupStates } : {}), style: { shape: { kind: 'rect', width: 80, height: 60 }, group: { autoFit: true, padding: 20 } } },
          { type: 'node', id: 'c1', parentId: 'g', position: { x: -50, y: 0 } },
          { type: 'node', id: 'c2', parentId: 'g', position: { x: 50, y: 0 } },
        ],
        edges: [],
      },
    },
  });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  settle(layer);
  return { canvas, layer };
}

function settle(layer: GraphLayer): void {
  layer.store.flush();
  layer.flush();
}

describe('GraphLayer — collapse hides members', () => {
  it('control: a state flip alone', () => {
    const { layer } = mountGroup();
    layer.store.setNodeState('g', COLLAPSED_STATE, true);
    settle(layer);
    expect(layer.store.isNodeVisible('c1')).toBe(false);
    expect(layer.store.isNodeVisible('c2')).toBe(false);
  });

  it('a style write and a state flip in the same tick', () => {
    const { layer } = mountGroup();
    const prior = layer.store.getNode('g')!.style as NodeStyle;
    layer.store.updateNode('g', { style: { ...prior, group: { ...prior.group, padding: 24 } } });
    layer.store.setNodeState('g', COLLAPSED_STATE, true);
    settle(layer);
    expect(layer.store.isNodeVisible('c1')).toBe(false);
    expect(layer.store.isNodeVisible('c2')).toBe(false);
  });

  it('a group authored closed (`states: [\'collapsed\']`) loads with its members hidden', () => {
    const { layer } = mountGroup([COLLAPSED_STATE]);
    expect(layer.store.isNodeVisible('c1')).toBe(false);
    expect(layer.store.isNodeVisible('c2')).toBe(false);
  });
});
