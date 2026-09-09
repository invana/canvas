# Function: strokeBandOf()

> **strokeBandOf**(`stroke`): `object`

How far a stroke pushes the hit region past the silhouette (`outer`) and how
far it reaches back inside it (`inner`).

Mirrors pixi's split: `outer = (1 - alignment) * width`, `inner = width -
outer`, with the engine's `'inside' | 'center' | 'outside'` mapping to
pixi's `1 | 0.5 | 0` alignment. A missing or non-positive width paints
nothing, so it widens nothing.

## Parameters

### stroke

[`ShapeStroke`](../interfaces/ShapeStroke.md)

## Returns

`object`

### inner

> **inner**: `number`

### outer

> **outer**: `number`
