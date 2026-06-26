# Function: bestRenderPreference()

> **bestRenderPreference**(): [`RenderPreference`](../type-aliases/RenderPreference.md)

Defined in: [canvas/src/engine/rendererSupport.ts:80](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/rendererSupport.ts#L80)

The most performant backend this browser can actually render with: WebGPU when
usable ([canUseWebGPU](canUseWebGPU.md)), else WebGL when a context is available
([hasWebGL](hasWebGL.md)), else `'canvas'` as a last resort. Use it to default a
canvas / a backend picker to the fastest option the device supports, rather
than hard-coding `'webgpu'` and relying on downgrade.

## Returns

[`RenderPreference`](../type-aliases/RenderPreference.md)
