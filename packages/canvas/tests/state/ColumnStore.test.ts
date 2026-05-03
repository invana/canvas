import { describe, expect, it } from 'vitest';
import { ColumnStore } from '../../src/state/ColumnStore';

const SCHEMA = {
  x: 'f32',
  y: 'f32',
  color: 'u32',
  size: 'f32',
  typeId: 'u16',
} as const;

class TestNodeStore extends ColumnStore<typeof SCHEMA> {
  constructor(initialCapacity = 16) {
    super(SCHEMA, { initialCapacity });
  }
}

describe('ColumnStore — basic CRUD', () => {
  it('starts empty', () => {
    const cs = new TestNodeStore();
    expect(cs.size).toBe(0);
    expect(cs.version).toBe(0);
    expect(cs.has('x')).toBe(false);
  });

  it('add() assigns a slot and bumps version', () => {
    const cs = new TestNodeStore();
    const slot = cs.add('n-1', { x: 10, y: 20, color: 0xff0000, size: 8, typeId: 0 });
    expect(slot).toBe(0);
    expect(cs.size).toBe(1);
    expect(cs.has('n-1')).toBe(true);
    expect(cs.version).toBe(1);
    expect(cs.slot('n-1')).toBe(0);
    expect(cs.idAt(0)).toBe('n-1');
  });

  it('add() throws on duplicate id', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    expect(() =>
      cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 }),
    ).toThrow(/already exists/);
  });

  it('get() reads a single field', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 100, y: 200, color: 0xabcdef, size: 12, typeId: 5 });
    expect(cs.get('n-1', 'x')).toBe(100);
    expect(cs.get('n-1', 'color')).toBe(0xabcdef);
    expect(cs.get('n-1', 'typeId')).toBe(5);
  });

  it('row() materialises a full row', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 1, y: 2, color: 3, size: 4, typeId: 5 });
    expect(cs.row('n-1')).toEqual({ x: 1, y: 2, color: 3, size: 4, typeId: 5 });
  });

  it('get() / row() return undefined for missing id', () => {
    const cs = new TestNodeStore();
    expect(cs.get('missing', 'x')).toBeUndefined();
    expect(cs.row('missing')).toBeUndefined();
  });

  it('set() updates a field and bumps version', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 10, y: 20, color: 0, size: 0, typeId: 0 });
    const v = cs.version;
    cs.set('n-1', 'x', 50);
    expect(cs.get('n-1', 'x')).toBe(50);
    expect(cs.version).toBe(v + 1);
  });

  it('set() on missing id is a no-op (no version bump)', () => {
    const cs = new TestNodeStore();
    const v = cs.version;
    cs.set('missing', 'x', 100);
    expect(cs.version).toBe(v);
  });

  it('update() applies a partial', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.update('n-1', { x: 99, color: 0xdeadbe });
    expect(cs.get('n-1', 'x')).toBe(99);
    expect(cs.get('n-1', 'color')).toBe(0xdeadbe);
    // Untouched fields preserved.
    expect(cs.get('n-1', 'y')).toBe(0);
  });

  it('remove() frees the slot for reuse', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.add('n-2', { x: 1, y: 1, color: 0, size: 0, typeId: 0 });
    cs.remove('n-1');
    expect(cs.has('n-1')).toBe(false);
    expect(cs.idAt(0)).toBeUndefined();

    // Recycled slot 0 used for next add.
    const slot = cs.add('n-3', { x: 9, y: 9, color: 0, size: 0, typeId: 0 });
    expect(slot).toBe(0);
    expect(cs.idAt(0)).toBe('n-3');
  });

  it('remove() on missing id is a no-op', () => {
    const cs = new TestNodeStore();
    const v = cs.version;
    cs.remove('missing');
    // No-op: not even a version bump for a missing id.
    expect(cs.version).toBe(v);
  });

  it('clear() drops all items but preserves capacity', () => {
    const cs = new TestNodeStore(64);
    for (let i = 0; i < 10; i++) {
      cs.add(`n-${i}`, { x: i, y: i, color: 0, size: 0, typeId: 0 });
    }
    cs.clear();
    expect(cs.size).toBe(0);
    expect(cs.capacity).toBe(64); // not shrunk
  });
});

