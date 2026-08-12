/**
 * Test doubles for `@invana/canvas-core`'s own suite.
 *
 * This package is dependency-free, so its tests cannot reach for
 * `@invana/canvas-store`'s immer/zustand-backed factories (that would also be
 * a dev-time dependency cycle — the store depends on this package). Instead:
 *
 * - {@link fakeStateStore} — a minimal, patch-less `ReactiveStore`
 *   implementation good enough for lifecycle/state assertions;
 * - {@link fakeCanvasStore} — a real-shaped `CanvasStore` built from core's own
 *   dep-free classes (`CanvasEventBus`, `CanvasThemeState`, `LayerData`,
 *   `SpecStore`, `createActions`) over fake reactive stores;
 * - {@link makeContext} — the full `CanvasContext` stub the abstracts expect,
 *   including the `createStateStore` factory behind `Layer.state`.
 */

import { Camera } from '../../src/abstracts/Camera';
import type { CanvasContext } from '../../src/abstracts/CanvasContext';
import type { CanvasStore } from '../../src/state/CanvasStore';
import { CanvasEventBus } from '../../src/state/events/CanvasEventBus';
import { CanvasThemeState } from '../../src/state/theme/CanvasThemeState';
import { DefaultGestureArbiter } from '../../src/abstracts/GestureArbiter';
import { HeadlessCameraBinding } from '../../src/headless/HeadlessCameraBinding';
import { HeadlessSurface } from '../../src/headless/HeadlessRenderer';
import { LayerData } from '../../src/state/data/LayerData';
import { LayerRegistry } from '../../src/abstracts/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/abstracts/registries/BehaviourRegistry';
import { SpecStore } from '../../src/specs/SpecStore';
import type { DataSource } from '../../src/state/data/DataSource';
import type { ReactiveStore, StoreChange, Update } from '../../src/state/port/types';
import { createActions } from '../../src/state/view/createActions';
import { defaultCanvasView, type CanvasView } from '../../src/state/view/CanvasView';

/** Shallow-ish deep merge matching the port's DeepPartial semantics. */
function mergeInto(target: Record<string, unknown>, patch: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(patch)) {
    const cur = target[k];
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !(v instanceof Set) &&
      !(v instanceof Map) &&
      cur !== null &&
      typeof cur === 'object' &&
      !Array.isArray(cur)
    ) {
      mergeInto(cur as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      target[k] = v;
    }
  }
}

/**
 * A minimal `ReactiveStore` — recipes run against a `structuredClone`, patches
 * are empty (nothing in this suite asserts on them). NOT the real engine:
 * production stores come from `@invana/canvas-store`.
 */
const deepClone = <U,>(v: U): U => (structuredClone as (x: unknown) => unknown)(v) as U;

export function fakeStateStore<T extends object>(initial: T): ReactiveStore<T> {
  let state = initial;
  const listeners = new Set<(s: T, p: T) => void>();
  const changeListeners = new Set<(c: StoreChange<T>) => void>();
  const commit = (next: T, action?: string): void => {
    const prev = state;
    state = next;
    for (const l of [...listeners]) l(state, prev);
    for (const l of [...changeListeners]) l({ state, prev, action, patches: [], inverse: [] });
  };
  return {
    getState: () => state,
    update(update: Update<T>, action?: string): void {
      if (typeof update === 'function') {
        const draft = deepClone(state);
        (update as (draft: T) => void)(draft);
        commit(draft, action);
      } else {
        const next = deepClone(state);
        mergeInto(next as Record<string, unknown>, update as Record<string, unknown>);
        commit(next, action);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    subscribeChanges(listener) {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    batch(run, action) {
      run();
      void action;
    },
  };
}

/** A real-shaped `CanvasStore` assembled from core's dep-free pieces. */
export function fakeCanvasStore(bus = new CanvasEventBus()): CanvasStore {
  const view = fakeStateStore<CanvasView>(defaultCanvasView());
  const theme = new CanvasThemeState(bus);
  const data: Record<string, DataSource> = {};
  const specs: Record<string, SpecStore> = {};
  function setSource(id: string, src: DataSource): void {
    data[id] = src;
  }
  function layer(id: string): LayerData {
    const existing = data[id];
    if (existing instanceof LayerData) return existing;
    if (existing) throw new Error(`fakeCanvasStore.layer('${id}'): non-LayerData source registered`);
    const ld = new LayerData();
    data[id] = ld;
    return ld;
  }
  function specsFor<T extends object = object>(id: string): SpecStore<T> {
    return ((specs[id] as SpecStore<T> | undefined) ??
      ((specs[id] = new SpecStore<T>() as SpecStore), specs[id])) as SpecStore<T>;
  }
  return {
    view,
    data,
    specs,
    events: bus,
    theme,
    setSource,
    source: (id) => data[id],
    layer,
    specsFor,
    actions: createActions(view, layer, bus),
  };
}

/** The full `CanvasContext` stub used across this suite. */
export function makeContext(): CanvasContext {
  const bus = new CanvasEventBus();
  const camera = new Camera({
    binding: new HeadlessCameraBinding(),
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = {
    events: bus,
    store: fakeCanvasStore(bus),
    camera,
    gestures: new DefaultGestureArbiter(),
    layers,
    behaviours,
    theme: { current: () => null, set: () => {} },
    createStateStore: (initial) => fakeStateStore(initial),
    showMessage: () => {},
    clearMessage: () => {},
    createOverlay: () => ({}) as never,
    createSurface: (space, id) => new HeadlessSurface(id, space),
  };
  return ctx;
}
