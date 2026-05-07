# Interface: ShapeDecorationHostInfo

Defined in: [packages/canvas/src/renderers/types.ts:183](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L183)

Information a `Decoration` receives in `mount`/`update`. Carries the host's
current bounds plus the surfaces above and below the host's draw call,
used by the decoration to attach into the correct slot z-band.

Connector decorations get the routed polyline as well; shape decorations
get the local-space AABB.

## Properties

### bounds

> `readonly` **bounds**: [`ShapesRect`](ShapesRect.md)

Defined in: [packages/canvas/src/renderers/types.ts:190](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L190)

Local-space axis-aligned bounding box of the host shape.

***

### hostId

> `readonly` **hostId**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:184](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L184)

***

### hostKind

> `readonly` **hostKind**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:186](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L186)

Registered shape kind of the host (`'circle'`, `'rect'`, …).

***

### outlinePolyline?

> `readonly` `optional` **outlinePolyline?**: readonly `object`[]

Defined in: [packages/canvas/src/renderers/types.ts:207](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L207)

Closed outline polyline in shape-local coordinates. Present for `polygon`
and `path` hosts; absent for `circle`, `ellipse`, `rect`, `image`, `text`.
Decorations that trace outlines should use this instead of the AABB
fallback when available, so the decoration follows the actual shape geometry.

***

### slot

> `readonly` **slot**: `string`

Defined in: [packages/canvas/src/renderers/types.ts:188](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L188)

Slot the decoration is being mounted into (e.g. `'halo'`, `'border'`).

***

### slotZIndex

> `readonly` **slotZIndex**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:200](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L200)

Pre-computed z-index for the supplied slot. See SLOT_Z table in renderer.

***

### surface

> `readonly` **surface**: `Container`

Defined in: [packages/canvas/src/renderers/types.ts:198](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L198)

Surface to attach the decoration's `gfx` to. Set to the host shape's
`gfx` Container so the decoration moves with the shape and draws in
shape-local coordinates. Has `sortableChildren = true` set; the
decoration should set its own `gfx.zIndex = slotZIndex` to land in the
correct z-band.
