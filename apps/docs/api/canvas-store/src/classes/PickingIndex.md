# Class: PickingIndex

## Constructors

### Constructor

> **new PickingIndex**(`opts`): `PickingIndex`

#### Parameters

##### opts

[`PickingIndexOptions`](../interfaces/PickingIndexOptions.md)

#### Returns

`PickingIndex`

## Accessors

### enabled

#### Get Signature

> **get** **enabled**(): `boolean`

##### Returns

`boolean`

## Methods

### clear()

> **clear**(): `void`

#### Returns

`void`

***

### flushMoved()

> **flushMoved**(): `void`

Flush deferred bbox updates from moved shapes and re-routed connectors in a
SINGLE rbush rebuild. Called lazily from the query methods the first time
accurate bounds matter, so a layout settle with no pointer interaction pays
nothing — and when it does pay, it's one O(N log N) rebuild.

#### Returns

`void`

***

### has()

> **has**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`, `exclude?`): [`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

Topmost element at a world point, or `null`.

Two bands, in priority order:

  1. **Exact hit** — the cursor is genuinely inside the silhouette (or
     within the connector's stroke tolerance). Ranked by `zIndex`, then
     shape-over-connector, then closest origin.
  2. **Floor fallback** — if NO exact hit, the closest candidate whose
     origin sits within `hitFloorPx` screen pixels of the cursor. Lets tiny
     pinpoints stay hoverable in sparse regions without widening hit areas
     in dense ones.

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### exclude?

`ReadonlySet`\<`string`\>

ids to skip — e.g. a transient drag preview sitting under
  the cursor that would otherwise mask the real target.

#### Returns

[`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

***

### insertConnector()

> **insertConnector**(`id`, `zIndex`): `void`

Index (or re-index) a connector as its segment boxes.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`

***

### insertShape()

> **insertShape**(`id`, `zIndex`): `void`

Index (or re-index) a shape from its current record.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`

***

### markConnectorMoved()

> **markConnectorMoved**(`id`): `void`

Record that a connector re-routed; its boxes are refreshed on the next flush.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### markShapeMoved()

> **markShapeMoved**(`id`): `void`

Record that a shape moved; its bbox is refreshed on the next flush.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### pickHover()

> **pickHover**(`worldX`, `worldY`, `currentHover`): [`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

Hover-specific pick: [hitTest](#hittest)'s winner, refined by two hover-only
heuristics that make tracing an edge out of a dense bundle reliable.
**Click / drag picking deliberately stays on the raw [hitTest](#hittest)** — a
press must resolve exactly what is under the cursor, with no memory of the
last hover.

- **Node-incidence bias (J).** When the raw winner is a connector but the
  cursor also sits within `hoverNodeIncidencePx` of a shape's centre, an
  edge *incident to that shape* (an endpoint at the node) is preferred over
  an unrelated edge merely passing through. Incident edges fan out and
  separate near their shared endpoint — where you aim. The test is purely
  geometric (endpoint ≈ node centre), so this stays domain-free; it never
  inspects graph adjacency.
- **Hysteresis (I).** `currentHover` of the *same kind* is kept unless the
  new winner is closer by more than `hoverHysteresisPx` — and only while the
  old target is still genuinely under the cursor — so sub-pixel jitter
  between two near-equidistant edges doesn't flicker the highlight.

Falls back to identical behaviour to [hitTest](#hittest) when both margins are
`0` or nothing nearby qualifies.

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### currentHover

[`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

what the caller currently shows as hovered — the
  hysteresis anchor. Kept as a parameter rather than state so the index
  owns no interaction bookkeeping.

#### Returns

[`HitResult`](../../../renderer-pixijs/src/interfaces/HitResult.md)

***

### reindexShapes()

> **reindexShapes**(`ids?`): `void`

Bulk re-index shape bboxes eagerly — pairs with a scale gesture that
intentionally skipped per-call hit updates. Omitting `ids` touches every
shape. Either way the tree is rebuilt once rather than N × remove+insert.

#### Parameters

##### ids?

`Iterable`\<`string`\>

#### Returns

`void`

***

### remove()

> **remove**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

***

### setEnabled()

> **setEnabled**(`enabled`): `void`

Enable / disable all picking. When disabled, [hitTest](#hittest) and
[pickHover](#pickhover) return `null` regardless of what's under the cursor — the
owning layer flips this so a hidden layer's elements aren't clickable.

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

***

### shapeWorldBounds()

> **shapeWorldBounds**(`id`): [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

World-space AABB of a shape — spec geometry, scaled by the renderer's
visual multiplier and offset to the spec's origin. `null` when the id is
unknown or its kind has no geometry the engine can compute and no fallback.

#### Parameters

##### id

`string`

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### visibleIds()

> **visibleIds**(`rect`): `Set`\<`string`\>

Ids whose indexed boxes intersect `rect`. Elements not indexed are absent.

#### Parameters

##### rect

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

#### Returns

`Set`\<`string`\>
