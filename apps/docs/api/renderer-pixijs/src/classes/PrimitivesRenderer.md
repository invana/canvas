# Class: PrimitivesRenderer

The renderer's side of the picking contract — the three facts specs can't
carry. Returning `null` means "gone"; the index treats it as a miss rather
than an error, because an element can be removed between an index write and
a query.

## Implements

- [`HitGeometrySource`](../../../canvas/src/interfaces/HitGeometrySource.md)
- [`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md)

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](../../../canvas/src/classes/Camera.md)

***

### events

> `readonly` **events**: [`EventEmitter`](../../../canvas/src/classes/EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Element-scoped pointer events — `shape:click`, `connector:pointerover`,
`shape:partcontextmenu`, … Canvas-wide input goes on the kernel bus; this
channel is per-renderer because the payloads name elements it owns.

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`events`](../../../canvas/src/interfaces/IElementRenderer.md#events)

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

##### Returns

`number`

***

### shapeKinds

#### Get Signature

> **get** **shapeKinds**(): `ReadonlySet`\<`string`\>

The shape kinds this renderer can draw, including any registered at runtime.

Exists so a caller projecting specs from the store can tell a shape spec from
a connector spec by asking which registry owns its `kind` — no discriminator
has to be baked into the spec vocabulary. Read-only view; register through
[registerShape](#registershape).

##### Returns

`ReadonlySet`\<`string`\>

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`shapeKinds`](../../../canvas/src/interfaces/IElementRenderer.md#shapekinds)

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`addConnector`](../../../canvas/src/interfaces/IElementRenderer.md#addconnector)

***

### addShape()

> **addShape**\<`TSpec`\>(`id`, `spec`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`addShape`](../../../canvas/src/interfaces/IElementRenderer.md#addshape)

***

### boundsOfSpec()

> **boundsOfSpec**(`spec`): [`Rect`](../interfaces/Rect.md)

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

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`boundsOfSpec`](../../../canvas/src/interfaces/IElementRenderer.md#boundsofspec)

***

### collapsedShapeSpec()

> **collapsedShapeSpec**(`spec`): `Record`\<`string`, `unknown`\>

The registered shape's **minimal form** — the smallest version of the
silhouette that still identifies it — as a partial spec to merge over
`spec`. `undefined` when the kind isn't registered or its ctor doesn't
implement `collapsedOf`; callers then keep the spec unchanged.

Container frames (`@invana/graph` group nodes) render a collapsed frame
through this instead of switching over a closed kind enum, so a runtime-
registered shape brings its own collapsed look. See
`ShapeCtor.collapsedOf` for the contract.

#### Parameters

##### spec

###### kind

`string`

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`collapsedShapeSpec`](../../../canvas/src/interfaces/IElementRenderer.md#collapsedshapespec)

***

### connectorGeometryUnchanged()

> **connectorGeometryUnchanged**(`id`, `next`): `boolean`

True iff re-rendering connector `id` with `next` would leave its **geometry**
unchanged — everything but the `stroke` matches the current spec. Lets a
state-only re-render (hover / select highlight) take the `setConnectorStroke`
fast path and skip the re-route + hit-reindex a full `updateConnector` does.

Conservative: it compares the whole spec **minus `stroke`**, so any real
geometry / marker / router change (or an unknown edge, or a key-order
mismatch) returns `false` and the caller does the full update — it can never
green-light a stale-geometry fast path.

#### Parameters

##### id

`string`

##### next

[`BaseConnectorSpec`](../interfaces/BaseConnectorSpec.md)

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`connectorGeometryUnchanged`](../../../canvas/src/interfaces/IElementRenderer.md#connectorgeometryunchanged)

***

### connectorRecord()

> **connectorRecord**(`id`): [`ConnectorHitRecord`](../../../canvas/src/interfaces/ConnectorHitRecord.md)

A connector's spec plus its **routed, sampled** polyline. Routing happens
here (the router registry is renderer-side), and the sample is memoised on
the instance, so this is a cheap read per query.

#### Parameters

##### id

`string`

#### Returns

[`ConnectorHitRecord`](../../../canvas/src/interfaces/ConnectorHitRecord.md)

#### Implementation of

[`HitGeometrySource`](../../../canvas/src/interfaces/HitGeometrySource.md).[`connectorRecord`](../../../canvas/src/interfaces/HitGeometrySource.md#connectorrecord)

***

### cull()

> **cull**(`visibleBounds`, `padWorld?`): `void`

**Viewport culling.** Toggle `renderable` on every *indexed* shape /
connector by whether its bbox intersects `visibleBounds` (grown by
`padWorld` so elements don't pop at the screen edge during a pan). Off-screen
elements are then skipped by Pixi's render pass — the working set drops
sharply when zoomed in, which is where it matters. Reuses the same rbush that
backs hit-testing (`searchRect`), so it's conservative for loose connector
bboxes: it may keep an off-screen edge, but never culls an on-screen one.

Elements not in the hit index (hidden / non-hittable) are left untouched.
Cheap enough to run once per camera-move frame; it buys nothing for the
fully zoomed-out hairball (everything's on screen — that needs batching).

#### Parameters

##### visibleBounds

[`Rect`](../interfaces/Rect.md)

##### padWorld?

`number` = `0`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`cull`](../../../canvas/src/interfaces/IElementRenderer.md#cull)

***

### destroy()

> **destroy**(): `void`

Release everything this device holds.

Called by whoever *owns* the device. A layer that received its renderer
from `surface.primitives` does **not** own it — the surface does, and
destroys it in `ISurface.destroy()`. Calling it from both places is a
double-free.

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`destroy`](../../../canvas/src/interfaces/IElementRenderer.md#destroy)

***

### fitShapeSpecToContent()

> **fitShapeSpecToContent**(`spec`, `content`): `Record`\<`string`, `unknown`\>

Geometry partial that fits the registered shape around `content` — the
measured size of what it carries (typically its label). `undefined` when
the kind isn't registered or its ctor doesn't implement `fitToContent`.

The caller measures and the shape decides: pair this with
[measureLabel](#measurelabel) so no caller needs to know how a given silhouette
turns a text size into geometry. See `ShapeCtor.fitToContent`.

#### Parameters

##### spec

###### kind

`string`

##### content

###### height

`number`

###### width

`number`

#### Returns

`Record`\<`string`, `unknown`\>

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`fitShapeSpecToContent`](../../../canvas/src/interfaces/IElementRenderer.md#fitshapespectocontent)

***

### getConnectorPolyline()

> **getConnectorPolyline**(`id`): readonly [`Point`](../interfaces/Point.md)[]

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

readonly [`Point`](../interfaces/Point.md)[]

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getConnectorPolyline`](../../../canvas/src/interfaces/IElementRenderer.md#getconnectorpolyline)

***

### getDecoration()

> **getDecoration**(`id`, `slot`): [`IDecorationBase`](../interfaces/IDecorationBase.md)\<`unknown`, `unknown`\>

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getDecoration`](../../../canvas/src/interfaces/IElementRenderer.md#getdecoration)

***

### getDecorationWorldBounds()

> **getDecorationWorldBounds**(`targetId`, `slot`): [`Rect`](../interfaces/Rect.md)

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

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getDecorationWorldBounds`](../../../canvas/src/interfaces/IElementRenderer.md#getdecorationworldbounds)

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): [`Point`](../interfaces/Point.md)

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

