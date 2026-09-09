# Interface: ShapeHitRecord

What picking needs to know about a shape. `spec` carries the geometry;
`scale` and `containsLocal` are the two things only the renderer knows.

## Properties

### containsLocal?

> `readonly` `optional` **containsLocal?**: (`localX`, `localY`) => `boolean`

Narrow-phase containment for a `registerShape` kind the spec geometry
doesn't know, in the shape's **local** frame. Omitted — or ignored — for
built-in kinds, which containsSpec answers.

#### Parameters

##### localX

`number`

##### localY

`number`

#### Returns

`boolean`

***

### localBounds?

> `readonly` `optional` **localBounds?**: () => [`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

Local-frame bounds for a custom kind, same fallback rule as
[containsLocal](#containslocal).

#### Returns

[`Rect`](../../../renderer-pixijs/src/interfaces/Rect.md)

***

### scale

> `readonly` **scale**: `number`

Visual scale multiplier applied on top of the spec (LOD inflation, hover
zoom). The spec's geometry is in the *unscaled* local frame, so world-space
deltas are divided by this before the narrow phase.

***

### spec

> `readonly` **spec**: [`BaseShapeSpec`](../../../renderer-pixijs/src/interfaces/BaseShapeSpec.md)
