# Interface: RendererMountOptions

Where a renderer attaches, and the device knobs for standing it up.

## Extends

- [`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md)

## Properties

### antialias?

> `optional` **antialias?**: `boolean`

Enable multisample antialiasing.

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`antialias`](../../../canvas-store/src/interfaces/RendererInitOptions.md#antialias)

***

### autoResize?

> `optional` **autoResize?**: `boolean`

Track the host element's size and resize the surface to match. Default `false`.

***

### background?

> `optional` **background?**: `number`

Initial clear colour (`0xRRGGBB`) applied before the first frame. The ongoing
scene background is the syncable [CanvasSceneOptions.backgroundColor](../../../canvas-store/src/interfaces/CanvasSceneOptions.md#backgroundcolor);
this is only the pre-mount clear.

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`background`](../../../canvas-store/src/interfaces/RendererInitOptions.md#background)

***

### height?

> `optional` **height?**: `number`

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`height`](../../../canvas-store/src/interfaces/RendererInitOptions.md#height)

***

### opaque?

> `optional` **opaque?**: `boolean`

Opaque background (`backgroundAlpha: 1`) rather than a transparent surface.

***

### powerPreference?

> `optional` **powerPreference?**: `"high-performance"` \| `"low-power"`

GPU power hint forwarded to the backend where it has one.

***

### preference?

> `optional` **preference?**: [`RenderPreference`](../type-aliases/RenderPreference.md)

Preferred GPU backend ([RenderPreference](../type-aliases/RenderPreference.md)). The renderer may downgrade
(e.g. `'webgpu'` → `'webgl'` on browsers whose WebGPU path is unavailable);
the resolved value is reported on `IRenderer.backend` after mount. Omit to
let the backend choose.

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`preference`](../../../canvas-store/src/interfaces/RendererInitOptions.md#preference)

***

### resolution?

> `optional` **resolution?**: `number`

Device-pixel-ratio / resolution override. Defaults to the display DPR.

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`resolution`](../../../canvas-store/src/interfaces/RendererInitOptions.md#resolution)

***

### suppressBrowserContextMenu?

> `optional` **suppressBrowserContextMenu?**: `boolean`

Suppress the browser context menu on the drawing surface, so a right-click
can be a canvas gesture. Default `true`.

***

### width?

> `optional` **width?**: `number`

Initial drawing-surface size in CSS pixels. Omit to fill (and track) the host
element's client box.

#### Inherited from

[`RendererInitOptions`](../../../canvas-store/src/interfaces/RendererInitOptions.md).[`width`](../../../canvas-store/src/interfaces/RendererInitOptions.md#width)
