import { describe, expect, it } from 'vitest';

import { createCanvasStore, type LayerFlush } from '../src/index';

/**
 * The "review everything" test: every data manipulation (nodes/edges/groups/
 * annotations + bulk layout positions) and every view-setting update (layer /
 * behaviour / layout / interaction) — all observed through **one** subscription
 * on the bus, which is exactly how the canvas (orchestrator + renderer) binds.
 */

type StateChange = { action?: string; changedPaths: string[] };
type DataFlush = { layerId: string; delta: LayerFlush };

describe('features — every manipulation, one subscription on the bus', () => {
  it('the canvas sees ALL updates (view + data) through a single tap', () => {
    const store = createCanvasStore();
    const graph = store.layer('graph');

    // ── ONE subscription — how the canvas binds today (view + data on one channel) ──
    const log: string[] = [];
    store.events.tap((e) => {
      if (e.type === 'state:change') {
        log.push(`view:${(e.payload as StateChange).action}`);
      } else if (e.type === 'data:flush') {
        const { layerId, delta } = e.payload as DataFlush;
        const n = delta.nodes;
        log.push(
          `data:${layerId}:n+${n.added.length}/c${n.changed.length}/m${n.moved.length}/r${n.removed.length}` +
            `|e+${delta.edges.added.length}|g+${delta.groups.added.length}|a+${delta.annotations.added.length}`,
        );
      }
    });

    // ── DATA: add nodes, edges, groups, annotations (one coalesced flush) ──
    graph.addNode({ id: 'a' });
    graph.addNode({ id: 'b' });
    graph.addEdge({ id: 'e1', source: 'a', target: 'b' });
    graph.addGroup({ id: 'g1', memberIds: ['a', 'b'] });
    graph.addAnnotation({ id: 'note', kind: 'text', text: 'hi' });
    graph.flush();
    expect(log.at(-1)).toBe('data:graph:n+2/c0/m0/r0|e+1|g+1|a+1');

    // ── DATA: bulk layout positions onto node data → moved ──
    graph.applyPositions([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 50, y: 0 },
    ]);
    graph.flush();
    expect(log.at(-1)).toBe('data:graph:n+0/c0/m2/r0|e+0|g+0|a+0');

    // ── DATA: update + remove (changed / removed) ──
    graph.updateNode('a', { label: 'A' }); // non-position → changed
    graph.removeAnnotation('note');
    graph.flush();
    expect(log.at(-1)).toBe('data:graph:n+0/c1/m0/r0|e+0|g+0|a+0');

    // ── VIEW: layer / behaviour / layout / interaction settings ──
    store.view.update((s) => {
      s.definition.layers['graph'] = { node: { radius: 8 } };
    }, 'layer.set');
    store.view.update((s) => {
      s.definition.behaviours['hover'] = { enabled: true, degree: 1 };
    }, 'behaviour.set');
    store.view.update((s) => {
      s.definition.layouts['force'] = { charge: -160 };
      s.definition.activeLayout = 'force';
    }, 'layout.set');
    store.view.update((s) => {
      s.interaction.selection = new Set(['a']);
    }, 'select');
    store.view.update((s) => {
      s.interaction.camera = { x: 10, y: 0, zoom: 1.5 };
    }, 'camera');

    // ── the full ordered stream the canvas observed, one tap ──
    expect(log).toEqual([
      'data:graph:n+2/c0/m0/r0|e+1|g+1|a+1',
      'data:graph:n+0/c0/m2/r0|e+0|g+0|a+0',
      'data:graph:n+0/c1/m0/r0|e+0|g+0|a+0',
      'view:layer.set',
      'view:behaviour.set',
      'view:layout.set',
      'view:select',
      'view:camera',
    ]);
  });

  it('a renderer routes by event type (applyView vs applyData)', () => {
    const store = createCanvasStore();
    const graph = store.layer('graph');
    const calls = { applyView: 0, applyData: 0 };

    // exactly the orchestrator's bind(): one tap, route by type
    store.events.tap((e) => {
      if (e.type === 'state:change') calls.applyView++;
      else if (e.type === 'data:flush') calls.applyData++;
    });

    graph.addNode({ id: 'a' });
    graph.flush(); // → data:flush
    store.view.update((s) => {
      s.definition.activeLayout = 'force';
    }, 'layout'); // → state:change
    graph.applyPositions([{ id: 'a', x: 1, y: 2 }]);
    graph.flush(); // → data:flush

    expect(calls).toEqual({ applyView: 1, applyData: 2 });
  });
});
