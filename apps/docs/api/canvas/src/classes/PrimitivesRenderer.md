# Class: PrimitivesRenderer

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:202](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L202)

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:331](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L331)

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:300](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L300)

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:286](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L286)

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1838](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1838)

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1834](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1834)

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:720](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L720)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### addShape()

> **addShape**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:481](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L481)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### spec

`TSpec`

#### Returns

`void`

***

### boundsOfSpec()

> **boundsOfSpec**(`spec`): `Rect`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1885](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1885)

Local AABB for the registered shape `kind`, derived from `spec` alone
without instantiating the shape's Pixi `Graphics`. Returns `undefined`
when the kind isn't registered, or when the registered ctor doesn't
implement `static boundsOf`.

`spec.x` / `spec.y` are ignored — the returned rect is in the shape's
local (centre-relative) frame, so callers can reuse the same width /
height for every positioned instance of the kind. To get world-space
bounds for a mounted instance, use [getShapeWorldBounds](#getshapeworldbounds)
instead.

The argument's only required field is `kind`; pass either a full
positioned spec (with `x` / `y` / paint) or a bare shape-options
record (geometry only — `NodeStyle.shape` from `@invana/graph`).
Either way the shape's static `boundsOf` reads only its own
geometry params.

Consumers (minimap footprint estimation, layouts that need node
sizes, label-collision pre-pass, the LOD behaviours) call this so
they don't have to switch over a closed kind enum — built-in shapes
and shapes registered at runtime via [registerShape](#registershape) both
flow through the same hook.

#### Parameters

##### spec

###### kind

`string`

#### Returns

`Rect`

***

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:2066](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L2066)

#### Returns

`void`

***

### getConnectorPolyline()

> **getConnectorPolyline**(`id`): readonly `Point`[]

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1948](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1948)

Densified polyline of the routed connector's path, in world coordinates,
or `null` when no connector with that id exists. Returns the same point
set used internally for hit-testing — so curved / orthogonal / bezier
connectors hand back their true visible silhouette, not the straight
source-to-target line.

Domain-free read accessor for overview layers (e.g. `MiniMapLayer`) that
need to render the actual routed shape without re-running the router.
Cheap: only samples the cached `inst.path`; no router invocation.

#### Parameters

##### id

`string`

#### Returns

readonly `Point`[]

***

### getDecoration()

> **getDecoration**(`id`, `slot`): [`IDecorationBase`](../interfaces/IDecorationBase.md)\<`unknown`, `unknown`\>

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1930](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1930)

Currently-mounted decoration instance for shape (or connector) `id` at
`slot`, or `undefined` when no decoration is attached at that slot.

Domain behaviours read this when they need to introspect a decoration's
exposed state — e.g. `CollapseExpandBehaviour` calls
`getDecoration(nodeId, 'collapse-toggle')` and reads the toggle's
cached hit geometry to test a pointer click against the button's
shape-local centre + radius.

The returned object is the live `IDecorationBase` — callers should
treat it as read-only and not mutate the decoration's `style` directly
(use `setDecoration` to swap the style atomically).

#### Parameters

##### id

`string`

##### slot

`string`

#### Returns

[`IDecorationBase`](../interfaces/IDecorationBase.md)\<`unknown`, `unknown`\>

***

### getDecorationWorldBounds()

> **getDecorationWorldBounds**(`targetId`, `slot`): `Rect`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1963](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1963)

Local-space AABB of a decoration's gfx container in world coordinates
(origin offset by the host). Returns `null` when no host or slot exists.

Cheaper to call than `getGlobalBounds` because we don't traverse the
scene; just take the decoration's local bounds and offset by its
position. Used by `LabelCollisionBehaviour` and any other behaviour
that needs per-decoration screen geometry.

#### Parameters

##### targetId

`string`

##### slot

`string`

#### Returns

`Rect`

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1826](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1826)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): `Point`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:2035](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L2035)

World-space geometric **centre** of the registered shape's bounding box,
or `null` when no shape with that id exists. Differs from
`getShapePosition` for shapes whose local origin isn't the centre
(`RectShape` is anchored top-left; `CircleShape` is already centred).

This is the canonical "anchor reference point" for layer code that wants
a uniform centre regardless of shape kind — connector routing, badge
placement, fit-to-content, etc.

#### Parameters

##### id

`string`

#### Returns

`Point`

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1857](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1857)

Kind of the currently-installed shape with id `id`, or `undefined`
if no shape with that id exists.

