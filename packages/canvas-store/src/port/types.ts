import type { Patch } from 'immer';

/**
 * The library-agnostic state contract. Consumers program against this — never
 * against zustand (or, later, Yjs) directly — so the backend stays swappable.
 *
 * Two write forms, both declarative at the seam:
 * - an **immer recipe** `(draft) => void` that reads like a direct mutation, or
 * - a **deep-partial patch** object that is deep-merged in.
 *
 * Either way `update` produces immer **patches + inverse patches**, which is what
 * lets telemetry, history/undo, and a future CRDT adapter all hang off the one seam.
 */
export interface ReactiveStore<T> {
  /** Current state snapshot (structurally shared; treat as immutable). */
  getState(): T;
  /** Apply a recipe or a deep-partial patch, with an optional named action. */
  update(update: Update<T>, action?: string): void;
  /** Fires on every change with the new + previous state. */
  subscribe(listener: (state: T, prev: T) => void): () => void;
  /** Richer change stream (action + immer patches) — for telemetry / history. */
  subscribeChanges(listener: (change: StoreChange<T>) => void): () => void;
  /** Run `fn`'s writes as one coalesced change (one notification, one history step). */
  batch(run: () => void, action?: string): void;
}

/** An immer recipe — mutate the draft; the produced state is structurally shared. */
export type Recipe<T> = (draft: T) => void;

/** A write: either a recipe (mutate the draft) or a declarative deep-partial patch. */
export type Update<T> = Recipe<T> | DeepPartial<T>;

/** What a change carries — the load-bearing payload for telemetry/history/CRDT. */
export interface StoreChange<T> {
  state: T;
  prev: T;
  action?: string;
  /** immer forward patches (apply to `prev` → `state`). */
  patches: Patch[];
  /** immer inverse patches (apply to `state` → `prev` — i.e. undo). */
  inverse: Patch[];
  /** Wall-clock ms the update/batch took (produce + commit) — telemetry / tracing. */
  durationMs?: number;
}

type Primitive = string | number | boolean | bigint | symbol | null | undefined;

/**
 * Deep-partial that **stops at** sets / maps / arrays / functions — those are
 * replaced wholesale, matching the runtime deep-merge (and `CanvasConfig`'s
 * shallow-replace semantics). So `{ interaction: { selection: newSet } }` swaps
 * the set rather than trying to partial-merge its internals.
 */
export type DeepPartial<T> = T extends Primitive
  ? T
  : T extends ReadonlySet<unknown>
    ? T
    : T extends ReadonlyMap<unknown, unknown>
      ? T
      : T extends ReadonlyArray<unknown>
        ? T
        : T extends (...args: never[]) => unknown
          ? T
          : { [K in keyof T]?: DeepPartial<T[K]> };

/**
 * A minimal state cell an adapter supplies — the only thing that differs between
 * backends. `createStoreFromCell` builds the full {@link ReactiveStore} on top, so
 * the change/patch/batch logic is shared and identical across adapters.
 */
export interface StateCell<T> {
  get(): T;
  /** Replace state; must notify state listeners with (next, prev). */
  set(next: T): void;
  subscribe(listener: (state: T, prev: T) => void): () => void;
}
