# Interface: TextKind\<TSpec\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:149](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L149)

Text primitive descriptor.

Text is fundamentally different from geometric primitives: Pixi `Text` /
`HTMLText` are their own display objects (rasterised glyphs on a texture),
not Graphics calls. They cannot share a parent's Graphics like circles can.

Instead of `draw(g, ...)`, text primitives `mount` a display object into a
supplied parent Container and return a `TextHandle` for subsequent updates.
The renderer holds the handle and calls `update` on spec changes,
`setLabelResolution` on zoom changes.

## Type Parameters

### TSpec

`TSpec` *extends* [`BaseShapeSpec`](BaseShapeSpec.md) = [`BaseShapeSpec`](BaseShapeSpec.md)

## Methods

### bounds()

> **bounds**(`handle`): [`Rect`](Rect.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:151](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L151)

#### Parameters

##### handle

[`TextHandle`](TextHandle.md)\<`TSpec`\>

#### Returns

[`Rect`](Rect.md)

***

### mount()

> **mount**(`parent`, `spec`, `ox?`, `oy?`, `rot?`): [`TextHandle`](TextHandle.md)\<`TSpec`\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:150](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L150)

#### Parameters

##### parent

`Container`

##### spec

`TSpec`

##### ox?

`number`

##### oy?

`number`

##### rot?

`number`

#### Returns

[`TextHandle`](TextHandle.md)\<`TSpec`\>