`GraphLayer.rerenderNode` / `updateNodeShape` use this to decide
between an instance-preserving `updateShape` (when the rebuilt spec
has the same kind — the common case) and a `removeShape + addShape`
fallback (when the kind changed, e.g. `circle` → `rect`, which
`updateShape` can't handle since the underlying `IShape` class is
fixed at construction time).

#### Parameters

##### id

`string`

#### Returns

`string`

***

### getShapePosition()

> **getShapePosition**(`id`): `Point`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:2020](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L2020)

World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
use this when a behaviour needs the shape's translation point (drag
offset baseline, anchor for an external overlay, etc.).

#### Parameters

##### id

`string`

#### Returns

`Point`

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): `Rect`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:2009](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L2009)

World-space AABB of the registered shape, or `null` when no shape with
that id exists. Domain-free read accessor for layer code that needs to
query shape geometry without poking at private state — e.g. a graph
layer building an obstacle list for an edge's router, a behaviour that
wants to fit content to a selection, or a debug overlay.

#### Parameters

##### id

`string`

#### Returns

`Rect`

***

### hasBadge()

> **hasBadge**(`hostId`, `slot`): `boolean`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1204](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1204)

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`boolean`

***

### hasConnector()

> **hasConnector**(`id`): `boolean`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1912](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1912)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1842](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1842)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`, `exclude?`): [`HitResult`](../interfaces/HitResult.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1546](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1546)

Resolve the hit at a world point under render-order rules. Two
priority bands:

  1. **Exact geometric hits** — any candidate whose
     `IHitArea.contains` (shapes) or stroke-tolerance polyline
     distance (connectors) covers the cursor. Ranked to match what
     is drawn on top:
       a. higher `zIndex` wins (mirrors visual stacking);
       b. on equal `zIndex`, a shape (node) beats a connector (edge)
          — shapes render above connectors;
       c. on equal `zIndex` *and* same kind, the closest one to its
          origin / polyline wins.
     So a node sitting over an edge takes the hit even when the edge's
     polyline passes nearer the cursor than the node's centre — and an
     edge with an explicitly higher `zIndex` still wins.
  2. **Floor fallback** — if NO exact hit, return the closest
     candidate whose origin sits within `hitFloorPx` screen pixels
     of the cursor. Lets tiny pinpoints stay hoverable in sparse
     regions without widening hit areas in dense ones.

Returns `null` when nothing is hit.

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### exclude?

`ReadonlySet`\<`string`\>

#### Returns

[`HitResult`](../interfaces/HitResult.md)

***

### moveShape()

> **moveShape**(`id`, `x`, `y`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:581](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L581)

Fast-path position-only move — writes the host `gfx` transform directly,
skipping BOTH the geometry redraw and the decoration re-anchor that
[updateShape](#updateshape) performs. This is what `GraphLayer` routes every
layout / drag position write through.

**Why it's correct to skip both.** A shape's silhouette is traced in
shape-local space and `(spec.x, spec.y)` is applied as the host `gfx`
translation (`ShapeBase.draw`). Decorations (labels, halos, rings, …) are
children of that same `gfx` and anchor to the shape's *local*,
position-independent bounds (`refreshShapeDecorations` reads
`inst.shape.bounds()`, not world position). So a pure translation needs
only `gfx.position.set(x, y)` — it carries the body and every decoration
with it for free, reproducing identical geometry. `updateShape` instead
re-tessellates and re-anchors on every move; profiling a ~500-node force
settle showed the decoration re-anchor alone was ~2.2 ms/tick (~90 % of
the per-move cost) while the translation itself is ~0.05 ms.

**Hit-bounds are deferred** — like [scaleShape](#scaleshape), the per-call rbush
update is skipped (O(N) remove+insert → O(N²) over a full sweep). Moved
ids accumulate in `movedShapeHits` and are bulk-reindexed lazily on the
next [hitTest](#hittest) (or eagerly via [reindexScaledShapeHits](#reindexscaledshapehits)).

Badges are separate shape instances (NOT children of the host `gfx`), so
the transform can't carry them — they're re-anchored here when present.

#### Parameters

##### id

`string`

##### x

`number`

##### y

`number`

#### Returns

`void`

***

### raiseConnector()

> **raiseConnector**(`id`, `zIndex`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:625](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L625)

Restack a connector within the connector layer by writing its `gfx.zIndex`
— the connector-side sibling of [raiseShape](#raiseshape). A higher `zIndex`
paints later (above peer edges); `zIndex = 0` restores insertion order.
Use to lift a hovered / selected edge above unrelated edges crossing it.

Confined to the connector layer, which renders below the shape layer, so a
raised edge still sits under every node.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`

