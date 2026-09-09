# Interface: RendererInitOptions

## Extended by

- [`RendererMountOptions`](../../../canvas/src/interfaces/RendererMountOptions.md)

## Properties

### antialias?

> `optional` **antialias?**: `boolean`

Enable multisample antialiasing.

***

### background?

> `optional` **background?**: `number`

Initial clear colour (`0xRRGGBB`) applied before the first frame. The ongoing
scene background is the syncable [CanvasSceneOptions.backgroundColor](CanvasSceneOptions.md#backgroundcolor);
this is only the pre-mount clear.

***

### height?

> `optional` **height?**: `number`

***

### preference?

> `optional` **preference?**: [`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)

Preferred GPU backend ([RenderPreference](../../../canvas/src/type-aliases/RenderPreference.md)). The renderer may downgrade
(e.g. `'webgpu'` → `'webgl'` on browsers whose WebGPU path is unavailable);
the resolved value is reported on `IRenderer.backend` after mount. Omit to
let the backend choose.

***

### resolution?

> `optional` **resolution?**: `number`

Device-pixel-ratio / resolution override. Defaults to the display DPR.

***

### width?

> `optional` **width?**: `number`

Initial drawing-surface size in CSS pixels. Omit to fill (and track) the host
element's client box.
