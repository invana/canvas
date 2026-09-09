# Abstract Class: PrimitiveBase

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

#### Returns

`PrimitiveBase`

## Properties

### gfx

> `readonly` **gfx**: `Container`

## Methods

### destroy()

> **destroy**(): `void`

#### Returns

`void`
