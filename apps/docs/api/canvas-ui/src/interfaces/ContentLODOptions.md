# Interface: ContentLODOptions

The serialisable options a content-LOD behaviour takes — a zoom band. The base
`id` / `targetLayerId` / `enabled` / `shortcuts` fields are out of scope.

## Properties

### alwaysShowTop?

> `optional` **alwaysShowTop?**: `number`

Text only — keep labels shown for the top fraction of nodes by degree
centrality even below the band (e.g. `0.05` = top 5%). Ignored by the
icon / image behaviours.

***

### maxZoom?

> `optional` **maxZoom?**: `number`

Show content at/below this camera scale. Blank = no upper bound.

***

### minZoom?

> `optional` **minZoom?**: `number`

Show content at/above this camera scale. Blank = no lower bound.
