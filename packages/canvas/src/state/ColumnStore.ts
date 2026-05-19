/**
 * `ColumnStore<TSchema>` — typed-array column store for **bulk hot data**.
 *
 * Architecture: see `architecture-proposal.md` §2.1.
 *
 * Designed to scale to millions of items at machine-rate mutation (1000s/sec
 * from external feeds). Where `Store<T>` (zustand+immer) makes per-mutation
 * structural-sharing trade-offs that cap out around 5–10k for hot data,
 * `ColumnStore` mutates typed-array slots in place at ~10 ns per write.
 *
 * **Mental model**
 *
 * One id-keyed object would be:   `{ id: 'n-42', x: 100, y: 50, color: 0x... }`
 * In a ColumnStore that's:        slot 17 across N parallel typed-array columns.
 *
 * Lookup goes id → slot (`Map<string, number>`), then any number of columns
 * are read/written by indexing slot. Slots are recycled when items are removed,
 * so the column buffers stay compact under churn.
 *
 * **Performance characteristics at 500k items**
 *
 * | Op | Cost |
 * |---|---|
 * | `add(id, row)` | ~100 ns (Map.set + N TypedArray writes) |
 * | `set(id, col, value)` | ~50 ns (Map.get + TypedArray write) |
 * | `column(name)[slot] = value` (fast-path) | ~10 ns (single TypedArray write) |
 * | `addBulk(rows)` for 500k | ~5–20 ms |
 * | Memory for 500k × 5 columns × 4 bytes | ~10 MB |
 *
 * Compare immer + Map<string, object> at 500k: ~5–50 ms per single-field
 * mutation (clones the entire 500k Map every time), ~150–250 MB memory.
 *
 * @example
 * type NodeSchema = { x: 'f32'; y: 'f32'; color: 'u32'; size: 'f32' };
 *
 * class GraphNodeStore extends ColumnStore<NodeSchema> {
 *   constructor() {
 *     super({ x: 'f32', y: 'f32', color: 'u32', size: 'f32' }, { initialCapacity: 1024 });
 *   }
 * }
 *
 * const nodes = new GraphNodeStore();
 * nodes.add('n-1', { x: 10, y: 20, color: 0x3b82f6, size: 8 });
 * nodes.set('n-1', 'x', 30);                  // typesafe per-field setter
 *
 * // Renderer fast path — hold refs once, write directly:
 * const xCol = nodes.column('x');
 * const slot = nodes.slot('n-1')!;
 * xCol[slot] = 40;                            // ~10 ns per write
 * nodes.touch();                              // bump version after fast-path writes
 */

// ─── Schema ───────────────────────────────────────────────────────────────

/**
 * Numeric type tags for typed-array columns. Each maps to a JS TypedArray ctor.
 *
 * - `i8 / u8` — small integers (1 byte). Use for booleans, bitfields, packed enums.
 * - `i16 / u16` — medium integers (2 bytes). Use for short integer ids, type-tags.
 * - `i32 / u32` — large integers (4 bytes). Use for slot refs, packed colors, hashes.
 * - `f32` — single-precision floats (4 bytes). Default for coordinates, weights.
 * - `f64` — double-precision floats (8 bytes). Use only when precision matters.
 */
export type ColumnType =
  | 'i8'
  | 'u8'
  | 'i16'
  | 'u16'
  | 'i32'
  | 'u32'
  | 'f32'
  | 'f64';

export type ColumnSchema = Record<string, ColumnType>;

// Map a `ColumnType` tag to the JS value type stored in that column.
// All TypedArray slots round-trip as `number`.
export type ColumnValue<T extends ColumnType> = T extends 'f32' | 'f64'
  ? number
  : number;

// Map a `ColumnType` tag to the underlying TypedArray.
export type ColumnArray<T extends ColumnType> = T extends 'i8'
  ? Int8Array
  : T extends 'u8'
    ? Uint8Array
    : T extends 'i16'
      ? Int16Array
      : T extends 'u16'
        ? Uint16Array
        : T extends 'i32'
          ? Int32Array
          : T extends 'u32'
            ? Uint32Array
            : T extends 'f32'
              ? Float32Array
              : T extends 'f64'
                ? Float64Array
                : never;

// Shape of a row in `add()` / `addBulk()`: each schema field maps to a number.
export type RowOf<TSchema extends ColumnSchema> = {
  [K in keyof TSchema]: ColumnValue<TSchema[K]>;
};

// ─── TypedArray ctor lookup ───────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPED_ARRAY_CTOR: Record<ColumnType, new (length: number) => any> = {
  i8: Int8Array,
  u8: Uint8Array,
  i16: Int16Array,
  u16: Uint16Array,
  i32: Int32Array,
  u32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array,
};

