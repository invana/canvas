# Interface: NodeRecord

`LayerData` — the **non-reactive** graph data for one source: four record
collections (nodes · edges · groups · annotations) with full CRUD, **bulk
position updates** (layout output), and **one coalesced `flush` per frame**
carrying a per-kind delta. Subscribers (the renderer) rebuild only the delta.

**Two lanes (the two physics).** Bulk + machine-rate → it lives *outside* the
reactive `view` store:
- **COLD** — `Map<id, record>` for human-rate fields (payload/label/style/…).
- **HOT** — a typed-array [ColumnStore](../../../canvas/src/classes/ColumnStore.md) for node **positions** (`x`/`y`)
  and a `flags` byte (has-position / pinned / disabled / hidden). A position
  write is ~10 ns (one `Float32Array` slot), no per-node object, no GC. The
  layout/renderer fast path holds the column ref and writes slots directly
  (see positions + touchPositions).

`node(id)` stitches the two lanes back into one record on read (cold reads are
human-rate; the hot path reads the column directly). The `flush` delta shape is
**unchanged** by the lane split — `moved` (position-only) stays separate from
`changed` (structure), so a move is a transform-only re-render.

**When** the coalesced flush fires is the [FlushMode](../../../canvas/src/type-aliases/FlushMode.md) (default `'microtask'`);
the engine flips its stores to `'manual'` and drains them from one rAF loop. See
`docs/canvas-store-data-event-flow.md` §2.2.

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### id

> **id**: `string`

***

### x?

> `optional` **x?**: `number`

***

### y?

> `optional` **y?**: `number`
