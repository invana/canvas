# Interface: CanvasSceneOptions

Canvas/scene-level configuration — the settings that sit *above* individual
layers/behaviours/layouts. Renderer-init options (`preference`, `antialias`,
`resolution`, …) are deliberately **not** here: those belong to the renderer
adapter, not the syncable definition.

## Properties

### backgroundColor?

> `optional` **backgroundColor?**: `number`

Scene background colour (`0xRRGGBB`).

***

### defaultViewMode?

> `optional` **defaultViewMode?**: `string`

Default interaction mode the view starts in.

***

### initialCamera?

> `optional` **initialCamera?**: `CameraTransform`

Initial camera transform applied on load.

***

### suppressBrowserContextMenu?

> `optional` **suppressBrowserContextMenu?**: `boolean`

Suppress the browser's native context menu over the canvas.

***

### worldBounds?

> `optional` **worldBounds?**: [`Rect`](Rect.md)

Optional world/scene bounds (for fit-on-load / clamping), or `null`.

***

### zoom

> **zoom**: `object`

Zoom clamp for the abstract camera.

#### max

> **max**: `number`

#### min

> **min**: `number`
