# Function: hasSilhouetteFill()

> **hasSilhouetteFill**(`fill`): `boolean`

Does this fill paint the **silhouette** — i.e. would a backend emit a fill
for it? True for the `number` shorthand and for any `solid` / `image` layer;
false for `undefined` and for a fill made only of inset content
([InsetFillLayer](../type-aliases/InsetFillLayer.md)), which mounts a child instead of filling.

Load-bearing for hit-testing: a shape with no silhouette fill is **hollow**
— only its stroke band answers a containment test, exactly as pixi's
`Graphics.containsPoint` behaves (it consults a `fill` instruction that was
never emitted). See `containsSpec` in `specs/shapeGeometry/`.

## Parameters

### fill

[`ShapeFill`](../type-aliases/ShapeFill.md)

## Returns

`boolean`