describe('ColumnStore — bulk operations', () => {
  it('addBulk adds many items in one call', () => {
    const cs = new TestNodeStore(4); // small initial cap forces grow
    const items = [];
    for (let i = 0; i < 100; i++) {
      items.push({
        id: `n-${i}`,
        row: { x: i, y: i * 2, color: i, size: 4, typeId: 0 },
      });
    }
    cs.addBulk(items);
    expect(cs.size).toBe(100);
    expect(cs.get('n-50', 'x')).toBe(50);
    expect(cs.get('n-50', 'y')).toBe(100);
  });

  it('addBulk throws on duplicate id within the batch', () => {
    const cs = new TestNodeStore();
    expect(() =>
      cs.addBulk([
        { id: 'n-1', row: { x: 0, y: 0, color: 0, size: 0, typeId: 0 } },
        { id: 'n-1', row: { x: 0, y: 0, color: 0, size: 0, typeId: 0 } },
      ]),
    ).toThrow(/already exists/);
  });

  it('removeBulk removes many items', () => {
    const cs = new TestNodeStore();
    for (let i = 0; i < 10; i++) {
      cs.add(`n-${i}`, { x: i, y: i, color: 0, size: 0, typeId: 0 });
    }
    cs.removeBulk(['n-1', 'n-3', 'n-5']);
    expect(cs.size).toBe(7);
    expect(cs.has('n-1')).toBe(false);
    expect(cs.has('n-3')).toBe(false);
    expect(cs.has('n-5')).toBe(false);
    expect(cs.has('n-2')).toBe(true);
  });
});

describe('ColumnStore — capacity & growth', () => {
  it('grows automatically past initial capacity', () => {
    const cs = new TestNodeStore(2);
    expect(cs.capacity).toBe(2);
    cs.add('a', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.add('b', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.add('c', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    expect(cs.capacity).toBeGreaterThanOrEqual(3);
    expect(cs.size).toBe(3);
  });

  it('preserves existing data after grow', () => {
    const cs = new TestNodeStore(2);
    cs.add('a', { x: 11, y: 22, color: 0, size: 0, typeId: 0 });
    cs.add('b', { x: 33, y: 44, color: 0, size: 0, typeId: 0 });
    cs.add('c', { x: 55, y: 66, color: 0, size: 0, typeId: 0 }); // triggers grow
    expect(cs.get('a', 'x')).toBe(11);
    expect(cs.get('b', 'y')).toBe(44);
    expect(cs.get('c', 'x')).toBe(55);
  });
});

describe('ColumnStore — fast path', () => {
  it('column() returns a stable TypedArray reference (until grown)', () => {
    const cs = new TestNodeStore(64);
    cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    const xCol = cs.column('x');
    expect(xCol).toBeInstanceOf(Float32Array);
    expect(xCol.length).toBe(64);
  });

  it('direct fast-path writes work; touch() bumps version', () => {
    const cs = new TestNodeStore();
    cs.add('n-1', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    const v = cs.version;
    const xCol = cs.column('x');
    const slot = cs.slot('n-1')!;
    xCol[slot] = 999;
    cs.touch();
    expect(cs.get('n-1', 'x')).toBe(999);
    expect(cs.version).toBeGreaterThan(v);
  });
});

describe('ColumnStore — perf smoke', () => {
  it('handles 100k bulk adds well under a second', () => {
    const cs = new TestNodeStore(1024);
    const items = [];
    for (let i = 0; i < 100_000; i++) {
      items.push({
        id: `n-${i}`,
        row: { x: i, y: i, color: i, size: 4, typeId: 0 },
      });
    }
    const t0 = performance.now();
    cs.addBulk(items);
    const ms = performance.now() - t0;
    expect(cs.size).toBe(100_000);
    expect(ms).toBeLessThan(1000);
  });

  it('handles 100k single set() calls in under a second', () => {
    const cs = new TestNodeStore(1024);
    for (let i = 0; i < 100_000; i++) {
      cs.add(`n-${i}`, { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    }
    const t0 = performance.now();
    for (let i = 0; i < 100_000; i++) {
      cs.set(`n-${i}`, 'x', i);
    }
    const ms = performance.now() - t0;
    expect(cs.get('n-99999', 'x')).toBe(99_999);
    expect(ms).toBeLessThan(1000);
  });

  it('fast-path direct writes are even faster', () => {
    const cs = new TestNodeStore(1024);
    for (let i = 0; i < 100_000; i++) {
      cs.add(`n-${i}`, { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    }
    const xCol = cs.column('x');
    const t0 = performance.now();
    for (let i = 0; i < 100_000; i++) {
      const slot = cs.slot(`n-${i}`)!;
      xCol[slot] = i;
    }
    cs.touch();
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(500); // less than half the per-set() cost
  });
});

describe('ColumnStore — iteration', () => {
  it('forEach visits live ids only, not holes', () => {
    const cs = new TestNodeStore();
    cs.add('a', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.add('b', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.add('c', { x: 0, y: 0, color: 0, size: 0, typeId: 0 });
    cs.remove('b');
    const seen: string[] = [];
    cs.forEach((id) => seen.push(id));
    expect(seen).toEqual(['a', 'c']);
  });
});
