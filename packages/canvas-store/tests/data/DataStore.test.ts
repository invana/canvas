import { describe, expect, it, vi } from 'vitest';

import { DataStore, type FlushEvent, type Record_ } from '../../src/data/DataStore';

interface Node extends Record_ {
  team: string;
}

describe('DataStore', () => {
  it('setData + read + size', () => {
    const ds = new DataStore<Node>();
    ds.setData([
      { id: 'a', team: 'eng' },
      { id: 'b', team: 'design' },
    ]);
    expect(ds.size).toBe(2);
    expect(ds.read('a')).toEqual({ id: 'a', team: 'eng' });
  });

  it('manual flush emits one coalesced delta', () => {
    const ds = new DataStore<Node>();
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));
    ds.upsert({ id: 'a', team: 'eng' });
    ds.upsert({ id: 'b', team: 'eng' });
    ds.update('a', { team: 'design' });
    ds.flush();
    expect(seen).toHaveLength(1);
    expect(seen[0]!.added.sort()).toEqual(['a', 'b']);
    expect(seen[0]!.changed).toEqual([]); // 'a' was added this cycle → stays "added", not "changed"
    expect(seen[0]!.version).toBe(1);
  });

  it('add-then-remove before flush is a net no-op', () => {
    const ds = new DataStore<Node>();
    const seen: FlushEvent[] = [];
    ds.on('flush', (e) => seen.push(e));
    ds.upsert({ id: 'x', team: 'eng' });
    ds.remove('x');
    ds.flush();
    expect(seen).toHaveLength(0);
    expect(ds.size).toBe(0);
  });

  it('coalesces async writes into one microtask flush', async () => {
    const ds = new DataStore<Node>();
    const listener = vi.fn();
    ds.on('flush', listener);
    ds.upsert({ id: 'a', team: 'eng' });
    ds.upsert({ id: 'b', team: 'eng' });
    expect(listener).not.toHaveBeenCalled(); // not yet — coalesced
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
