import { describe, expect, it } from 'vitest';

import { createCanvasStore } from '../src/CanvasStore';
import type { CanvasEvent } from '../src/events/CanvasEvent';
import type { TelemetryEvent } from '../src/telemetry/withTelemetry';

describe('createCanvasStore', () => {
  it('wires view + data + events', () => {
    const core = createCanvasStore();
    expect(core.view.getState().interaction.viewMode).toBe('select');
    expect(core.events).toBeDefined();
    expect(core.data).toEqual({});
  });

  it('update reads like a mutation on the view', () => {
    const core = createCanvasStore();
    core.view.update((s) => {
      s.definition.activeLayout = 'force';
      s.definition.layouts['force'] = { charge: -160 };
    }, 'scene:init');
    expect(core.view.getState().definition.activeLayout).toBe('force');
  });

  it('owns layer data lazily by id', () => {
    const core = createCanvasStore();
    const people = core.layer('people');
    people.setData({ nodes: [{ id: 'alice' }, { id: 'bob' }] });
    expect(core.layer('people').counts.nodes).toBe(2);
    expect(core.data['people']).toBe(people);
  });

  it('bridges a layer data flush onto the bus as data:flush', () => {
    const core = createCanvasStore();
    const seen: CanvasEvent[] = [];
    core.events.on('data:flush', () => {
      /* typed listener also fires */
    });
    core.events.tap((e) => seen.push(e));
    core.layer('graph').addNode({ id: 'a' });
    core.layer('graph').flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.type).toBe('data:flush');
    expect(seen[0]!.source).toEqual({ kind: 'data', id: 'graph' });
    expect((seen[0]!.payload as { layerId: string }).layerId).toBe('graph');
  });

  it('bridges state changes onto the event bus tap', () => {
    const core = createCanvasStore();
    const seen: CanvasEvent[] = [];
    core.events.tap((e) => seen.push(e));
    core.view.update((s) => {
      s.interaction.hover = 'n1';
    }, 'hover.set');
    expect(seen).toHaveLength(1);
    expect(seen[0]!.type).toBe('state:change');
    expect(seen[0]!.source).toEqual({ kind: 'store', id: 'view' });
    const payload = seen[0]!.payload as { action?: string; changedPaths: string[]; durationMs?: number };
    expect(payload.action).toBe('hover.set');
    expect(payload.changedPaths).toEqual(['interaction']);
    // The update's produce+commit cost rides on the payload (for taps / tracing).
    expect(typeof payload.durationMs).toBe('number');
  });

  it('telemetry sink observes view updates', () => {
    const events: TelemetryEvent[] = [];
    const core = createCanvasStore({ telemetry: { emit: (e) => events.push(e) } });
    core.view.update((s) => {
      s.interaction.selection = new Set(['alice']);
    }, 'select.set');
    expect(events).toHaveLength(1);
    expect(events[0]!.action).toBe('select.set');
  });
});
