# Interface: ZoomBand

A zoom band. Content is shown when `minZoom ≤ camera.scale ≤ maxZoom`.

## Extended by

- [`ContentLODBehaviourOptions`](ContentLODBehaviourOptions.md)

## Properties

### maxZoom?

> `readonly` `optional` **maxZoom?**: `number`

Show at/below this camera scale. Omit for "no upper bound".

***

### minZoom?

> `readonly` `optional` **minZoom?**: `number`

Show at/above this camera scale. Omit for "no lower bound".
