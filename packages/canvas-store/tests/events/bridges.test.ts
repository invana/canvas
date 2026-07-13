import { describe, expect, it, vi } from 'vitest';

import { createCanvasStore, type TelemetryEvent } from '../../src/index';
import type { CanvasEvent } from '../../src/events/CanvasEvent';

/** Every kernel update is bridged onto `store.events` — these lock that contract. */

describe('bridges — view mutations → state:change', () => {
  it('a view.update emits state:change with action + changedPaths + source', () => {
    const store = createCanvasStore();
    const seen: CanvasEvent[] = [];
    store.events.tap((e) => seen.push(e));
    store.view.update((s) => {
      s.interaction.hover = 'n1';
    }, 'hover.set');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      type: 'state:change',
      source: { kind: 'store', id: 'view' },
      payload: { action: 'hover.set', changedPaths: ['interaction'] },
    });
  });

  it('a batch emits ONE state:change covering all changed paths', () => {
    const store = createCanvasStore();
    const seen: CanvasEvent[] = [];
    store.events.tap((e) => seen.push(e));
    store.view.batch(() => {
      store.view.update((s) => {
        s.definition.activeLayout = 'force';
      });
      store.view.update((s) => {
        s.interaction.hover = 'n1';
      });
    }, 'multi');
    expect(seen).toHaveLength(1);
    expect((seen[0]!.payload as { changedPaths: string[] }).changedPaths.sort()).toEqual([
      'definition',
      'interaction',
    ]);
  });

  it('a no-op update emits nothing', () => {
    const store = createCanvasStore();
    const tap = vi.fn();
    store.events.tap(tap);
    store.view.update(() => {
      /* touches nothing */
    }, 'noop');
    expect(tap).not.toHaveBeenCalled();
  });
});

describe('bridges — layer data → data:flush', () => {
  it('a layer flush emits data:flush with layerId + delta + source', () => {
    const store = createCanvasStore();
    const seen: CanvasEvent[] = [];
    store.events.tap((e) => seen.push(e));
    store.layer('graph').addNode({ id: 'a' });
    store.layer('graph').flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.type).toBe('data:flush');
    expect(seen[0]!.source).toEqual({ kind: 'data', id: 'graph' });
    const payload = seen[0]!.payload as { layerId: string; delta: { nodes: { added: string[] } } };
    expect(payload.layerId).toBe('graph');
    expect(payload.delta.nodes.added).toEqual(['a']);
  });

  it('different layers emit with their own layerId', () => {
    const store = createCanvasStore();
    const layerIds: string[] = [];
    store.events.on('data:flush', (e) => layerIds.push(e.layerId));
    store.layer('graph').addNode({ id: 'a' });
    store.layer('graph').flush();
    store.layer('table').addNode({ id: 'r1' });
    store.layer('table').flush();
    expect(layerIds).toEqual(['graph', 'table']);
  });
});

describe('bridges — data actions → granular data:<subject>:<action>', () => {
  it('a data action emits its granular taxonomy event (type + layerId + ids)', () => {
    const store = createCanvasStore();
    const seen: Array<{ type: string; layerId: string; ids: readonly string[] }> = [];
    store.events.tap((e) => {
      if (e.type.startsWith('data:') && e.type !== 'data:flush') {
        const p = e.payload as { layerId: string; ids: readonly string[] };
        seen.push({ type: e.type, layerId: p.layerId, ids: p.ids });
      }
    });
    store.actions.node.add('graph', { id: 'a' });
    store.actions.positions.apply('graph', [{ id: 'a', x: 1, y: 2 }]);
    expect(seen).toEqual([
      { type: 'data:node:add', layerId: 'graph', ids: ['a'] },
      { type: 'data:position:apply', layerId: 'graph', ids: ['a'] },
    ]);
  });
});

describe('bridges — the unified stream + telemetry', () => {
  it('one tap sees state:change · data:flush · data:intent, in order', () => {
    const store = createCanvasStore();
    const types: string[] = [];
    store.events.tap((e) => types.push(e.type));

    store.layer('graph').addNode({ id: 'a' });
    store.layer('graph').flush(); // data:flush
    store.view.update((s) => {
      s.definition.activeLayout = 'force';
    }, 'layout'); // state:change
    store.actions.node.add('graph', { id: 'b' }); // data:node:add (granular)
    store.layer('graph').flush(); // data:flush

    expect(types).toEqual(['data:flush', 'state:change', 'data:node:add', 'data:flush']);
  });

  it('telemetry sink + bus coexist (one telemetry event per view update)', () => {
    const telemetry: TelemetryEvent[] = [];
    const store = createCanvasStore({ telemetry: { sink: { emit: (e) => telemetry.push(e) } } });
    let stateChanges = 0;
    store.events.on('state:change', () => stateChanges++);

    store.view.update((s) => {
      s.interaction.hover = 'n1';
    }, 'hover');
    store.layer('graph').addNode({ id: 'a' });
    store.layer('graph').flush(); // data flush — NOT telemetered

    expect(telemetry.map((e) => e.action)).toEqual(['hover']); // only the view update
    expect(stateChanges).toBe(1);
  });
});