***

### raiseShape()

> **raiseShape**(`id`, `zIndex`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:610](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L610)

Restack a shape within the shape layer by writing its `gfx.zIndex`. The
shape layer renders with `sortableChildren`, so a higher `zIndex` paints
later (on top of peers with a lower one); `zIndex = 0` (the default)
restores natural insertion order. Use to lift a hovered / selected node
above the rest so unrelated nodes don't draw over it.

Visual-only: this does NOT touch geometry, transform, or the hit index
(closest-wins hit resolution already consults the spec `zIndex` recorded
at insert). Restacking is confined to the shape layer, so a raised node
still renders above every connector.

#### Parameters

##### id

`string`

##### zIndex

`number`

#### Returns

`void`

***

### rasteriseLabel()

> **rasteriseLabel**(`id`, `resolution`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1292](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1292)

#### Parameters

##### id

`string`

##### resolution

`number`

#### Returns

`void`

***

### reanchorAllConnectors()

> **reanchorAllConnectors**(): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:691](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L691)

Recompute the path of every connector. Use after a batch of
`scaleShape` calls (e.g. one `NodeSizeLODBehaviour` zoom tick) so
connectors re-anchor against the freshly-scaled silhouettes — without
this, edges remain anchored to the pre-scale bounds and visibly fall
short of the smaller shape.

Cheap when paired with the lazy `obstacles` getter in `routePath`:
routers that don't read obstacles (e.g. `straight`) skip the
`O(shapes)` collection per connector. Routers that *do* read
obstacles (`manhattan`, `metro`, `er`) still pay it — pair them with
a debounce when re-anchoring on a continuous gesture.

#### Returns

`void`

***

### registerAnchor()

> **registerAnchor**(`kind`, `fn`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:443](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L443)

#### Parameters

##### kind

`string`

##### fn

[`IAnchor`](../type-aliases/IAnchor.md)

#### Returns

`void`

***

### registerDecoration()

> **registerDecoration**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:447](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L447)

#### Type Parameters

##### TStyle

`TStyle`

#### Parameters

##### kind

`string`

##### ctor

(`style`) => [`IShapeDecoration`](../type-aliases/IShapeDecoration.md)\<`TStyle`\> \| [`IConnectorDecoration`](../type-aliases/IConnectorDecoration.md)\<`TStyle`\>

##### opts

[`RegisterDecorationOptions`](../interfaces/RegisterDecorationOptions.md)

#### Returns

`void`

***

### registerEffect()

> **registerEffect**\<`TStyle`\>(`kind`, `ctor`, `opts`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:468](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L468)

Register an effect under a string kind. Effects are domain-free primitives
that modulate the host shape's transform or style channels each frame
(shake, breathing, shimmer, …). The effect's constructor receives the
caller's `style` payload; `opts.target` constrains which host kinds the
effect may attach to (shape-only for v0).

Throws on `setEffect` if the registered `target` doesn't include the
host kind being targeted.

#### Type Parameters

##### TStyle

`TStyle`

#### Parameters

##### kind

`string`

##### ctor

(`style`) => [`IShapeEffect`](../type-aliases/IShapeEffect.md)\<`TStyle`\> \| `IConnectorEffect`\<`TStyle`\>

##### opts

[`RegisterEffectOptions`](../interfaces/RegisterEffectOptions.md)

#### Returns

`void`

***

### registerPathStyle()

> **registerPathStyle**(`kind`, `fn`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:439](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L439)

#### Parameters

##### kind

`string`

##### fn

[`IPathStyle`](../type-aliases/IPathStyle.md)

#### Returns

`void`

***

### registerRouter()

> **registerRouter**(`kind`, `fn`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:435](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L435)

#### Parameters

##### kind

`string`

##### fn

[`IRouter`](../type-aliases/IRouter.md)

#### Returns

`void`

***

### registerShape()

> **registerShape**\<`TSpec`\>(`kind`, `ctor`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:431](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L431)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### kind

`string`

##### ctor

[`ShapeCtor`](../interfaces/ShapeCtor.md)\<`TSpec`\>

#### Returns

`void`

***

### reindexScaledShapeHits()