// ─── Options ──────────────────────────────────────────────────────────────

export interface ColumnStoreOptions {
  /** Initial slot capacity. Doubles on overflow. Default 256. */
  initialCapacity?: number;
  /** Max capacity. Throws on overflow. Default 16_777_216 (~16M). */
  maxCapacity?: number;
}

// ─── ColumnStore ──────────────────────────────────────────────────────────

export class ColumnStore<TSchema extends ColumnSchema = ColumnSchema> {
  private readonly schema: TSchema;
  private readonly columnNames: readonly (keyof TSchema)[];
  private readonly maxCapacity: number;

  /** id → slot. The only object-keyed lookup on the hot path. */
  private readonly idIndex: Map<string, number> = new Map();
  /** slot → id. Filled slots have a string; recycled holes have `undefined`. */
  private readonly idReverse: (string | undefined)[] = [];
  /** Stack of recycled slots. `add()` pops from here before extending. */
  private readonly freeSlots: number[] = [];

  /** TypedArray per column. Replaced on grow (new buffer with copied data). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private columns: Record<keyof TSchema, any>;

  /** Current capacity (length of each TypedArray). */
  private _capacity: number;
  /** High-water mark — largest slot index ever assigned + 1. Not necessarily filled. */
  private _highWater = 0;

  /** Mutation version. Increments on any add/remove/set or `touch()`. */
  private _version = 0;

  constructor(schema: TSchema, opts: ColumnStoreOptions = {}) {
    this.schema = schema;
    this.columnNames = Object.keys(schema) as (keyof TSchema)[];
    this._capacity = Math.max(1, opts.initialCapacity ?? 256);
    this.maxCapacity = opts.maxCapacity ?? 16_777_216;

    this.columns = {} as Record<keyof TSchema, unknown> as Record<
      keyof TSchema,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;
    for (const name of this.columnNames) {
      const Ctor = TYPED_ARRAY_CTOR[schema[name]];
      this.columns[name] = new Ctor(this._capacity);
    }
  }

  // ─── Read accessors ─────────────────────────────────────────────────────

  /** Number of items currently stored. */
  get size(): number {
    return this.idIndex.size;
  }

  /** Current allocated capacity. Grows automatically when filled. */
  get capacity(): number {
    return this._capacity;
  }

  /** Mutation counter — bumps on any change. Subscribers diff this. */
  get version(): number {
    return this._version;
  }

  /** True iff `id` has been added. */
  has(id: string): boolean {
    return this.idIndex.has(id);
  }

  /** Returns the slot for `id`, or `undefined`. Useful for the renderer fast path. */
  slot(id: string): number | undefined {
    return this.idIndex.get(id);
  }

  /** Returns the id at `slot`, or `undefined` if the slot is free. */
  idAt(slot: number): string | undefined {
    return this.idReverse[slot];
  }

  /**
   * Direct access to a column's TypedArray. **Holds a stable reference until
   * the column is grown** (then the underlying buffer is replaced).
   *
   * Use the version field to detect grow events:
   *   const v = store.version; const col = store.column('x');
   *   // if (store.version !== v) the col reference may be stale
   *
   * Renderer fast path: cache `column(name)` and `slot(id)` once per frame
   * and write directly. Bump `touch()` after batched fast-path writes so
   * subscribers know.
   */
  column<K extends keyof TSchema>(name: K): ColumnArray<TSchema[K]> {
    return this.columns[name] as ColumnArray<TSchema[K]>;
  }

  /** Read a single value. ~50 ns: Map.get + TypedArray read. */
  get<K extends keyof TSchema>(id: string, name: K): ColumnValue<TSchema[K]> | undefined {
    const slot = this.idIndex.get(id);
    if (slot === undefined) return undefined;
    return this.columns[name][slot] as ColumnValue<TSchema[K]>;
  }

  /** Materialise a full row by id. Allocates an object — avoid in hot loops. */
  row(id: string): RowOf<TSchema> | undefined {
    const slot = this.idIndex.get(id);
    if (slot === undefined) return undefined;
    const out = {} as RowOf<TSchema>;
    for (const name of this.columnNames) {
      out[name] = this.columns[name][slot];
    }
    return out;
  }

  // ─── Mutation ───────────────────────────────────────────────────────────

  /**
   * Add a new item. Throws if `id` already exists.
   * Reuses a recycled slot when available; otherwise extends (and grows).
   */
  add(id: string, row: RowOf<TSchema>): number {
    if (this.idIndex.has(id)) {
      throw new Error(`ColumnStore: id "${id}" already exists`);
    }
    const slot = this.allocSlot();
    this.idIndex.set(id, slot);
    this.idReverse[slot] = id;
    for (const name of this.columnNames) {
      this.columns[name][slot] = row[name];
    }
    this._version++;
    return slot;
  }

