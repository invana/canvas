import { describe, expect, it } from 'vitest';

import { createCanvasStore, createHistory, select, type TelemetryEvent } from '../src/index';

/**
 * End-to-end: a single update to a layer / behaviour / layout **setting** drives
 * both the renderer and a React-like component to update — with telemetry and
 * history falling out of the same seam. Data manipulations flow on the separate
 * flush path.
 *
 * The "renderer" and "component" are tiny stand-ins for `canvas-pixijs` /
 * `canvas-react`. The point is the loop:
 *   view.update(setting)  →  events('state:change')  →  renderer + component react
 *   data manipulation     →  layer.flush()           →  events('data:flush') → renderer.applyData
 */

type NodeStyle = { radius: number };

describe('end-to-end — a setting update drives renderer + a React-like subscriber', () => {
  it('layer/behaviour/layout settings react; targeted; telemetry + history fall out', () => {
    const telemetry: TelemetryEvent[] = [];
    const store = createCanvasStore({ telemetry: { emit: (e) => telemetry.push(e) } });
    const history = createHistory(store.view);
    const graph = store.layer('graph');

    const radiusOf = (): number | undefined =>
      (store.view.getState().definition.layers['graph']?.node as NodeStyle | undefined)?.radius;

    // ── stand-in RENDERER: subscribes the ONE bus (view + data) ──
    const render = { applyView: 0, applyData: 0, radius: undefined as number | undefined };
    store.events.on('state:change', () => {
      render.applyView++;
      render.radius = radiusOf();
    });
    store.events.on('data:flush', () => {
      render.applyData++;
    });

    // ── stand-in REACT COMPONENT: subscribes one slice via select() ──
    const radiusSlice = select(
      store.view,
      (s) => (s.definition.layers['graph']?.node as NodeStyle | undefined)?.radius,
    );
    let componentRadius: number | undefined;
    radiusSlice.subscribe(() => {
      componentRadius = radiusSlice.get();
    });

    // 1 ── LOAD DATA (data path → flush → 'data:flush' → renderer.applyData) ──
    graph.setData({
      nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
    });
    graph.flush();
    expect(render.applyData).toBe(1);

    // 2 ── CONFIGURE VIEW: layer + behaviour + layout settings in one update ──
    store.view.update((s) => {
      s.definition.layers['graph'] = { node: { radius: 8 } };
      s.definition.behaviours['hover'] = { enabled: true, degree: 1 };
      s.definition.layouts['force'] = { charge: -160 };
      s.definition.activeLayout = 'force';
    }, 'scene:init');
    expect(render.applyView).toBe(1);
    expect(render.radius).toBe(8);
    expect(componentRadius).toBe(8);
    expect(telemetry.at(-1)?.action).toBe('scene:init');

    // 3 ── RUN LAYOUT: bulk positions onto node data → flush → renderer.applyData ──
    graph.applyPositions(graph.nodes().map((n, i) => ({ id: n.id, x: i * 100, y: 0 })));
    graph.flush();
    expect(render.applyData).toBe(2);
    expect(graph.node('b')?.x).toBe(100);

    // 4 ── ★ UPDATE A LAYER SETTING → renderer + component BOTH update ──
    store.view.update((s) => {
      s.definition.layers['graph'] = { node: { radius: 12 } };
    }, 'node.size');
    expect(render.applyView).toBe(2);
    expect(render.radius).toBe(12);
    expect(componentRadius).toBe(12);
    expect(telemetry.at(-1)?.action).toBe('node.size');

    // 5 ── UNDO → both revert to 8 ──
    history.undo();
    expect(render.radius).toBe(8);
    expect(componentRadius).toBe(8);

    // 6 ── A BEHAVIOUR setting update — same loop, DIFFERENT slice (targeted) ──
    const viewsBefore = render.applyView;
    store.view.update((s) => {
      s.definition.behaviours['hover'] = { enabled: true, degree: 3 };
    }, 'hover.degree');
    expect(render.applyView).toBe(viewsBefore + 1);
    expect(telemetry.at(-1)?.action).toBe('hover.degree');
    expect(componentRadius).toBe(8); // radius slice unchanged → component did NOT re-fire
  });
});
