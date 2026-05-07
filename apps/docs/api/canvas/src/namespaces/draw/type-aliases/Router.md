# Type Alias: Router

> **Router** = (`source`, `target`, `opts?`) => `ReadonlyArray`\<[`Point`](../interfaces/Point.md)\>

Defined in: [packages/canvas/src/renderers/draw/types.ts:165](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/draw/types.ts#L165)

A router is a pure function — endpoints in, polyline out. Routers never
touch pixi; trivially testable and re-runnable per frame.

## Parameters

### source

[`Endpoint`](../interfaces/Endpoint.md)

### target

[`Endpoint`](../interfaces/Endpoint.md)

### opts?

`Record`\<`string`, `unknown`\>

## Returns

`ReadonlyArray`\<[`Point`](../interfaces/Point.md)\>
