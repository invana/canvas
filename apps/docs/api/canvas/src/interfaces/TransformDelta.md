# Interface: TransformDelta

Defined in: [packages/canvas/src/primitives/types.ts:674](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L674)

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

Defined in: [packages/canvas/src/primitives/types.ts:678](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L678)

Rotation delta in radians.

***

### dx?

> `readonly` `optional` **dx?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:675](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L675)

***

### dy?

> `readonly` `optional` **dy?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:676](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L676)

***

### sx?

> `readonly` `optional` **sx?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:680](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L680)

Horizontal scale multiplier. Identity = 1.

***

### sy?

> `readonly` `optional` **sy?**: `number`

Defined in: [packages/canvas/src/primitives/types.ts:682](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L682)

Vertical scale multiplier. Identity = 1.
