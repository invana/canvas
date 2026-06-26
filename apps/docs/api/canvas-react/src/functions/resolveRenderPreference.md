# Function: resolveRenderPreference()

> **resolveRenderPreference**(`pref`): [`RenderPreference`](../type-aliases/RenderPreference.md)

Defined in: canvas/dist/index.d.ts:2267

Resolve the backend the engine will actually request from PixiJS. Downgrades a
`'webgpu'` preference to `'webgl'` when WebGPU isn't usable ([canUseWebGPU](canUseWebGPU.md)),
so we never hand PixiJS a backend that will crash at render time. `'webgl'` and
`'canvas'` pass through unchanged. Applied by `Canvas.init()`; the resolved
backend is reported on the `renderer:initialised` event.

## Parameters

### pref

[`RenderPreference`](../type-aliases/RenderPreference.md)

## Returns

[`RenderPreference`](../type-aliases/RenderPreference.md)
