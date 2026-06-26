# Type Alias: ShapeFill

> **ShapeFill** = `number` \| [`ShapeFillLayer`](ShapeFillLayer.md) \| `ReadonlyArray`\<[`ShapeFillLayer`](ShapeFillLayer.md)\>

Defined in: [canvas/src/primitives/types.ts:297](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L297)

A shape's fill. Either a single layer, an array of layers (painted
bottom-up — first array entry sits underneath), or the `number` shorthand
for a solid color.
