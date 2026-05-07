# Interface: ConnectorPaintStyle

Defined in: [packages/canvas/src/renderers/types.ts:279](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L279)

Style override passed by decorations to `IConnector.paintInto`. The
connector paints its full silhouette (path stroke + every shape-marker via
`ShapeCtor.paintInto`) into the supplied Graphics with these overrides
applied. When `tintMarkers` is set, markers are painted in the same
colour/alpha as the stroke — used by silhouette-wrapping decorations like
glow/halo.

## Properties

### dash?

> `readonly` `optional` **dash?**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:287](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L287)

#### dashLength

> `readonly` **dashLength**: `number`

#### dashOffset?

> `readonly` `optional` **dashOffset?**: `number`

Phase offset in pixels along arc-length. Default `0`.

#### gapLength

> `readonly` **gapLength**: `number`

***

### stroke?

> `readonly` `optional` **stroke?**: `object`

Defined in: [packages/canvas/src/renderers/types.ts:280](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L280)

#### alpha?

> `readonly` `optional` **alpha?**: `number`

#### cap?

> `readonly` `optional` **cap?**: `"butt"` \| `"round"` \| `"square"`

#### color

> `readonly` **color**: `number`

#### join?

> `readonly` `optional` **join?**: `"round"` \| `"miter"` \| `"bevel"`

#### width

> `readonly` **width**: `number`

***

### tintMarkers?

> `readonly` `optional` **tintMarkers?**: `boolean`

Defined in: [packages/canvas/src/renderers/types.ts:300](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/types.ts#L300)

When `true`, markers paint with `stroke.color` / `stroke.alpha` instead
of their own spec colours. Decorations like glow/halo set this so the
decoration covers path + markers as one unified silhouette; decorations
like marching-ants leave it undefined so markers paint normally over
the dashed line.
