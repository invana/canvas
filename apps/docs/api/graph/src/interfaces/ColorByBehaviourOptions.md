# Interface: ColorByBehaviourOptions

Constructor options for [ColorByBehaviour](../classes/ColorByBehaviour.md).

## Extends

- [`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)

## Properties

### bins?

> `optional` **bins?**: `number`

Bucket count for `scale: 'quantile'`. Default `5`. Ignored by other scales.

***

### colorEdges?

> `optional` **colorEdges?**: `boolean`

Colour edges — writes `strokeColor` + `arrowTargetColor`. Default `true`.

***

### colorNodes?

> `optional` **colorNodes?**: `boolean`

Colour nodes — writes `bgFill`. Default `true`.

***

### colorStops?

> `optional` **colorStops?**: readonly `number`[]

Colour ramp (`0xRRGGBB`), interpolated in sRGB. Two or more stops; a single
stop is a constant colour. Default [DEFAULT\_RANGE\_STOPS](../variables/DEFAULT_RANGE_STOPS.md).

***

### edgeDomain?

> `optional` **edgeDomain?**: readonly \[`number`, `number`\]

Edge equivalent of [nodeDomain](#nodedomain).

***

### edgeThresholds?

> `optional` **edgeThresholds?**: readonly `number`[]

Edge equivalent of [nodeThresholds](#nodethresholds), in the edge field's units.

***

### edgeValueBy?

> `optional` **edgeValueBy?**: [`ColorValueAccessor`](../type-aliases/ColorValueAccessor.md)\<[`GraphEdge`](GraphEdge.md)\<`unknown`\>\>

Edge equivalent of [nodeValueBy](#nodevalueby).

***

### edgeValueKey?

> `optional` **edgeValueKey?**: `string`

Edge equivalent of [nodeValueKey](#nodevaluekey). Default `'type'`.

***

### enabled?

> `optional` **enabled?**: `boolean`

Default `false` — the developer explicitly enables.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`enabled`](../../../canvas/src/interfaces/BehaviourOptions.md#enabled)

***

### fallbackColor?

> `optional` **fallbackColor?**: `number`

Colour for items whose value is missing, empty, or (in `'range'` mode)
non-numeric. Default `0x9ca3af` (grey).

***

### id

> **id**: `string`

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`id`](../../../canvas/src/interfaces/BehaviourOptions.md#id)

***

### maxCategories?

> `optional` **maxCategories?**: `number`

**Cardinality cap.** Values beyond the first `maxCategories` distinct ones
(in first-appearance order) share [fallbackColor](#fallbackcolor) and collapse into a
single `other` legend row. Default `24`.

A guard against colouring by a high-cardinality field — `nodeValueKey: 'id'`
is legal and yields one distinct value *per node*, which cycles the palette
into meaninglessness and grows a legend row per item. Capping makes the
truncation **visible** (`other (317)`) instead of silently lying.

Values pinned by [valueColors](#valuecolors) are always honoured and **do not count
against the cap** — an explicit choice is never truncated.

Set to `Infinity` to disable.

***

### mode?

> `optional` **mode?**: [`ColorByMode`](../type-aliases/ColorByMode.md)

Which colouring job. Default `'categorical'` — one distinct colour per distinct
value. `'range'` maps a numeric value through [scale](#scale) onto
[colorStops](#colorstops). Determines which options below are read.

***

### nodeDomain?

> `optional` **nodeDomain?**: readonly \[`number`, `number`\]

Explicit `[min, max]` for node values. **Omit to auto-scan** the field across
the layer's nodes, rescanned when the node/edge set changes.

⚠️ With auto-domain, loading a node that widens the range **recolours every
other node** — set this explicitly for stable colours across a streaming load.

***

### nodeThresholds?

> `optional` **nodeThresholds?**: readonly `number`[]

Explicit bucket edges for `scale: 'threshold'`, in the node field's units —
`[10, 50, 200]` gives four buckets. Sorted ascending on resolve; duplicates
dropped. Ignored by other scales.

***

### nodeValueBy?

> `optional` **nodeValueBy?**: [`ColorValueAccessor`](../type-aliases/ColorValueAccessor.md)\<[`GraphNode`](GraphNode.md)\<`unknown`\>\>

**Code escape hatch.** Per-node value accessor; supersedes
[nodeValueKey](#nodevaluekey) when set. Use for computed keys the store doesn't hold
(`` `community-${n.data.group}` ``) or derived magnitudes. Return a `string`
in `'categorical'` mode, a `number` in `'range'` mode.
**Not editor-exposed** (it's a function) and not persisted.

***

### nodeValueKey?

> `optional` **nodeValueKey?**: `string`

**Root-relative dot path** to the value driving a node's colour — e.g.
`'type'`, `'data.riskScore'`, `'data.meta.tier'`. Default `'type'`.
A missing path, or a non-numeric value in `'range'` mode, yields
[fallbackColor](#fallbackcolor). Superseded by [nodeValueBy](#nodevalueby).

A path from the node **root**, not a key inside `data` — unlike
`NodeCentralityBehaviourOptions.weightKey`, because the default (`type`)
lives at the root.

***

### palette?

> `optional` **palette?**: readonly `number`[]

Colours (`0xRRGGBB`) handed out in order of first appearance and remembered,
cycled when there are more distinct values than colours.
Default [DEFAULT\_CATEGORY\_PALETTE](../variables/DEFAULT_CATEGORY_PALETTE.md).

***

### scale?

> `optional` **scale?**: [`ColorByScale`](../type-aliases/ColorByScale.md)

How a numeric value becomes a colour. Default `'linear'`.

- `'linear'` / `'sqrt'` / `'log'` — **continuous**: normalise into `[0,1]`
  against the domain, ease, then interpolate along [colorStops](#colorstops).
- `'quantile'` — **binned** into [bins](#bins) equal-*count* buckets, edges
  derived from the observed values.
- `'threshold'` — **binned** at explicit edges ([nodeThresholds](#nodethresholds) /
  [edgeThresholds](#edgethresholds)).

***

### shortcuts?

> `optional` **shortcuts?**: readonly `string`[]

Gesture identifiers this behaviour claims. Used by `BehaviourRegistry`
for conflict warnings. Format is convention-free (`'shift+drag'`,
`'wheel+ctrl'`, `'rclick'`); registries match strings as-is.

#### Inherited from

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`shortcuts`](../../../canvas/src/interfaces/BehaviourOptions.md#shortcuts)

***

### targetLayerId

> **targetLayerId**: `string`

Required — the `GraphLayer` id this behaviour colours.

#### Overrides

[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md).[`targetLayerId`](../../../canvas/src/interfaces/BehaviourOptions.md#targetlayerid)

***

### valueColors?

> `optional` **valueColors?**: `Readonly`\<`Record`\<`string`, `number`\>\>

**Pin known values to specific colours.** Anything not listed falls through
to [palette](#palette) in first-appearance order. Without this, `'failed'` gets
whatever colour happens to be next — and that changes with data arrival
order. Shared across nodes and edges (values compare as strings).
