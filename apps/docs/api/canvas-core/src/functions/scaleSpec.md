# Function: scaleSpec()

> **scaleSpec**(`spec`, `factor`): `Record`\<`string`, `unknown`\>

Uniformly scale a spec's geometry by `factor`, as a partial patch to merge
onto it. Paint is untouched — only lengths.

The contract: `boundsOfSpec(scaleSpec(spec, k)).width === boundsOfSpec(spec).width * k`
(likewise height). `undefined` for kinds with no meaningful uniform scale
(`composite` sizes off its box and its parts, so scaling it needs the layer's
intent, not a geometric rule).

## Parameters

### spec

[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md)

### factor

`number`

## Returns

`Record`\<`string`, `unknown`\>
