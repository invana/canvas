# Interface: TransformDelta

Defined in: [canvas/src/primitives/types.ts:872](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L872)

Per-frame transform contribution from a `target: 'transform'` effect. Each
field is optional and contributes additively (translations + rotation) or
multiplicatively (scale) when the renderer aggregates across all transform
effects attached to the same host. Omitted fields contribute the identity
(0 for additive, 1 for multiplicative).

Coordinates are in the host shape's parent space (the renderer's world
container) so deltas read like "wiggle the shape 3px right" regardless of
the host's internal local origin.

## Properties

### dRot?

> `readonly` `optional` **dRot?**: `number`

Defined in: [canvas/src/primitives/types.ts:876](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L876)

Rotation delta in radians.

***

### dx?

> `readonly` `optional` **dx?**: `number`

Defined in: [canvas/src/primitives/types.ts:873](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L873)

***

### dy?

> `readonly` `optional` **dy?**: `number`

Defined in: [canvas/src/primitives/types.ts:874](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L874)

***

### sx?

> `readonly` `optional` **sx?**: `number`

Defined in: [canvas/src/primitives/types.ts:878](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L878)

Horizontal scale multiplier. Identity = 1.

***

### sy?

> `readonly` `optional` **sy?**: `number`

Defined in: [canvas/src/primitives/types.ts:880](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L880)

Vertical scale multiplier. Identity = 1.
