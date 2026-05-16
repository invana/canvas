# Type Alias: ShapeFill

> **ShapeFill** = `number` \| [`ShapeFillLayer`](ShapeFillLayer.md) \| `ReadonlyArray`\<[`ShapeFillLayer`](ShapeFillLayer.md)\>

Defined in: [canvas/src/primitives/types.ts:253](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/canvas/src/primitives/types.ts#L253)

A shape's fill. Either a single layer, an array of layers (painted
bottom-up — first array entry sits underneath), or the `number` shorthand
for a solid color.
