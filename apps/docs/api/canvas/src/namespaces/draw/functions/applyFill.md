# Function: applyFill()

> **applyFill**(`g`, `fill`, `alpha`, `cx`, `cy`, `w`, `h`, `fit?`): `void`

Defined in: [packages/canvas/src/renderers/draw/shapes/textureMatrix.ts:88](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/shapes/textureMatrix.ts#L88)

Apply a fill to the most recently defined Graphics path.

- `number` fill  → solid color, respects `alpha`. `fit` is ignored.
- `Texture` fill → texture sized to `(cx, cy, w, h)` per `fit`, respects `alpha`.

Must be called immediately after the path definition, before any other
Graphics call.

## Parameters

### g

[`Graphics`](../../../interfaces/Graphics.md)

### fill

[`FillInput`](../type-aliases/FillInput.md)

### alpha

`number`

### cx

`number`

### cy

`number`

### w

`number`

### h

`number`

### fit?

[`FillFit`](../type-aliases/FillFit.md)

## Returns

`void`
