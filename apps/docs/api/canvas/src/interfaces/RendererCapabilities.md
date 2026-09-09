# Interface: RendererCapabilities

What a backend can and cannot do. The engine reads this to degrade rather
than throw — a spec kind a backend doesn't know is skipped with a
`capability:unsupported` event, which is what lets a second backend ship with
a subset (`docs/renderer-split-design.md` §4.2).

## Properties

### depth

> `readonly` **depth**: `boolean`

Whether the backend has a real depth axis (2D backends: `false`).

***

### effects

> `readonly` **effects**: `"none"` \| `"style"` \| `"shader"`

How far visual effects go: none, style-level (tint/alpha), or real shaders.

***

### rasterExport

> `readonly` **rasterExport**: `boolean`

Whether [IRenderer.extract](IRenderer.md#extract) is available.

***

### specKinds

> `readonly` **specKinds**: readonly `string`[]

Spec kinds this backend can draw. Unknown kinds degrade, never throw.

***

### textMode

> `readonly` **textMode**: `"native"` \| `"sdf"` \| `"dom"`

How text is rasterised. Drives which label features are honoured.
