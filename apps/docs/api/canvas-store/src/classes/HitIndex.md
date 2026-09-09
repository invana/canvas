# Class: HitIndex

## Constructors

### Constructor

> **new HitIndex**(): `HitIndex`

#### Returns

`HitIndex`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Number of indexed ids (not boxes — a multi-box connector counts once).

##### Returns

`number`

## Methods

### bulkUpdateBoxes()

> **bulkUpdateBoxes**(`updates`): `void`

Bulk replace bboxes for many existing entries in one O(N log N) pass.

Per-id `update(...)` does `remove + insert`, and rbush's `remove(item)`
is a linear tree walk — so updating thousands of entries one at a time
is O(N²). When a behaviour like `NodeScaleLODBehaviour` rescales every
node on each camera-zoom frame, the per-id path floors fps even at
modest graph sizes.

This path replaces the cached box list for each touched id in the map,
then rebuilds the tree once via `clear + load` over the flattened entries.
Bulk-loading is `O(N log N)` total — for 3k entries, ~10× faster than the
per-id variant. Each id's kind + zIndex are carried over from its prior
boxes (an id that changed box *count* — e.g. a re-routed connector whose
segment split changed — is handled since we rebuild its list wholesale).

Use when many entries change in the same logical tick (zoom settle,
bulk position update). For single-shape edits, prefer [update](#update).

#### Parameters

##### updates

`Iterable`\<\{ `id`: `string`; `rects`: readonly [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)[]; \}\>

#### Returns

`void`

***

### clear()

> **clear**(): `void`

#### Returns

`void`

***

### has()

> **has**(`id`): `boolean`

True if an entry with this id is currently indexed. Lets callers choose
between an immediate insert (new id) and a deferred bulk bbox refresh
(existing id) — see `PrimitivesRenderer`'s moved-hit deferral.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### insert()

> **insert**(`id`, `kind`, `rect`, `zIndex`): `void`

Index `id` under one bbox (shapes) or several (connector segment boxes).
Replaces any existing boxes for the id.

#### Parameters

##### id

`string`

##### kind

`"shape"` \| `"connector"`

##### rect

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md) \| readonly [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)[]

##### zIndex

`number`

#### Returns

`void`

***

### query()

> **query**(`x`, `y`, `padWorld?`): [`HitEntry`](../interfaces/HitEntry.md)[]

Query candidates whose bbox intersects a `padWorld`-padded box around
`(x, y)`. With `padWorld = 0` (default), this matches the classic
"point in bbox" search.

The pad exists for the renderer's **screen-pixel hit floor**:
`PrimitivesRenderer.hitTest` passes `MIN_HIT_PX / camera.scale` so a
shape whose bbox is smaller than the floor (e.g. a node collapsed to
sub-pixel size at low zoom) is still in the candidate set. The
subsequent `containsWithFloor` / precise check applies the same floor
in local coords. Without this pad, rbush would prune the tiny shape
before the floor could rescue it.

Caller is responsible for the precise per-shape hit-test if the bbox
isn't the final answer (e.g. a circle inside its bbox).

#### Parameters

##### x

`number`

##### y

`number`

##### padWorld?

`number` = `0`

#### Returns

[`HitEntry`](../interfaces/HitEntry.md)[]

***

### remove()

> **remove**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### searchRect()

> **searchRect**(`rect`): [`HitEntry`](../interfaces/HitEntry.md)[]

All entries whose bbox intersects `rect` (world coords). Powers viewport
culling — query the camera's visible bounds to get the on-screen working
set. Conservative for loose bboxes (e.g. connectors): may over-return, never
under-returns, so nothing on-screen is missed.

#### Parameters

##### rect

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Returns

[`HitEntry`](../interfaces/HitEntry.md)[]

***

### update()

> **update**(`id`, `rect`, `zIndex`): `void`

Update the bbox(es) + zIndex for an existing entry. No-op if unknown.

#### Parameters

##### id

`string`

##### rect

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md) \| readonly [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)[]

##### zIndex

`number`

#### Returns

`void`
