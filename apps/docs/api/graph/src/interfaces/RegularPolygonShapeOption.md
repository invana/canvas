# Interface: RegularPolygonShapeOption

Regular n-gon. With `rotation = 0` the first vertex points straight up, so
a triangle / pentagon / hexagon points up by default. Pass
`rotation: Math.PI / sides` for flat-top.

## Properties

### kind

> `readonly` **kind**: `"regular-polygon"`

***

### radius

> `readonly` **radius**: `number`

***

### rotation?

> `readonly` `optional` **rotation?**: `number`

***

### sides

> `readonly` **sides**: `number`
