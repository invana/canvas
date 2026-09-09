# Interface: TransformDelta

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

Rotation delta in radians.

***

### dx?

> `readonly` `optional` **dx?**: `number`

***

### dy?

> `readonly` `optional` **dy?**: `number`

***

### sx?

> `readonly` `optional` **sx?**: `number`

Horizontal scale multiplier. Identity = 1.

***

### sy?

> `readonly` `optional` **sy?**: `number`

Vertical scale multiplier. Identity = 1.
