# Abstract Class: PrimitiveBase

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:11](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L11)

Common base for every rendered primitive — shapes, connectors, decorations.
Owns the root `gfx` Container and a default `destroy` that tears it down
along with all children (Pixi removes the destroyed container from its
parent automatically).

Subclasses add Graphics or other display objects as children of `gfx`.

## Extended by

- [`ShapeBase`](ShapeBase.md)
- [`ConnectorBase`](ConnectorBase.md)
- [`ShapeDecorationBase`](ShapeDecorationBase.md)
- [`ConnectorDecorationBase`](ConnectorDecorationBase.md)

## Constructors

### Constructor

> **new PrimitiveBase**(): `PrimitiveBase`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:14](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L14)

#### Returns

`PrimitiveBase`

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:12](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L12)

## Methods

### destroy()

> **destroy**(): `void`

Defined in: [packages/canvas/src/primitives/base/PrimitiveBase.ts:18](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/base/PrimitiveBase.ts#L18)

#### Returns

`void`
