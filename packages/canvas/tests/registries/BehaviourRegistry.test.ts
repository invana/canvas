import { describe, expect, it, vi } from 'vitest';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import type { IBehaviour } from '../../src/behaviours/Behaviour';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { makeTestScene } from '../_helpers/makeWorld';
import { createCanvasStore } from '@invana/canvas-store';

function makeContext() {
  const bus = new CanvasEventBus();
  const { stage, world } = makeTestScene();
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, store: createCanvasStore(), world, stage, camera, layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {} };
  return ctx;
}

class FakeBehaviour implements IBehaviour {
  readonly id: string;
  readonly scope: 'layer' | 'canvas';
  readonly targetLayerId?: string;
  readonly shortcuts?: readonly string[];
  enabled: boolean;
  isRegistered = false;
  registerCount = 0;
  destroyCount = 0;
  enableCount = 0;
  disableCount = 0;

  constructor(opts: {
    id: string;
    enabled?: boolean;
    targetLayerId?: string;
    shortcuts?: readonly string[];
  }) {
    this.id = opts.id;
    this.enabled = opts.enabled ?? false;
    this.targetLayerId = opts.targetLayerId;
    this.scope = opts.targetLayerId ? 'layer' : 'canvas';
    this.shortcuts = opts.shortcuts;
  }
  register(_ctx: CanvasContext): void {
    this.registerCount++;
    this.isRegistered = true;
  }
  destroy(): void {
    this.destroyCount++;
  }
  enable(): void {
    this.enabled = true;
    this.enableCount++;
  }
  disable(): void {
    this.enabled = false;
    this.disableCount++;
  }
  setOptions(_changes: Record<string, unknown>): void {
    /* no-op: this fake doesn't carry options */
  }
}

describe('BehaviourRegistry — basic CRUD', () => {
  it('register() calls behaviour.register and fires behaviour:registered', () => {
    const ctx = makeContext();
    const handler = vi.fn();
    ctx.events.on('scene:behaviour:register', handler);
    const b = new FakeBehaviour({ id: 'pan' });
    ctx.behaviours.register(b);
    expect(b.registerCount).toBe(1);
    expect(handler).toHaveBeenCalledWith({ id: 'pan' });
  });

  it('throws on duplicate id', () => {
    const ctx = makeContext();
    ctx.behaviours.register(new FakeBehaviour({ id: 'pan' }));
    expect(() => ctx.behaviours.register(new FakeBehaviour({ id: 'pan' }))).toThrow(
      /already registered/,
    );
  });

  it('unregister() destroys the behaviour', () => {
    const ctx = makeContext();
    const b = new FakeBehaviour({ id: 'pan' });
    ctx.behaviours.register(b);
    ctx.behaviours.unregister('pan');
    expect(b.destroyCount).toBe(1);
    expect(ctx.behaviours.has('pan')).toBe(false);
  });
});

describe('BehaviourRegistry — enable / disable lifecycle', () => {
  it('default-enabled behaviour fires behaviour:enabled on register', () => {
    const ctx = makeContext();
    const handler = vi.fn();
    ctx.events.on('scene:behaviour:enable', handler);
    ctx.behaviours.register(new FakeBehaviour({ id: 'pan', enabled: true }));
    expect(handler).toHaveBeenCalledWith({ id: 'pan' });
  });

  it('setEnabled toggles + fires the matching event', () => {
    const ctx = makeContext();
    const enableH = vi.fn();
    const disableH = vi.fn();
    ctx.events.on('scene:behaviour:enable', enableH);
    ctx.events.on('scene:behaviour:disable', disableH);
    ctx.behaviours.register(new FakeBehaviour({ id: 'pan' }));

    ctx.behaviours.setEnabled('pan', true);
    expect(enableH).toHaveBeenCalledWith({ id: 'pan' });
    ctx.behaviours.setEnabled('pan', false);
    expect(disableH).toHaveBeenCalledWith({ id: 'pan' });
  });

  it('setEnabled is idempotent (no spurious events)', () => {
    const ctx = makeContext();
    const enableH = vi.fn();
    ctx.events.on('scene:behaviour:enable', enableH);
    ctx.behaviours.register(new FakeBehaviour({ id: 'pan', enabled: true }));
    enableH.mockClear();
    ctx.behaviours.setEnabled('pan', true); // already enabled
    expect(enableH).not.toHaveBeenCalled();
  });
});

describe('BehaviourRegistry — gesture conflict warnings', () => {
  it('warns when two enabled behaviours share a shortcut', () => {
    const ctx = makeContext();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    ctx.behaviours.register(
      new FakeBehaviour({ id: 'pan', enabled: true, shortcuts: ['shift+drag'] }),
    );
    ctx.behaviours.register(
      new FakeBehaviour({
        id: 'lasso-select',
        enabled: true,
        shortcuts: ['shift+drag'],
      }),
    );

    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('shift+drag'))).toBe(true);
    warnSpy.mockRestore();
  });

  it('does NOT warn when only one of the two is enabled', () => {
    const ctx = makeContext();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    ctx.behaviours.register(
      new FakeBehaviour({ id: 'pan', enabled: true, shortcuts: ['shift+drag'] }),
    );
    ctx.behaviours.register(
      new FakeBehaviour({
        id: 'lasso-select',
        enabled: false,
        shortcuts: ['shift+drag'],
      }),
    );

    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('BehaviourRegistry — clear', () => {
  it('clear() unregisters every behaviour', () => {
    const ctx = makeContext();
    const a = new FakeBehaviour({ id: 'a' });
    const b = new FakeBehaviour({ id: 'b' });
    ctx.behaviours.register(a);
    ctx.behaviours.register(b);
    ctx.behaviours.clear();
    expect(a.destroyCount).toBe(1);
    expect(b.destroyCount).toBe(1);
    expect(ctx.behaviours.size).toBe(0);
  });
});
