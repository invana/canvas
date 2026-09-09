# Type Alias: CustomElementCtor

> **CustomElementCtor** = (...`args`) => `object`

A custom element class, seen from the engine side.

Registering a new shape kind is **irreducibly backend-specific**: a pixi
implementation extends `ShapeBase` and paints into a `Graphics`, a three.js
one would extend something else entirely. So the engine types the constructor
opaquely — it only routes the registration through to the backend, which is
the thing that can give it meaning.

## Parameters

### args

...`never`[]

## Returns

`object`
