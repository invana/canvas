# Function: resolveRenderPreference()

> **resolveRenderPreference**(`pref`): [`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)

Resolve the backend the engine will actually request from PixiJS. Downgrades a
`'webgpu'` preference to `'webgl'` when WebGPU isn't usable ([canUseWebGPU](canUseWebGPU.md)),
so we never hand PixiJS a backend that will crash at render time. `'webgl'` and
`'canvas'` pass through unchanged. Applied by `Canvas.init()`; the resolved
backend is reported on the `renderer:initialised` event.

## Parameters

### pref

[`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)

## Returns

[`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)