> **reindexScaledShapeHits**(`ids?`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:643](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L643)

Bulk re-index hit-test bboxes for shapes — pairs with
[scaleShape](#scaleshape) (which intentionally skips per-call hit updates).

Passing `ids` confines the reindex to those shapes. Omitting it
touches every shape instance. Either way the rbush tree is rebuilt
once via `clear + load` rather than N × `remove + insert`.

Call on gesture settle (e.g. inside `NodeSizeLODBehaviour`'s
trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
hit-test accuracy snaps back the moment the user stops zooming.

#### Parameters

##### ids?

`Iterable`\<`string`\>

#### Returns

`void`

***

### removeBadge()

> **removeBadge**(`hostId`, `slot`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1195](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1195)

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`void`

***

### removeConnector()

> **removeConnector**(`id`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:881](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L881)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:697](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L697)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:2055](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L2055)

Re-route every registered connector. Useful after a non-endpoint shape
moves (e.g. an obstacle) and you want connectors that auto-collect
obstacles to update their path.

Each call re-runs `routePath` per connector and refreshes the hit index
and any connector decorations. Linear in `connectorInstances`; safe to
call from drag handlers in typical layouts. Heavy graphs with thousands
of edges should prefer a targeted re-route (future).

#### Returns

`void`

***

### scaleConnectorStroke()

> **scaleConnectorStroke**(`id`, `scale`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:813](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L813)

Fast-path render-time stroke multiplier for a connector — writes
`inst.strokeWidthScale` and redraws on the cached path.

`EdgeSizeLODBehaviour` uses this each `camera:zoom` frame to keep
spec stroke widths pixel-constant across zoom. Critically, it does
**not** touch `spec.stroke.width`: the canonical spec stays as the
caller authored it, so a downstream `setConnectorStroke` (or a state-
config-driven `updateConnector` rebuild via `GraphLayer.rerenderEdge`)
supplies the new "base" width and the LOD multiplier applies on top
— no clobber, no inversion of caller intent.

Path / obstacles / decorations are unchanged by a stroke-only
rescale, so this is the same shape as `setConnectorStroke`: skip
`recomputeConnectorPath`, just redraw on the cached path.

#### Parameters

##### id

`string`

##### scale

`number`

#### Returns

`void`

***

### scaleShape()

> **scaleShape**(`id`, `scale`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:548](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L548)

Fast-path uniform rescale for a shape — writes the gfx transform
directly without touching the spec or rebuilding geometry.

`updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
+ retrace) on every call, which dominates the cost when something
like `NodeSizeLODBehaviour` rewrites thousands of node sizes per
camera-zoom frame. `scaleShape` skips all of that: the geometry on
the GPU is unchanged, only its transform changes.

**Hit-test bounds are NOT updated here.** rbush's `remove(entry)` is
an O(N) tree walk, so per-id `hit.update` × N shapes is O(N²) per
zoom frame — pathological at a few thousand shapes. Call
[reindexScaledShapeHits](#reindexscaledshapehits) once *after* a batch (typically on
gesture settle) to bulk-reindex in O(N log N). The hit-bounds are
stale until you do — acceptable when the caller knows pointer
interaction is unlikely mid-gesture.

**Other limitations** — decorations and badges attached to the host
are **not** re-anchored against the new visible bounds; if you have
either on a size-LOD'd node, prefer `updateShape` or accept the
stale anchor. Stroke width inside the geometry scales with the
transform (Pixi's stroke is in local units), which is usually the
intent for pixel-constant sizing but means you can't independently
target body size and stroke width via `scaleShape` alone.

#### Parameters

##### id

`string`

##### scale

`number`

#### Returns

`void`

***

### scaleShapeSpec()

> **scaleShapeSpec**(`spec`, `factor`): `Record`\<`string`, `unknown`\>

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1907](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1907)

Uniformly-scaled partial of the registered shape `kind`, with
geometry params multiplied by `factor`. Aspect ratio, angular
range, and vertex topology are preserved. Returns `undefined`
when the kind isn't registered or its ctor doesn't implement
`static scaleSpec`.

The contract pairs with [boundsOfSpec](#boundsofspec): scaling by `k`
scales the AABB exactly by `k`. Callers compose the returned
partial with paint channels (`fill` / `stroke`) and position
(`x` / `y`) themselves.

Used by `NodeSizeLODBehaviour` to rewrite shape size as the
camera zooms, without switching over a closed kind enum. Shapes
that don't implement `scaleSpec` are simply skipped by the
LOD writer.

#### Parameters

##### spec

###### kind

`string`

##### factor

`number`

#### Returns

`Record`\<`string`, `unknown`\>

***

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1139](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1139)

Attach a badge to a host shape. The badge is registered as a real shape
under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
any registered shape kind as the plate, any `ShapeFillLayer` as content
(solid / image / glyph / svg / svg-url), and any registered decoration
via the `decorations` field.

On `updateShape(hostId, …)` every attached badge re-anchors automatically.
On `removeShape(hostId)` every attached badge is removed first.

Calling `setBadge` with the same `(hostId, slot)` replaces the previous
badge (the old badge shape and any of its decorations are destroyed).

#### Parameters

##### hostId

`string`

##### slot

`string`

##### options

[`BadgeOptions`](../interfaces/BadgeOptions.md)

#### Returns

`void`

***

### setConnectorStroke()

> **setConnectorStroke**(`id`, `stroke`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:765](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L765)

Fast-path render update for connectors — patches the `stroke` spec
and redraws on the **existing cached path** without re-running the
router / pathStyle / obstacle calculation.

`updateConnector` always calls `recomputeConnectorPath`, which builds
an obstacle list by iterating every shape in the renderer (line 1271).
For a `straight` router with thousands of connectors that's
`O(connectors × shapes)` per update — fine for one-off restyles, but
lethal during continuous camera-driven reflows (e.g. `ScreenSizeBehaviour`
keeping stroke widths pixel-constant across zoom).

This skips all of that: the path is unchanged (scale doesn't move
any endpoint in world coords), so we just redraw the body on the
cached `inst.path` with the new stroke. Use when you know **only**
the stroke is changing.

#### Parameters

##### id

`string`

##### stroke

###### color

`number`

###### width

`number`

#### Returns

`void`

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:905](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L905)

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### decoration

[`DecorationSpec`](../interfaces/DecorationSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setDecorationVisible()

> **setDecorationVisible**(`targetId`, `slot`, `visible`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1992](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1992)

Show / hide a decoration's gfx without destroying it. Used by
collision-style behaviours that want to suppress overlapping labels for a
frame without paying the cost of re-mounting on the next reveal.

No-op when `targetId` / `slot` doesn't resolve.

#### Parameters

##### targetId

`string`

##### slot

`string`

##### visible

`boolean`

#### Returns

`void`

***

### setEffect()

> **setEffect**\<`TStyle`\>(`targetId`, `slot`, `effect`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1019](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1019)

Attach (or detach with `null`) an effect to a shape at the given slot.
Effects don't draw — they modulate the host shape's transform and/or
style. Multiple effects per host stack: transform deltas compose
additively (translations + rotation) and multiplicatively (scale);
style channels are last-writer-wins per channel by insertion order.

Connector effects are supported and modulate the host connector's
style channels (tint + alpha). Transform deltas on a path-resolved
primitive have no coherent meaning, so transform effects on connector
hosts are ignored at aggregation time.

#### Type Parameters

##### TStyle

`TStyle` = `unknown`

#### Parameters

##### targetId

`string`

##### slot

`string`

##### effect

[`EffectSpec`](../interfaces/EffectSpec.md)\<`TStyle`\>

#### Returns

`void`

***

### setLabelsResolution()

> **setLabelsResolution**(`resolution`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1309](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1309)

Push a rasterisation resolution to every label decoration (shape + edge)
currently attached, and remember it so labels mounted later inherit the
same fidelity. Driven by zoom-aware behaviours
(see `@invana/graph` / `LabelResolutionLODBehaviour`): when the camera
zooms past a threshold, push `dpr * zoom` to re-rasterise glyphs sharp.

Idempotent: Pixi internally short-circuits `Text.resolution` writes when
the value matches, so calling this with the unchanged value every frame
is safe and cheap.

#### Parameters

##### resolution

`number`

#### Returns

`void`

***

### setLODLevel()

> **setLODLevel**(`id`, `level`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1282](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1282)

#### Parameters

##### id

`string`

##### level

`number`

#### Returns

`void`

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1335](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1335)

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:741](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L741)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`

***

### updateShape()

> **updateShape**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:512](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/PrimitivesRenderer.ts#L512)

#### Type Parameters

##### TSpec

`TSpec` *extends* [`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

#### Parameters

##### id

`string`

##### partial

`Partial`\<`TSpec`\>

#### Returns

`void`
