import { describe, expect, it, vi } from 'vitest';
import {
  findSerialisationViolations,
  assertSerialisableInDev,
} from '../../src/events/assertSerialisable';

describe('findSerialisationViolations — primitives & containers', () => {
  it('passes string / number / boolean / null / undefined', () => {
    expect(findSerialisationViolations('hello')).toEqual([]);
    expect(findSerialisationViolations(42)).toEqual([]);
    expect(findSerialisationViolations(true)).toEqual([]);
    expect(findSerialisationViolations(null)).toEqual([]);
    expect(findSerialisationViolations(undefined)).toEqual([]);
  });

  it('passes plain objects, arrays, Maps, Sets', () => {
    expect(findSerialisationViolations({ a: 1, b: 'two' })).toEqual([]);
    expect(findSerialisationViolations([1, 2, 'three'])).toEqual([]);
    expect(findSerialisationViolations(new Map([['a', 1]]))).toEqual([]);
    expect(findSerialisationViolations(new Set([1, 2, 3]))).toEqual([]);
  });

  it('passes nested combinations', () => {
    const payload = {
      ids: new Set(['a', 'b']),
      meta: { count: 2, names: ['Alice', 'Bob'] },
      lookup: new Map([['a', { type: 'user' }]]),
    };
    expect(findSerialisationViolations(payload)).toEqual([]);
  });
});

describe('findSerialisationViolations — violations', () => {
  it('flags a function reference', () => {
    const v = findSerialisationViolations({ cb: () => {} });
    expect(v).toContain('cb — function reference');
  });

  it('flags a class instance', () => {
    class Foo {}
    const v = findSerialisationViolations({ inner: new Foo() });
    // Path includes the inner field; message mentions class name.
    expect(v.some((m) => m.includes('inner') && m.includes('Foo'))).toBe(true);
  });

  it('flags a symbol', () => {
    const v = findSerialisationViolations({ s: Symbol('x') });
    expect(v).toContain('s — symbol');
  });

  it('flags a bigint', () => {
    const v = findSerialisationViolations({ n: 10n });
    expect(v).toContain('n — bigint');
  });

  it('reports the path of a deeply nested violation', () => {
    const v = findSerialisationViolations({
      ok: 1,
      bad: { nested: { fn: () => {} } },
    });
    expect(v.some((m) => m.startsWith('bad.nested.fn'))).toBe(true);
  });

  it('flags non-string/number Map keys', () => {
    const m = new Map();
    m.set({}, 'value');
    const v = findSerialisationViolations(m);
    expect(v.some((m) => m.includes('non-primitive key'))).toBe(true);
  });

  it('walks arrays and tags index in the path', () => {
    const v = findSerialisationViolations({ items: [1, 2, () => {}] });
    expect(v.some((m) => m.startsWith('items[2]'))).toBe(true);
  });

  it('handles cycles without infinite recursion', () => {
    const a: Record<string, unknown> = { name: 'a' };
    const b: Record<string, unknown> = { name: 'b' };
    a.b = b;
    b.a = a;
    expect(() => findSerialisationViolations(a)).not.toThrow();
  });

  it('flags multiple violations from one walk', () => {
    class Foo {}
    const v = findSerialisationViolations({
      a: () => {},
      b: new Foo(),
      c: 'fine',
    });
    expect(v.length).toBeGreaterThanOrEqual(2);
  });
});

describe('assertSerialisableInDev', () => {
  it('warns once per violation in dev mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    assertSerialisableInDev({ cb: () => {} }, "emit('foo')");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("emit('foo')");
    expect(warnSpy.mock.calls[0]?.[0]).toContain('cb');
    warnSpy.mockRestore();
  });

  it('does not warn when payload is fully serialisable', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    assertSerialisableInDev({ id: 'n-1', count: 5 }, "emit('foo')");
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
