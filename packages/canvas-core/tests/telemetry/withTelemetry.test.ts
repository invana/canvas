import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { withTelemetry, type TelemetryEvent } from '../../src/telemetry/withTelemetry';

interface S {
  layouts: { force: { charge: number } };
  hover: string | null;
}

describe('withTelemetry', () => {
  it('emits one event per change with action + changed paths', () => {
    const store = createMemoryStore<S>({ layouts: { force: { charge: -160 } }, hover: null });
    const events: TelemetryEvent[] = [];
    let t = 1000;
    withTelemetry(store, { emit: (e) => events.push(e) }, () => t++);

    store.update((d) => {
      d.layouts.force.charge = -300;
    }, 'force.charge');

    expect(events).toHaveLength(1);
    expect(events[0]!.action).toBe('force.charge');
    expect(events[0]!.changedPaths).toEqual(['layouts']);
    expect(events[0]!.patches.length).toBe(1);
    expect(events[0]!.ts).toBe(1000);
  });

  it('defaults the action label to "update"', () => {
    const store = createMemoryStore<S>({ layouts: { force: { charge: -160 } }, hover: null });
    const events: TelemetryEvent[] = [];
    withTelemetry(store, { emit: (e) => events.push(e) });
    store.update((d) => {
      d.hover = 'n1';
    });
    expect(events[0]!.action).toBe('update');
    expect(events[0]!.changedPaths).toEqual(['hover']);
  });
});
