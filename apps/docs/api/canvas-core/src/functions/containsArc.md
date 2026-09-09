# Function: containsArc()

> **containsArc**(`spec`, `localX`, `localY`, `pad?`): `boolean`

Annular sector, tested analytically rather than against a sampled outline:
radius inside `[innerR, outerR]` and angle inside the sweep, each relaxed by
`pad`. Outside the sweep the nearest point of the sector lies on one of the
two straight radial edges, so the padded test falls back to a distance check
against those two segments.

## Parameters

### spec

[`LocalSpec`](../type-aliases/LocalSpec.md)\<[`ArcSpec`](../interfaces/ArcSpec.md)\>

### localX

`number`

### localY

`number`

### pad?

`number` = `0`

## Returns

`boolean`
