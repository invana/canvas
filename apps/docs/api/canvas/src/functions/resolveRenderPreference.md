# Function: resolveRenderPreference()

> **resolveRenderPreference**(`pref`): [`RenderPreference`](../type-aliases/RenderPreference.md)

Defined in: [canvas/src/engine/rendererSupport.ts:68](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/rendererSupport.ts#L68)

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
