# Type Alias: IRouter

> **IRouter** = (`source`, `target`, `waypoints?`, `opts?`) => [`Path`](Path.md)

Defined in: packages/canvas/src/primitives/types.ts:72

Router: a pure function `(source, target, waypoints?, opts?) → Path`.
Routers never touch pixi; trivially testable.

`waypoints` is reserved for a future phase (the macro plan's Phase 5);
v0 routers accept the parameter but may ignore it.

## Parameters

### source

[`Endpoint`](../interfaces/Endpoint.md)

### target

[`Endpoint`](../interfaces/Endpoint.md)

### waypoints?

`ReadonlyArray`\<[`Point`](../interfaces/Point.md)\>

### opts?

`Record`\<`string`, `unknown`\>

## Returns

[`Path`](Path.md)
