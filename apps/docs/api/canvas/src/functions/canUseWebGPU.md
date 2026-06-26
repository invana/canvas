# Function: canUseWebGPU()

> **canUseWebGPU**(): `boolean`

Defined in: [canvas/src/engine/rendererSupport.ts:57](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/rendererSupport.ts#L57)

Whether WebGPU can be used for rendering here. Currently equivalent to
[hasWebGPUApi](hasWebGPUApi.md) — we trust API presence and let PixiJS select WebGPU. This
is the gate consumers should hang a "use WebGPU" toggle on; if a browser-specific
exclusion ever needs to come back (see module header), add it here so every
consumer and [resolveRenderPreference](resolveRenderPreference.md) pick it up at once.

## Returns

`boolean`
