# Function: deepMerge()

> **deepMerge**(`base`, `patch`): `unknown`

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
