import { describe, expect, it } from 'vitest';

import { createCanvasStore, createHistory, type TelemetryEvent } from '../src/index';

/**
 * The action API — named, action-typed methods instead of raw `view.update`.
 * Reads like intent; each view command bakes in its action label (telemetry /
 * history / CRDT op-log all read meaningfully).
 */
describe('actions — named, action-typed command API', () => {
  it('view commands carry their action label + drive state', () => {
    const telemetry: TelemetryEvent[] = [];
    const store = createCanvasStore({ telemetry: { emit: (e) => telemetry.push(e) } });
    const a = store.actions;

    // layers
    a.layers.add('graph', { type: 'graph', source: 'graph' });
    a.layers.setStyle('graph', { node: { radius: 8 } });
    a.layers.setVisible('graph', false);

    // behaviours
    a.behaviours.add('hover', { degree: 1 });
    a.behaviours.enable('hover');
    a.behaviours.disable('hover');

    // layouts
    a.layouts.set('force', { charge: -160 });
    a.layouts.tune('force', { charge: -300 });
    a.layouts.run('force');

    // camera
    a.camera.set({ x: 5, y: 5, zoom: 1 });
    a.camera.zoom(1.5);
    a.camera.pan(10, 0);

    // selection / hover
    a.selection.set(['a']);
    a.selection.toggle('b');
    a.hover.set('a');

    // templates
    a.templates.create({ id: 't1', label: 'Card' });
    a.templates.update('t1', { label: 'Card v2' });

    // ── state reflects every command ──
    const s = store.view.getState();
    expect(s.definition.layers['graph']).toEqual({ type: 'graph', source: 'graph', style: { node: { radius: 8 } }, visible: false });
    expect(s.definition.behaviours['hover']).toEqual({ degree: 1, enabled: false });
    expect(s.definition.layouts['force']).toEqual({ charge: -300 });
    expect(s.definition.activeLayout).toBe('force');
    expect(s.interaction.camera).toEqual({ x: 15, y: 5, zoom: 1.5 }); // set → zoom → pan
    expect([...s.interaction.selection]).toEqual(['a', 'b']);
    expect(s.interaction.hover).toBe('a');
    expect(s.definition.templates).toEqual([{ id: 't1', label: 'Card v2' }]);

    // ── every view command emitted ITS taxonomy action label (telemetry) ──
    expect(telemetry.map((e) => e.action)).toEqual([
      'view:layer:add', 'view:layer:setStyle', 'view:layer:setVisible',
      'view:behaviour:add', 'view:behaviour:enable', 'view:behaviour:disable',
      'view:layout:set', 'view:layout:tune', 'view:layout:run',
      'view:camera:set', 'view:camera:zoom', 'view:camera:pan',
      'view:selection:set', 'view:selection:toggle', 'view:hover:set',
      'view:template:create', 'view:template:update',
    ]);
  });

  it('data commands proxy to the layer (nodes/edges/positions) + leave an intent record', () => {
    const store = createCanvasStore();
    const a = store.actions;

    // granular data:* events — one per data action (the per-frame data:flush is separate)
    const intents: string[] = [];
    store.events.tap((e) => {
      if (e.type.startsWith('data:') && e.type !== 'data:flush') {
        intents.push(`${e.type}:${(e.payload as { ids: readonly string[] }).ids.length}`);
      }
    });

    a.node.add('graph', { id: 'a' });
    a.node.add('graph', { id: 'b' });
    a.edge.add('graph', { id: 'e1', source: 'a', target: 'b' });
    a.positions.apply('graph', [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 0 }]);
    a.node.moveTo('graph', 'a', 5, 5);
    store.layer('graph').flush();

    expect(store.layer('graph').counts).toEqual({ nodes: 2, edges: 1, groups: 0, annotations: 0 });
    expect(store.layer('graph').node('a')).toMatchObject({ x: 5, y: 5 });
    expect(store.layer('graph').node('b')).toMatchObject({ x: 100, y: 0 });

    // one granular event per action, ids counted — the data-mutation audit/collab trail
    expect(intents).toEqual(['data:node:add:1', 'data:node:add:1', 'data:edge:add:1', 'data:position:apply:2', 'data:node:move:1']);
  });

  it('actions feed history — undo a camera.zoom', () => {
    const store = createCanvasStore();
    const history = createHistory(store.view);
    store.actions.camera.zoomTo(2);
    expect(store.view.getState().interaction.camera.zoom).toBe(2);
    history.undo();
    expect(store.view.getState().interaction.camera.zoom).toBe(1);
  });
});
