# Function: bestRenderPreference()

> **bestRenderPreference**(): [`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)

The most performant backend this browser can actually render with: WebGPU when
usable ([canUseWebGPU](canUseWebGPU.md)), else WebGL when a context is available
([hasWebGL](hasWebGL.md)), else `'canvas'` as a last resort. Use it to default a
canvas / a backend picker to the fastest option the device supports, rather
than hard-coding `'webgpu'` and relying on downgrade.

## Returns

[`RenderPreference`](../../../canvas/src/type-aliases/RenderPreference.md)
