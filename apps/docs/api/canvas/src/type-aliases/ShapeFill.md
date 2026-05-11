# Type Alias: ShapeFill

> **ShapeFill** = `number` \| [`ShapeFillLayer`](ShapeFillLayer.md) \| `ReadonlyArray`\<[`ShapeFillLayer`](ShapeFillLayer.md)\>

Defined in: [packages/canvas/src/primitives/types.ts:283](https://github.com/invana/canvas/blob/6a7a4e112d472abded99af8343d8e343f181d637/packages/canvas/src/primitives/types.ts#L283)

A shape's fill. Either a single layer, an array of layers (painted
bottom-up — first array entry sits underneath), or the `number` shorthand
for a solid color.
