# Abstract Class: PrimitiveBase

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:11

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

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:14

#### Returns

`PrimitiveBase`

## Properties

### gfx

> `readonly` **gfx**: `Container`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:12

## Methods

### destroy()

> **destroy**(): `void`

Defined in: packages/canvas/src/primitives/base/PrimitiveBase.ts:18

#### Returns

`void`
