# Function: hasWebGL()

> **hasWebGL**(): `boolean`

Defined in: [canvas/src/engine/rendererSupport.ts:36](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/rendererSupport.ts#L36)

Whether a WebGL (`webgl2`/`webgl`) context can be created — the floor for
rendering. If this is false and WebGPU is unusable too, the canvas can't
initialise on this browser at all.

## Returns

`boolean`
