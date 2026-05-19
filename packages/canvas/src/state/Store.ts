/**
 * `Store<T>` — typed alias of `zustand/vanilla` `StoreApi<T>` plus a thin
 * factory that pre-composes the middleware stack we use everywhere.
 *
 * Architecture: see `architecture-proposal.md` §2.1 (state vs. data — bifurcated).
 *
 * **Use this only for small, observable interaction state** — hover, selection,
 * drag intent, decoration overrides, view modes. The cardinality should stay
 * comfortably below a few thousand items per slice; typical state size is
 * tens of fields, not megabytes.
 *
 * For bulk hot data (positions, attributes for tens of thousands or millions
 * of items), use `ColumnStore` instead. Immer + Map at 500k entries clones the
 * whole Map on every mutation (5–50 ms each); typed-array columns are 10 ns.
 *
 * Middleware stack (outer → inner):
 *
 *   devtools  →  subscribeWithSelector  →  immer  →  state creator
 *
 *   - **immer** lets recipes mutate a draft; the produced state is structurally
 *     shared with the previous state (untouched branches kept by reference).
 *   - **subscribeWithSelector** adds the `subscribe(selector, listener, opts?)`
 *     overload so consumers can subscribe to a slice instead of the whole state.
 *   - **devtools** is enabled only in non-production builds (Redux DevTools
 *     extension). Tree-shaken / no-op in production.
 *
 * @example
 * type GraphLayerState = {
 *   hoveredId: string | null;
 *   selectedIds: ReadonlySet<string>;
 *   haloIds: ReadonlySet<string>;
 * };
 *
 * const store = createLayerStore<GraphLayerState>(
 *   { hoveredId: null, selectedIds: new Set(), haloIds: new Set() },
 *   { name: 'GraphLayer:graph-1' }
 * );
 *
 * // immer-style mutation
 * store.setState((draft) => { draft.hoveredId = 'n-42'; });
 *
 * // selector subscription — fires only when haloIds changes
 * const off = store.subscribe(
 *   (s) => s.haloIds,
 *   (curr, prev) => { ... },
 *   { equalityFn: Object.is }
 * );
 */

import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { enableMapSet } from 'immer';

// Opt immer into drafting Map and Set values. UI state slices commonly carry
// `selectedIds: Set<string>`, `haloStyles: Map<string, HaloStyle>`, etc.
// Without this, immer throws on first Map/Set mutation. Idempotent.
enableMapSet();

/**
 * The store API surface exposed to consumers.
 *
 * After middleware composition, the runtime store has:
 *   - `setState(recipe)` — immer recipe that mutates a draft (immer middleware).
 *   - `setState(partial)` and `setState(updater)` — vanilla forms (still work).
 *   - `subscribe(listener)` — vanilla zustand API.
 *   - `subscribe(selector, listener, opts?)` — added by `subscribeWithSelector`.
 *
 * The `setState` overload union mirrors what the immer middleware produces at
 * runtime; `Store<T>` is what `createLayerStore<T>()` returns.
 */
export type Store<T> = Omit<StoreApi<T>, 'setState' | 'subscribe'> & {
  setState: {
    /** Immer recipe form — mutate the draft, return nothing. Preferred. */
    (recipe: (draft: T) => void): void;
    /** Direct partial / replacement / updater forms — also accepted. */
    (
      partial:
        | T
        | Partial<T>
        | ((state: T) => T | Partial<T> | void),
      replace?: false,
    ): void;
    /** Replace-state form (second arg = true). */
    (state: T, replace: true): void;
  };
  subscribe: StoreApi<T>['subscribe'] & {
    <U>(
      selector: (state: T) => U,
      listener: (selectedState: U, previousSelectedState: U) => void,
      options?: {
        equalityFn?: (a: U, b: U) => boolean;
        fireImmediately?: boolean;
      },
    ): () => void;
  };
};

export interface CreateLayerStoreOptions {
  /**
   * Devtools display name. Used as the "store" name in Redux DevTools.
   * Convention: `<ClassName>:<id>` (e.g. `'GraphLayer:graph-1'`).
   */
  name?: string;

  /**
   * Force devtools on/off. Default: enabled when `process.env.NODE_ENV !== 'production'`.
   * High-frequency mutation sites can pass `enableDevtools: false` per-store
   * to avoid devtools serialisation cost in dev too.
   */
  enableDevtools?: boolean;
}

/**
 * Detect whether we're in a production build. Tree-shakers (esbuild, tsup,
 * Vite, webpack) replace `process.env.NODE_ENV` with the literal string at
 * build time, so this evaluates to a constant and the dev-only branches
 * are eliminated entirely.
 *
 * Accessed via `globalThis` to avoid requiring `@types/node` in this
 * browser-targeted package; in unbuilt Node contexts (vitest) the global
 * `process` is present.
 */
function isProductionBuild(): boolean {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  return proc?.env?.NODE_ENV === 'production';
}

/**
 * Create a `Store<T>` with our standard middleware stack.
 *
 * Pass either an initial state object, or a creator function that takes the
 * zustand `set` / `get` (already wrapped with immer) and returns initial state.
 * The creator form is useful when initial state needs to reference itself or
 * close over imperative setup; the object form is the common case.
 */
export function createLayerStore<T extends object>(
  initial: T,
  opts?: CreateLayerStoreOptions,
): Store<T>;
export function createLayerStore<T extends object>(
  // The set / get types after immer middleware are intentionally loose here —
  // consumers rarely use the creator form, and a tighter signature would
  // require importing immer's mutator types.
  creator: (set: (recipe: (draft: T) => void) => void, get: () => T) => T,
  opts?: CreateLayerStoreOptions,
): Store<T>;
export function createLayerStore<T extends object>(
  initialOrCreator:
    | T
    | ((set: (recipe: (draft: T) => void) => void, get: () => T) => T),
  opts: CreateLayerStoreOptions = {},
): Store<T> {
  const initFn =
    typeof initialOrCreator === 'function'
      ? (initialOrCreator as (set: never, get: never) => T)
      : (() => initialOrCreator as T);

  // Cast through `any` here — composing zustand middleware preserves runtime
  // behaviour but the chained generic types become unwieldy. The publicly
  // returned type (`Store<T>`) is what consumers observe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let creator: any = (set: never, get: never) => initFn(set, get);

  // Inner-to-outer middleware composition.
  creator = immer(creator);
  creator = subscribeWithSelector(creator);

  const wantDevtools = opts.enableDevtools ?? !isProductionBuild();
  if (wantDevtools) {
    creator = devtools(creator, { name: opts.name ?? 'CanvasStore' });
  }

  return createZustandStore(creator) as unknown as Store<T>;
}

/**
 * Re-export `StoreApi` for consumers who want the bare zustand type
 * (e.g. in third-party utility wrappers).
 */
export type { StoreApi };
