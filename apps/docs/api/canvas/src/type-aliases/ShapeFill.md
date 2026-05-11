# Type Alias: ShapeFill

> **ShapeFill** = `number` \| [`ShapeFillLayer`](ShapeFillLayer.md) \| `ReadonlyArray`\<[`ShapeFillLayer`](ShapeFillLayer.md)\>

Defined in: [packages/canvas/src/primitives/types.ts:283](https://github.com/invana/canvas/blob/fb7f42e39d0dedbf8d9472a5a1f5ae0c776661da/packages/canvas/src/primitives/types.ts#L283)

A shape's fill. Either a single layer, an array of layers (painted
bottom-up — first array entry sits underneath), or the `number` shorthand
for a solid color.
