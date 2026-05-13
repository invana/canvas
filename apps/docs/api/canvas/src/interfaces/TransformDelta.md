# Interface: TransformDelta

Defined in: [packages/canvas/src/primitives/types.ts:775](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L775)

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

Defined in: [packages/canvas/src/primitives/types.ts:779](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L779)

Rotation delta in radians.

***

### dx?

> `readonly` `optional` **dx?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:776](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L776)

***

### dy?

> `readonly` `optional` **dy?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:777](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L777)

***

### sx?

> `readonly` `optional` **sx?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:781](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L781)

Horizontal scale multiplier. Identity = 1.

***

### sy?

> `readonly` `optional` **sy?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:783](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/types.ts#L783)

Vertical scale multiplier. Identity = 1.