  /**
   * Bulk add. Grows once if needed (cheaper than N individual grows).
   * Throws if any id already exists.
   */
  addBulk(items: ReadonlyArray<{ id: string; row: RowOf<TSchema> }>): void {
    if (items.length === 0) return;
    // Pre-grow to fit. We may end up with extra free slots if we recycle some;
    // worst case we over-allocate by `items.length`, which is fine.
    const projected = this.idIndex.size + items.length;
    if (projected > this._capacity) {
      this.grow(projected);
    }
    for (const { id, row } of items) {
      if (this.idIndex.has(id)) {
        throw new Error(`ColumnStore.addBulk: id "${id}" already exists`);
      }
      const slot = this.allocSlot();
      this.idIndex.set(id, slot);
      this.idReverse[slot] = id;
      for (const name of this.columnNames) {
        this.columns[name][slot] = row[name];
      }
    }
    this._version++;
  }

  /**
   * Set a single field. ~50 ns: Map.get + TypedArray write.
   * No-op if id doesn't exist.
   */
  set<K extends keyof TSchema>(id: string, name: K, value: ColumnValue<TSchema[K]>): void {
    const slot = this.idIndex.get(id);
    if (slot === undefined) return;
    this.columns[name][slot] = value;
    this._version++;
  }

  /**
   * Update multiple fields of one item in one call. Avoids N version bumps.
   */
  update(id: string, partial: Partial<RowOf<TSchema>>): void {
    const slot = this.idIndex.get(id);
    if (slot === undefined) return;
    for (const name of this.columnNames) {
      if (name in partial) {
        this.columns[name][slot] = partial[name] as number;
      }
    }
    this._version++;
  }

  /**
   * Remove an item. Recycles the slot. No-op if id doesn't exist.
   */
  remove(id: string): void {
    const slot = this.idIndex.get(id);
    if (slot === undefined) return;
    this.idIndex.delete(id);
    this.idReverse[slot] = undefined;
    this.freeSlots.push(slot);
    // Don't zero the column data — recycled slots overwrite on next add().
    // Saves a per-remove iteration over all columns.
    this._version++;
  }

  /** Bulk remove. */
  removeBulk(ids: readonly string[]): void {
    for (const id of ids) {
      const slot = this.idIndex.get(id);
      if (slot === undefined) continue;
      this.idIndex.delete(id);
      this.idReverse[slot] = undefined;
      this.freeSlots.push(slot);
    }
    this._version++;
  }

  /**
   * Mark the store as mutated without actually changing anything via the API.
   * Use this after batches of fast-path writes via `column(...)[slot] = ...`
   * so version-bump-driven subscribers know to re-read.
   */
  touch(): void {
    this._version++;
  }

  /**
   * Drop all items and recycled slots. Keeps the current capacity (no shrink).
   * Cheap reset for repopulating from a feed.
   */
  clear(): void {
    this.idIndex.clear();
    this.idReverse.length = 0;
    this.freeSlots.length = 0;
    this._highWater = 0;
    this._version++;
    // Column data left in place; will be overwritten on next add().
  }

  // ─── Iteration ──────────────────────────────────────────────────────────

  /**
   * Iterate over (id, slot) pairs in insertion order of currently-live ids.
   * O(idIndex.size) — does NOT walk holes.
   */
  forEach(cb: (id: string, slot: number) => void): void {
    for (const [id, slot] of this.idIndex) cb(id, slot);
  }

  /** Iterator over live ids only. */
  ids(): IterableIterator<string> {
    return this.idIndex.keys();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private allocSlot(): number {
    const recycled = this.freeSlots.pop();
    if (recycled !== undefined) return recycled;

    if (this._highWater >= this._capacity) {
      this.grow(this._capacity * 2);
    }
    return this._highWater++;
  }

  /**
   * Grow each column's TypedArray to at least `target` capacity.
   * Doubles past target until met (so we don't grow once per add in a tight loop).
   */
  private grow(target: number): void {
    let next = this._capacity;
    while (next < target) next *= 2;
    if (next > this.maxCapacity) {
      throw new Error(
        `ColumnStore: requested capacity ${target} exceeds max ${this.maxCapacity}`,
      );
    }
    for (const name of this.columnNames) {
      const Ctor = TYPED_ARRAY_CTOR[this.schema[name]];
      const grown = new Ctor(next);
      grown.set(this.columns[name]);
      this.columns[name] = grown;
    }
    this._capacity = next;
  }
}