[`Point`](../interfaces/Point.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getShapeCenter`](../../../canvas/src/interfaces/IElementRenderer.md#getshapecenter)

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getShapeKind`](../../../canvas/src/interfaces/IElementRenderer.md#getshapekind)

***

### getShapePosition()

> **getShapePosition**(`id`): [`Point`](../interfaces/Point.md)

World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
use this when a behaviour needs the shape's translation point (drag
offset baseline, anchor for an external overlay, etc.).

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getShapePosition`](../../../canvas/src/interfaces/IElementRenderer.md#getshapeposition)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): [`Rect`](../interfaces/Rect.md)

World-space AABB of the registered shape, or `null` when no shape with
that id exists. Domain-free read accessor for layer code that needs to
query shape geometry without poking at private state — e.g. a graph
layer building an obstacle list for an edge's router, a behaviour that
wants to fit content to a selection, or a debug overlay.

#### Parameters

##### id

`string`

#### Returns

[`Rect`](../interfaces/Rect.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`getShapeWorldBounds`](../../../canvas/src/interfaces/IElementRenderer.md#getshapeworldbounds)

***

### hasBadge()

> **hasBadge**(`hostId`, `slot`): `boolean`

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

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`hasConnector`](../../../canvas/src/interfaces/IElementRenderer.md#hasconnector)

***

### hasShape()

> **hasShape**(`id`): `boolean`

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`hasShape`](../../../canvas/src/interfaces/IElementRenderer.md#hasshape)

***

### hitTest()

> **hitTest**(`worldX`, `worldY`, `exclude?`): [`HitResult`](../interfaces/HitResult.md)

#### Parameters

##### worldX

`number`

##### worldY

`number`

##### exclude?

`ReadonlySet`\<`string`\>

#### Returns

[`HitResult`](../interfaces/HitResult.md)

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`hitTest`](../../../canvas/src/interfaces/IElementRenderer.md#hittest)

***

### measureLabel()

> **measureLabel**(`content`, `wrap?`): `object`

Text extent `content` would occupy if mounted as a `label` decoration,
or `null` for content this can't measure statically (`html-text`).

Nothing is mounted, drawn or cached — this is a pure query against the
same font resolution the renderer uses, so a domain layer can size
geometry **around** a label (a tab, a header band, a chip) before that
label exists, without importing a drawing library to do it.

#### Parameters

##### content

[`LabelContent`](../type-aliases/LabelContent.md)

##### wrap?

[`LabelWrap`](../interfaces/LabelWrap.md)

#### Returns

`object`

##### height

> **height**: `number`

##### width

> **width**: `number`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`measureLabel`](../../../canvas/src/interfaces/IElementRenderer.md#measurelabel)

***

### moveShape()

> **moveShape**(`id`, `x`, `y`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`moveShape`](../../../canvas/src/interfaces/IElementRenderer.md#moveshape)

***

### rasteriseLabel()

> **rasteriseLabel**(`id`, `resolution`): `void`

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

Recompute the path of every connector. Use after a batch of
`scaleShape` calls (e.g. one `NodeScaleLODBehaviour` zoom tick) so
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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`reanchorAllConnectors`](../../../canvas/src/interfaces/IElementRenderer.md#reanchorallconnectors)

***

### registerAnchor()

> **registerAnchor**(`kind`, `fn`): `void`

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

Teach this backend a new element kind. The spec vocabulary stays open —
`containsSpec` / `boundsOfSpec` return `undefined` for kinds they don't
know, and picking falls back to asking the instance.

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`registerShape`](../../../canvas/src/interfaces/IElementRenderer.md#registershape)

***

### reindexScaledShapeHits()

> **reindexScaledShapeHits**(`ids?`): `void`

Bulk re-index hit-test bboxes for shapes — pairs with
[scaleShape](#scaleshape) (which intentionally skips per-call hit updates).

Passing `ids` confines the reindex to those shapes. Omitting it
touches every shape instance. Either way the rbush tree is rebuilt
once via `clear + load` rather than N × `remove + insert`.

Call on gesture settle (e.g. inside `NodeScaleLODBehaviour`'s
trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
hit-test accuracy snaps back the moment the user stops zooming.

#### Parameters

##### ids?

`Iterable`\<`string`\>

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`reindexScaledShapeHits`](../../../canvas/src/interfaces/IElementRenderer.md#reindexscaledshapehits)

***

### removeBadge()

> **removeBadge**(`hostId`, `slot`): `void`

#### Parameters

##### hostId

`string`

##### slot

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`removeBadge`](../../../canvas/src/interfaces/IElementRenderer.md#removebadge)

***

### removeConnector()

> **removeConnector**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`removeConnector`](../../../canvas/src/interfaces/IElementRenderer.md#removeconnector)

***

### removeShape()

> **removeShape**(`id`): `void`

#### Parameters

##### id

`string`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`removeShape`](../../../canvas/src/interfaces/IElementRenderer.md#removeshape)

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

Re-route every registered connector. Useful after a non-endpoint shape
moves (e.g. an obstacle) and you want connectors that auto-collect
obstacles to update their path.

Each call re-runs `routePath` per connector and refreshes the hit index
and any connector decorations. Linear in `connectorInstances`; safe to
call from drag handlers in typical layouts. Heavy graphs with thousands
of edges should prefer a targeted re-route (future).

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`reRouteAllConnectors`](../../../canvas/src/interfaces/IElementRenderer.md#rerouteallconnectors)

***

### scaleConnectorStroke()

> **scaleConnectorStroke**(`id`, `scale`): `void`

Fast-path render-time stroke multiplier for a connector — writes
`inst.strokeWidthScale` and redraws on the cached path.

`EdgeScaleLODBehaviour` uses this each `camera:zoom` frame to keep
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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`scaleConnectorStroke`](../../../canvas/src/interfaces/IElementRenderer.md#scaleconnectorstroke)

***

### scaleShape()

> **scaleShape**(`id`, `scale`): `void`

Fast-path uniform rescale for a shape — writes the gfx transform
directly without touching the spec or rebuilding geometry.

`updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
+ retrace) on every call, which dominates the cost when something
like `NodeScaleLODBehaviour` rewrites thousands of node sizes per
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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`scaleShape`](../../../canvas/src/interfaces/IElementRenderer.md#scaleshape)

***

### scaleShapeSpec()

> **scaleShapeSpec**(`spec`, `factor`): `Record`\<`string`, `unknown`\>

Uniformly-scaled partial of the registered shape `kind`, with
geometry params multiplied by `factor`. Aspect ratio, angular
range, and vertex topology are preserved. Returns `undefined`
when the kind isn't registered or its ctor doesn't implement
`static scaleSpec`.

The contract pairs with [boundsOfSpec](#boundsofspec): scaling by `k`
scales the AABB exactly by `k`. Callers compose the returned
partial with paint channels (`fill` / `stroke`) and position
(`x` / `y`) themselves.

Used by `NodeScaleLODBehaviour` to rewrite shape size as the
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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`scaleShapeSpec`](../../../canvas/src/interfaces/IElementRenderer.md#scaleshapespec)

***

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

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

[`BadgeOptions`](../../../canvas/src/interfaces/BadgeOptions.md)

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setBadge`](../../../canvas/src/interfaces/IElementRenderer.md#setbadge)

***

### setConnectorStroke()

> **setConnectorStroke**(`id`, `stroke`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setConnectorStroke`](../../../canvas/src/interfaces/IElementRenderer.md#setconnectorstroke)

***

### setDecoration()

> **setDecoration**\<`TStyle`\>(`targetId`, `slot`, `decoration`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setDecoration`](../../../canvas/src/interfaces/IElementRenderer.md#setdecoration)

***

### setDecorationVisible()

> **setDecorationVisible**(`targetId`, `slot`, `visible`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setDecorationVisible`](../../../canvas/src/interfaces/IElementRenderer.md#setdecorationvisible)

***

### setEffect()

> **setEffect**\<`TStyle`\>(`targetId`, `slot`, `effect`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setEffect`](../../../canvas/src/interfaces/IElementRenderer.md#seteffect)

***

### setHitTestEnabled()

> **setHitTestEnabled**(`enabled`): `void`

Enable / disable all picking for this renderer. When disabled, [hitTest](#hittest)
returns `null` regardless of what's under the cursor — the owning layer flips
this from `onVisibleChange` so a hidden layer's elements aren't clickable.

#### Parameters

##### enabled

`boolean`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setHitTestEnabled`](../../../canvas/src/interfaces/IElementRenderer.md#sethittestenabled)

***

### setLabelsResolution()

> **setLabelsResolution**(`resolution`): `void`

Push a rasterisation resolution to every label decoration (shape + edge)
currently attached, and remember it so labels mounted later inherit the
same fidelity. Driven by zoom-aware behaviours
(see `@invana/graph` / `TextResolutionLODBehaviour`): when the camera
zooms past a threshold, push `dpr * zoom` to re-rasterise glyphs sharp.

Idempotent: Pixi internally short-circuits `Text.resolution` writes when
the value matches, so calling this with the unchanged value every frame
is safe and cheap.

#### Parameters

##### resolution

`number`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setLabelsResolution`](../../../canvas/src/interfaces/IElementRenderer.md#setlabelsresolution)

***

### setLODLevel()

> **setLODLevel**(`id`, `level`): `void`

#### Parameters

##### id

`string`

##### level

`number`

#### Returns

`void`

***

### setRaised()

> **setRaised**(`ids`): `void`

Declare the **complete set** of elements that should be lifted above their
peers — shapes and connectors alike. The renderer diffs against what it
already has lifted, reparenting newcomers into the overlay and dropping
everything absent from `ids` back to its home layer.

This is the whole raise API: one call, whole-set semantics. It is
deliberately *not* a pair of `raise(id)` / `lower(id)` primitives, because
those make every caller keep a private ledger of what it touched — and two
callers lifting overlapping sets then lower each other's elements, or
strand elements in the overlay when one of them stops running. Handing over
the full set makes lifting a projection the renderer reconciles, so the
only thing a caller has to get right is *what should be up right now*.

Purely visual: geometry, transforms and the hit index are untouched
(closest-wins hit resolution reads the spec `zIndex` recorded at insert).
Reparenting survives redraws — updates mutate the existing `gfx` in place
and never re-add it to a layer.

#### Parameters

##### ids

`Iterable`\<`string`\>

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setRaised`](../../../canvas/src/interfaces/IElementRenderer.md#setraised)

***

### setShapeIconVisible()

> **setShapeIconVisible**(`id`, `visible`): `void`

Show / hide a shape's **inset icon** content (`glyph` / `svg` / `svg-url`).
Pure `.visible` flip — no repaint. Persists across redraws. No-op for
shapes that don't carry inset content.

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setShapeIconVisible`](../../../canvas/src/interfaces/IElementRenderer.md#setshapeiconvisible)

***

### setShapeImageVisible()

> **setShapeImageVisible**(`id`, `visible`): `void`

Show / hide a shape's silhouette **image** fill. Repaints the body with the
`image` layer stripped / restored. Persists across redraws. No-op for
shapes without an image fill.

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setShapeImageVisible`](../../../canvas/src/interfaces/IElementRenderer.md#setshapeimagevisible)

***

### setShapeTextVisible()

> **setShapeTextVisible**(`id`, `visible`): `void`

Show / hide a shape's **text** — both the external `'label'` decoration
(simple nodes) *and* any internal text the shape mounts (e.g. a
`CompositeShape`'s `label` parts, via the optional `setTextVisible` hook).
Gives text zoom-LOD a single entry point that covers atomic and composite
nodes alike; the companion trio is [setShapeIconVisible](#setshapeiconvisible) /
[setShapeImageVisible](#setshapeimagevisible). No-op for the pieces a shape doesn't have.

#### Parameters

##### id

`string`

##### visible

`boolean`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setShapeTextVisible`](../../../canvas/src/interfaces/IElementRenderer.md#setshapetextvisible)

***

### setVisibleSet()

> **setVisibleSet**(`ids`): `void`

Declare which elements should be drawn this frame — the per-frame visible
set (design G4). **Policy is the engine's**: it decides what is on screen
from its own index, and the renderer only applies the answer, which is what
keeps culling identical across backends.

`null` restores everything (the old `uncull`). Elements outside the picking
index — hidden or non-hittable — are left untouched either way, so an
explicitly-hidden shape is never revived by a cull pass.

#### Parameters

##### ids

`ReadonlySet`\<`string`\>

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`setVisibleSet`](../../../canvas/src/interfaces/IElementRenderer.md#setvisibleset)

***

### shapeIds()

> **shapeIds**(): `Iterable`\<`string`\>

Every currently-indexable shape id — for a full reindex.

#### Returns

`Iterable`\<`string`\>

#### Implementation of

[`HitGeometrySource`](../../../canvas/src/interfaces/HitGeometrySource.md).[`shapeIds`](../../../canvas/src/interfaces/HitGeometrySource.md#shapeids)

***

### shapeRecord()

> **shapeRecord**(`id`): [`ShapeHitRecord`](../../../canvas/src/interfaces/ShapeHitRecord.md)

The facts about a shape that a spec can't carry: the visual scale a LOD
behaviour wrote onto `gfx` without rebuilding geometry, and — for a
`registerShape` custom kind the spec vocabulary has never heard of — the
instance's own silhouette and local bounds.

`gfxScale` matters because `NodeScaleLODBehaviour` (and
`HoverActivateBehaviour.zoomedOutScale`) inflate a shape visually without
touching its spec; the index divides world deltas by it before the narrow
phase, so a 5×-scaled shape whose silhouette covers the cursor still picks.

#### Parameters

##### id

`string`

#### Returns

[`ShapeHitRecord`](../../../canvas/src/interfaces/ShapeHitRecord.md)

#### Implementation of

[`HitGeometrySource`](../../../canvas/src/interfaces/HitGeometrySource.md).[`shapeRecord`](../../../canvas/src/interfaces/HitGeometrySource.md#shaperecord)

***

### tickAnimations()

> **tickAnimations**(`deltaMs`): `void`

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`tickAnimations`](../../../canvas/src/interfaces/IElementRenderer.md#tickanimations)

***

### toSVG()

> **toSVG**(): `string`

Serialise every live shape + connector this renderer holds to an SVG
fragment (no `<svg>` wrapper) in world coordinates — the vector projection
behind Canvas.exportSVG. Connectors are emitted first (drawn under
shapes), then shapes; each shape/connector's attached `label` decoration is
rendered as `<text>`.

Coverage caveats (raster export is exact for these) are documented in
`export/svgExport.ts`: `image` / `glyph` / `svg` fills, non-label
decorations, and effects are not represented in the vector output.

#### Returns

`string`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`toSVG`](../../../canvas/src/interfaces/IElementRenderer.md#tosvg)

***

### uncull()

> **uncull**(): `void`

Undo culling — restore `renderable` on every shape / connector.

#### Returns

`void`

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`uncull`](../../../canvas/src/interfaces/IElementRenderer.md#uncull)

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`updateConnector`](../../../canvas/src/interfaces/IElementRenderer.md#updateconnector)

***

### updateShape()

> **updateShape**\<`TSpec`\>(`id`, `partial`): `void`

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

#### Implementation of

[`IElementRenderer`](../../../canvas/src/interfaces/IElementRenderer.md).[`updateShape`](../../../canvas/src/interfaces/IElementRenderer.md#updateshape)
