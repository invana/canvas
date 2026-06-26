# Function: canUseWebGPU()

> **canUseWebGPU**(): `boolean`

Defined in: canvas/dist/index.d.ts:2259

Whether WebGPU can be used for rendering here. Currently equivalent to
[hasWebGPUApi](hasWebGPUApi.md) — we trust API presence and let PixiJS select WebGPU. This
is the gate consumers should hang a "use WebGPU" toggle on; if a browser-specific
exclusion ever needs to come back (see module header), add it here so every
consumer and [resolveRenderPreference](resolveRenderPreference.md) pick it up at once.

## Returns

`boolean`
