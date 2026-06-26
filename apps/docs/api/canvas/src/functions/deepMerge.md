# Function: deepMerge()

> **deepMerge**(`base`, `patch`): `unknown`

Defined in: [canvas/src/engine/CanvasConfig.ts:48](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L48)

Recursively merge `patch` into `base`. Plain objects merge field-by-field;
everything else (arrays, functions, class instances, primitives) replaces —
matching the shallow semantics of `GraphLayer.setNodeDefaults`.

## Parameters

### base

`unknown`

### patch

`unknown`

## Returns

`unknown`
