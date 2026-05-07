# Interface: ShapePaintStyle

Defined in: [packages/canvas/src/renderers/types.ts:170](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L170)

Optional style override for `ShapeCtor.paintInto`. When supplied, the
shape's spec colour/alpha are ignored and the override is applied — used
by connector decorations to tint markers to match the decoration colour
(e.g. a glow paints the markers in the glow colour for unified silhouette
coverage).

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:172](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L172)

***

### color?

> `readonly` `optional` **color?**: `number`

Defined in: [packages/canvas/src/renderers/types.ts:171](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L171)
