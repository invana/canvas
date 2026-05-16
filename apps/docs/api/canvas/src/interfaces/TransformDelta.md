# Interface: TransformDelta

Defined in: [canvas/src/primitives/types.ts:780](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L780)

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

Defined in: [canvas/src/primitives/types.ts:784](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L784)

Rotation delta in radians.

***

### dx?

> `readonly` `optional` **dx?**: `number`

Defined in: [canvas/src/primitives/types.ts:781](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L781)

***

### dy?

> `readonly` `optional` **dy?**: `number`

Defined in: [canvas/src/primitives/types.ts:782](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L782)

***

### sx?

> `readonly` `optional` **sx?**: `number`

Defined in: [canvas/src/primitives/types.ts:786](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L786)

Horizontal scale multiplier. Identity = 1.

***

### sy?

> `readonly` `optional` **sy?**: `number`

Defined in: [canvas/src/primitives/types.ts:788](https://github.com/invana/canvas/blob/923d3ae6f212f718b1d8c043b664b6646d19dabf/packages/canvas/src/primitives/types.ts#L788)

Vertical scale multiplier. Identity = 1.
