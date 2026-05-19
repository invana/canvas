# Class: PrimitivesRenderer

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:171](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L171)

## Constructors

### Constructor

> **new PrimitivesRenderer**(`opts`): `PrimitivesRenderer`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:251](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L251)

#### Parameters

##### opts

[`PrimitivesRendererOptions`](../interfaces/PrimitivesRendererOptions.md)

#### Returns

`PrimitivesRenderer`

## Properties

### camera

> `readonly` **camera**: [`Camera`](Camera.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:248](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L248)

***

### events

> `readonly` **events**: [`EventEmitter`](EventEmitter.md)\<[`PrimitivesRendererEventMap`](../interfaces/PrimitivesRendererEventMap.md)\>

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:234](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L234)

## Accessors

### connectorCount

#### Get Signature

> **get** **connectorCount**(): `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1303](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1303)

##### Returns

`number`

***

### shapeCount

#### Get Signature

> **get** **shapeCount**(): `number`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1299](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1299)

##### Returns

`number`

## Methods

### addConnector()

> **addConnector**\<`TSpec`\>(`id`, `spec`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:507](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L507)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:376](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L376)

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

### destroy()

> **destroy**(): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1459](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1459)

#### Returns

`void`

***

### getConnectorPolyline()

> **getConnectorPolyline**(`id`): readonly [`Point`](../interfaces/Point.md)[]

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1341](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1341)

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

***

### getDecorationWorldBounds()

> **getDecorationWorldBounds**(`targetId`, `slot`): [`Rect`](../interfaces/Rect.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1356](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1356)

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

***

### getRenderStats()

> **getRenderStats**(): [`RenderStats`](../interfaces/RenderStats.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1291](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1291)

#### Returns

[`RenderStats`](../interfaces/RenderStats.md)

***

### getShapeCenter()

> **getShapeCenter**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1428](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1428)

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

***

### getShapeKind()

> **getShapeKind**(`id`): `string`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1322](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1322)

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

> **getShapePosition**(`id`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1413](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1413)

World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
use this when a behaviour needs the shape's translation point (drag
offset baseline, anchor for an external overlay, etc.).

#### Parameters

##### id

`string`

#### Returns

[`Point`](../interfaces/Point.md)

***

### getShapeWorldBounds()

> **getShapeWorldBounds**(`id`): [`Rect`](../interfaces/Rect.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1402](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1402)

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

***

### hasBadge()

> **hasBadge**(`hostId`, `slot`): `boolean`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:928](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L928)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1326](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1326)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hasShape()

> **hasShape**(`id`): `boolean`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1307](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1307)

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### hitTest()

> **hitTest**(`worldX`, `worldY`): [`HitResult`](../interfaces/HitResult.md)

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1194](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1194)

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`HitResult`](../interfaces/HitResult.md)

***

### rasteriseLabel()

> **rasteriseLabel**(`id`, `resolution`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:963](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L963)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:479](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L479)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:338](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L338)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:342](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L342)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:363](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L363)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:334](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L334)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:330](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L330)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:326](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L326)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:455](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L455)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:919](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L919)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:646](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L646)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### removeShape()

> **removeShape**(`id`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:485](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L485)

#### Parameters

##### id

`string`

#### Returns

`void`

***

### reRouteAllConnectors()

> **reRouteAllConnectors**(): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1448](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1448)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:597](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L597)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:436](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L436)

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

### setBadge()

> **setBadge**(`hostId`, `slot`, `options`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:882](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L882)

Attach a badge to a host shape. The badge is registered as a real shape
under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
any registered shape kind as the plate, any `ShapeFillLayer` as content
(solid / image / glyph / text / svg / image-inset / svg-url), and any
registered decoration via the `decorations` field.

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:550](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L550)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:661](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L661)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1385](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1385)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:762](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L762)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:980](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L980)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:953](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L953)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:1006](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L1006)

#### Parameters

##### deltaMs

`number`

#### Returns

`void`

***

### updateConnector()

> **updateConnector**\<`TSpec`\>(`id`, `partial`): `void`

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:526](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L526)

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

Defined in: [canvas/src/primitives/PrimitivesRenderer.ts:400](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/PrimitivesRenderer.ts#L400)

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
