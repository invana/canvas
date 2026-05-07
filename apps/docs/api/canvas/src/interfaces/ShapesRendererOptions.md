# Interface: ShapesRendererOptions

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:100](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L100)

## Properties

### camera

> `readonly` **camera**: [`Camera`](../classes/Camera.md)

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:108](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L108)

Canvas camera — used for resolution-aware draws (e.g. text rasterisation).

***

### container

> `readonly` **container**: `Container`

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:106](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L106)

Pixi `Container` the renderer attaches its pixi children to. Pass
`this.container` from the host `WorldLayer`'s `onMount` — the layer's own
root container, obtained via the protected `container` getter.

***

### textureRegistry?

> `readonly` `optional` **textureRegistry?**: [`TextureRegistry`](../classes/TextureRegistry.md)

Defined in: [packages/canvas/src/renderers/ShapesRenderer.ts:118](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/ShapesRenderer.ts#L118)

Optional shared texture registry. When provided, `url`-based
`ImageShapeSpec`s resolve textures from this registry (cache hit →
synchronous; miss → async load). Multiple renderers sharing one registry
share GPU texture uploads.

If omitted, the renderer creates an internal registry — URL-based image
shapes still work, but textures are not shared across renderer instances.
