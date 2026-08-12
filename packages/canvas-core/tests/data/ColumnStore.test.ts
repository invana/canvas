import { describe, expect, it } from 'vitest';

import { ColumnStore } from '../../src/index';

/** The relocated typed-array hot lane (decision D1) — slots, fast path, grow, recycle. */
describe('ColumnStore — typed-array hot lane', () => {
  type NodeSchema = { x: 'f32'; y: 'f32'; flags: 'u8' };
  const schema = { x: 'f32', y: 'f32', flags: 'u8' } as const;

  it('adds / reads rows and bumps version', () => {
    const c = new ColumnStore<NodeSchema>(schema);
    expect(c.size).toBe(0);
    const v0 = c.version;
    c.add('n1', { x: 10, y: 20, flags: 1 });
    expect(c.size).toBe(1);
    expect(c.version).toBeGreaterThan(v0);
    expect(c.get('n1', 'x')).toBe(10);
    expect(c.row('n1')).toEqual({ x: 10, y: 20, flags: 1 });
    expect(c.has('n1')).toBe(true);
    expect(c.get('missing', 'x')).toBeUndefined();
  });

  it('throws on duplicate id', () => {
    const c = new ColumnStore<NodeSchema>(schema);
    c.add('n1', { x: 0, y: 0, flags: 0 });
    expect(() => c.add('n1', { x: 1, y: 1, flags: 0 })).toThrow(/already exists/);
  });

  it('fast path: column ref + slot writes, then touch()', () => {
    const c = new ColumnStore<NodeSchema>(schema);
    c.add('n1', { x: 0, y: 0, flags: 0 });
    const xCol = c.column('x');
    const slot = c.slot('n1')!;
    const v = c.version;
    xCol[slot] = 99;
    c.touch();
    expect(c.get('n1', 'x')).toBe(99);
    expect(c.version).toBeGreaterThan(v);
    expect(c.idAt(slot)).toBe('n1');
  });

  it('recycles slots on remove and grows past capacity', () => {
    const c = new ColumnStore<NodeSchema>(schema, { initialCapacity: 2 });
    c.add('a', { x: 0, y: 0, flags: 0 });
    const slotB = c.add('b', { x: 0, y: 0, flags: 0 });
    c.remove('a');
    expect(c.has('a')).toBe(false);
    // next add reuses the freed slot
    const slotC = c.add('c', { x: 0, y: 0, flags: 0 });
    expect(slotC).not.toBe(slotB);
    // force a grow
    c.addBulk([
      { id: 'd', row: { x: 0, y: 0, flags: 0 } },
      { id: 'e', row: { x: 0, y: 0, flags: 0 } },
      { id: 'f', row: { x: 0, y: 0, flags: 0 } },
    ]);
    expect(c.size).toBe(5);
    expect(c.capacity).toBeGreaterThanOrEqual(5);
    expect([...c.ids()].sort()).toEqual(['b', 'c', 'd', 'e', 'f']);
  });
});
