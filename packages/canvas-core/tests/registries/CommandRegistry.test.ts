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
