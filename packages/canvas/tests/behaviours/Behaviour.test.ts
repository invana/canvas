import { describe, expect, it } from 'vitest';
import { Behaviour } from '../../src/behaviours/Behaviour';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import { DefaultGestureArbiter } from '../../src/input/GestureArbiter';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { makeTestScene } from '../_helpers/makeWorld';
import { createCanvasStore } from '@invana/canvas-store';

class TestBehaviour extends Behaviour {
  registerCount = 0;
  destroyCount = 0;
  enableCount = 0;
  disableCount = 0;
  protected onRegister(_ctx: CanvasContext): void {
    this.registerCount++;
  }
  protected override onDestroy(): void {
    this.destroyCount++;
  }
  protected override onEnable(): void {
    this.enableCount++;
  }
  protected override onDisable(): void {
    this.disableCount++;
  }
}

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
  ctx = { events: bus, store: createCanvasStore(), world, stage, camera, gestures: new DefaultGestureArbiter(), layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {}, createOverlay: () => ({}) as never };
  return ctx;
}

describe('Behaviour — defaults', () => {
  it('default enabled = false', () => {
    const b = new TestBehaviour({ id: 'pan' });
    expect(b.enabled).toBe(false);
  });

  it('scope = "canvas" without targetLayerId', () => {
    const b = new TestBehaviour({ id: 'pan' });
    expect(b.scope).toBe('canvas');
    expect(b.targetLayerId).toBeUndefined();
  });

  it('scope = "layer" when targetLayerId is set', () => {
    const b = new TestBehaviour({ id: 'select', targetLayerId: 'graph-1' });
    expect(b.scope).toBe('layer');
    expect(b.targetLayerId).toBe('graph-1');
  });
});

describe('Behaviour — register lifecycle', () => {
  it('register(ctx) stores ctx and runs onRegister', () => {
    const ctx = makeContext();
    const b = new TestBehaviour({ id: 'pan' });
    b.register(ctx);
    expect(b.registerCount).toBe(1);
  });

  it('register twice throws', () => {
    const ctx = makeContext();
    const b = new TestBehaviour({ id: 'pan' });
    b.register(ctx);
    expect(() => b.register(ctx)).toThrow(/already registered/);
  });

  it('destroy() runs onDestroy and clears ctx', () => {
    const ctx = makeContext();
    const b = new TestBehaviour({ id: 'pan' });
    b.register(ctx);
    b.destroy();
    expect(b.destroyCount).toBe(1);
  });

  it('destroy() forces disabled state', () => {
    const ctx = makeContext();
    const b = new TestBehaviour({ id: 'pan', enabled: true });
    b.register(ctx);
    b.destroy();
    expect(b.enabled).toBe(false);
  });
});

describe('Behaviour — enable/disable hooks', () => {
  it('enable runs onEnable, disable runs onDisable', () => {
    const b = new TestBehaviour({ id: 'pan' });
    b.enable();
    expect(b.enabled).toBe(true);
    expect(b.enableCount).toBe(1);
    b.disable();
    expect(b.enabled).toBe(false);
    expect(b.disableCount).toBe(1);
  });

  it('idempotent: enabling an already-enabled behaviour does nothing', () => {
    const b = new TestBehaviour({ id: 'pan', enabled: true });
    b.enable();
    expect(b.enableCount).toBe(0);
    b.disable();
    b.disable();
    expect(b.disableCount).toBe(1);
  });
});

describe('Behaviour — shortcuts', () => {
  it('shortcuts are passed through unchanged', () => {
    const b = new TestBehaviour({ id: 'pan', shortcuts: ['shift+drag', 'space+drag'] });
    expect(b.shortcuts).toEqual(['shift+drag', 'space+drag']);
  });
});
