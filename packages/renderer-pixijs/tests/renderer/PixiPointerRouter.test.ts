/**
 * Paint order must equal pick order.
 *
 * This is the rule the whole single-router fix turns on: when several surfaces
 * overlap, the one that *draws* on top is the one that *picks* on top. Before
 * the renderer split there was one `PrimitivesRenderer` and the question never
 * came up; afterwards every surface owned a router with an always-true
 * `hitArea`, so the topmost pixi container swallowed every press — including the
 * empty HUD surfaces (minimap, dev info, layers panel) that sort above the graph
 * and never draw a spec.
 *
 * See `docs/rfcs/fix/2026-09-11-per-surface-pointer-routers-swallow-picking.md`.
 */

import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';

import { orderByPaintOrderTopFirst } from '../../src/renderer/PixiPointerRouter';

/** A surface stand-in — the ordering only ever reads `root`. */
function surface(label: string, root: Container): { label: string; root: Container } {
  root.label = label;
  return { label, root };
}

/** Attach `child` to `parent` at `zIndex`, flipping the parent into sorted mode. */
function addSorted(parent: Container, child: Container, zIndex: number): Container {
  child.zIndex = zIndex;
  parent.sortableChildren = true;
  parent.addChild(child);
  return child;
}

const labels = (items: { label: string }[]): string[] => items.map((i) => i.label);

describe('orderByPaintOrderTopFirst', () => {
  it('puts a later sibling above an earlier one when nothing sets a zIndex', () => {
    const stage = new Container();
    const first = surface('first', stage.addChild(new Container()));
    const second = surface('second', stage.addChild(new Container()));

    expect(labels(orderByPaintOrderTopFirst([first, second], stage))).toEqual(['second', 'first']);
  });

  it('orders siblings by zIndex once the parent is sorted', () => {
    const stage = new Container();
    // Registered in the order layers mount, which is deliberately not z-order.
    const graph = surface('graph', addSorted(stage, new Container(), 0));
    const background = surface('background', addSorted(stage, new Container(), -1000));
    const minimap = surface('minimap', addSorted(stage, new Container(), 1000));

    expect(labels(orderByPaintOrderTopFirst([graph, background, minimap], stage))).toEqual([
      'minimap',
      'graph',
      'background',
    ]);
  });

  it('follows pixi in letting one non-zero zIndex opt the whole parent into sorting', () => {
    const stage = new Container();
    // Pixi v8's `zIndex` setter calls `depthOfChildModified`, which flips the
    // parent's `sortableChildren` on. So a single layer asking for a zIndex
    // re-orders *all* its siblings — the rule the ordering key has to follow,
    // or picking and painting disagree for everyone else on that parent.
    const raised = new Container();
    raised.zIndex = 9999;
    const first = surface('first', stage.addChild(raised));
    const second = surface('second', stage.addChild(new Container()));

    expect(stage.sortableChildren).toBe(true);
    // Added first, but zIndex 9999 paints it last — so it picks first.
    expect(labels(orderByPaintOrderTopFirst([first, second], stage))).toEqual(['first', 'second']);
  });

  it('breaks a zIndex tie by insertion order, in either sorted state', () => {
    // Pixi sorts with a stable `Array.prototype.sort` on `_zIndex` alone, so
    // equal-zIndex siblings keep their relative insertion order whether or not
    // `sortChildren()` has run yet. The key must agree in both states, because
    // a pointer event can arrive before the next render sorts the array.
    const stage = new Container();
    const marker = addSorted(stage, new Container(), 5);
    const a = surface('a', stage.addChild(new Container()));
    const b = surface('b', stage.addChild(new Container()));
    expect(marker.zIndex).toBe(5);

    const before = labels(orderByPaintOrderTopFirst([a, b], stage));
    stage.sortChildren();
    const after = labels(orderByPaintOrderTopFirst([a, b], stage));

    expect(before).toEqual(['b', 'a']);
    expect(after).toEqual(before);
  });

  it('ranks a nested world surface by its viewport, then by its own order within it', () => {
    // The real scene: stage > [background(-1000), viewport(0), minimap(1000)],
    // and the world surfaces live inside the viewport.
    const stage = new Container();
    const background = surface('background', addSorted(stage, new Container(), -1000));
    const viewport = addSorted(stage, new Container(), 0);
    const minimap = surface('minimap', addSorted(stage, new Container(), 1000));

    const graph = surface('graph', viewport.addChild(new Container()));
    const contour = surface('contour', viewport.addChild(new Container()));

    expect(
      labels(orderByPaintOrderTopFirst([background, minimap, graph, contour], stage)),
    ).toEqual([
      // A screen surface above the viewport outranks everything inside it…
      'minimap',
      // …then the viewport's own children, latest first…
      'contour',
      'graph',
      // …and a screen surface below the viewport stays below its contents.
      'background',
    ]);
  });

  it('keeps a deep surface under a shallow one that sorts above its whole branch', () => {
    const stage = new Container();
    const viewport = addSorted(stage, new Container(), 0);
    const nested = viewport.addChild(new Container());
    const deep = surface('deep', nested.addChild(new Container()));
    const hud = surface('hud', addSorted(stage, new Container(), 500));

    expect(labels(orderByPaintOrderTopFirst([deep, hud], stage))).toEqual(['hud', 'deep']);
  });

  it('is stable for a single surface and for none', () => {
    const stage = new Container();
    const only = surface('only', stage.addChild(new Container()));

    expect(labels(orderByPaintOrderTopFirst([only], stage))).toEqual(['only']);
    expect(orderByPaintOrderTopFirst([], stage)).toEqual([]);
  });
});
