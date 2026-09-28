import { describe, expect, it, vi } from 'vitest';
import { CommandRegistry, type CanvasCommand } from '../../src/abstracts/registries/CommandRegistry';

/** A context with a counter each command bumps, so tests can tell which one ran. */
function makeRegistry() {
  const ctx = { ran: [] as string[] };
  const registry = new CommandRegistry({ getContext: () => ctx });
  const cmd = (tag: string, extra: Partial<CanvasCommand<typeof ctx>> = {}): CanvasCommand<typeof ctx> => ({
    run: (c) => void c.ran.push(tag),
    ...extra,
  });
  return { ctx, registry, cmd };
}

describe('CommandRegistry', () => {
  it('runs the live registration and reports missing commands', () => {
    const { ctx, registry, cmd } = makeRegistry();
    registry.register('a.run', cmd('a'));
    expect(registry.run('a.run')).toBe(true);
    expect(registry.run('nope')).toBe(false);
    expect(ctx.ran).toEqual(['a']);
  });

  it('does not run a disabled command', () => {
    const { ctx, registry, cmd } = makeRegistry();
    registry.register('a.run', cmd('a', { isEnabled: () => false }));
    expect(registry.run('a.run')).toBe(false);
    expect(registry.isEnabled('a.run')).toBe(false);
    expect(ctx.ran).toEqual([]);
  });

  it('an override is live, and disposing it restores the one underneath', () => {
    const { ctx, registry, cmd } = makeRegistry();
    registry.register('graph.clear', cmd('builtin'));
    const off = registry.register('graph.clear', cmd('undoable'));
    registry.run('graph.clear');
    off();
    registry.run('graph.clear');
    expect(ctx.ran).toEqual(['undoable', 'builtin']);
  });

  it('disposing an overridden registration keeps the override live', () => {
    const { ctx, registry, cmd } = makeRegistry();
    const offBase = registry.register('x', cmd('base'));
    registry.register('x', cmd('override'));
    offBase();
    registry.run('x');
    expect(ctx.ran).toEqual(['override']);
    expect(registry.has('x')).toBe(true);
  });

  it('disposers are idempotent and per registration, even for the same command object', () => {
    const { registry, cmd } = makeRegistry();
    const shared = cmd('shared');
    const off1 = registry.register('x', shared);
    const off2 = registry.register('x', shared);
    off1();
    off1();
    expect(registry.has('x')).toBe(true);
    off2();
    expect(registry.has('x')).toBe(false);
  });

  it('reports value and options of a pick-one command', () => {
    const { registry, cmd } = makeRegistry();
    registry.register('select.mode', cmd('m', {
      value: (_c, args) => (args as { fallback: string }).fallback,
      options: () => [{ value: 'brush', label: 'Brush' }],
    }));
    expect(registry.value('select.mode', { fallback: 'click' })).toBe('click');
    expect(registry.options('select.mode')).toEqual([{ value: 'brush', label: 'Brush' }]);
    expect(registry.value('nope')).toBeNull();
    expect(registry.options('nope')).toEqual([]);
  });

  it('notifies subscribers on register, dispose and invalidate', () => {
    const { registry, cmd } = makeRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    const off = registry.register('x', cmd('x'));
    off();
    registry.invalidate();
    expect(listener).toHaveBeenCalledTimes(3);
  });
});

describe('CommandRegistry — arg validation (validateArgs)', () => {
  const ARGS = {
    s: { kind: 'string' },
    id: { kind: 'layer' },
    n: { kind: 'number' },
    pickN: { kind: 'number', pick: true },
    b: { kind: 'boolean' },
    e: { kind: 'enum', options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }] },
    list: { kind: 'strings' },
    j: { kind: 'json' },
  } as const;

  function setup(validateArgs?: boolean) {
    const ran: unknown[] = [];
    const registry = new CommandRegistry({
      getContext: () => ({}),
      ...(validateArgs !== undefined ? { validateArgs } : {}),
    });
    registry.register('t.cmd', { args: ARGS, run: (_c, args) => void ran.push(args) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    return { registry, ran, warn };
  }

  it('accepts values that fit, absent keys, undescribed keys and a numeric string on a pick number', () => {
    const { registry, ran, warn } = setup(true);
    registry.run('t.cmd', { s: 'a', id: 'graph', n: 2, pickN: '1.5', b: false, e: 'y', list: ['a'], j: { any: [1] }, extra: 1 });
    registry.run('t.cmd');
    registry.run('t.cmd', {});
    expect(warn).not.toHaveBeenCalled();
    expect(ran).toHaveLength(3);
    warn.mockRestore();
  });

  it('warns per mismatched key, never throws, and still runs', () => {
    const { registry, ran, warn } = setup(true);
    const args = { s: 1, id: 3, n: '2', pickN: 'abc', b: 'yes', e: 'z', list: ['a', 2], j: null };
    expect(() => registry.run('t.cmd', args)).not.toThrow();
    expect(ran).toEqual([args]);
    const messages = warn.mock.calls.map(([m]) => String(m));
    expect(messages).toHaveLength(7); // every kind but json
    expect(messages[0]).toContain('command "t.cmd" arg "s"');
    expect(messages.find((m) => m.includes('"e"'))).toContain('"x", "y"');
    warn.mockRestore();
  });

  it('warns once per (command, key, problem)', () => {
    const { registry, warn } = setup(true);
    registry.run('t.cmd', { n: 'x' });
    registry.run('t.cmd', { n: 'x' });
    expect(warn).toHaveBeenCalledTimes(1);
    registry.run('t.cmd', { n: true });
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('warns about non-object args on a described command', () => {
    const { registry, warn } = setup(true);
    registry.run('t.cmd', 'oops');
    expect(String(warn.mock.calls[0]?.[0])).toContain('args should be an object');
    warn.mockRestore();
  });

  it('is silent with validateArgs: false, and for commands without descriptors', () => {
    const { registry, warn } = setup(false);
    registry.run('t.cmd', { n: 'x' });
    registry.register('t.bare', { run: () => {} });
    registry.run('t.bare', { n: 'x' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('defaults on outside production (vitest runs with NODE_ENV=test)', () => {
    const { registry, warn } = setup();
    registry.run('t.cmd', { n: 'x' });
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
