# Type Alias: IRouter

> **IRouter** = (`source`, `target`, `opts?`) => `ReadonlyArray`\<[`ShapesPoint`](../interfaces/ShapesPoint.md)\>

Defined in: [packages/canvas/src/renderers/types.ts:332](https://github.com/invana/canvas/blob/b5750d6d305a6431d50bde6b7585da68d85e2544/packages/canvas/src/renderers/types.ts#L332)

A router is a pure function: endpoints in, polyline out. Implementations
never touch pixi — they're trivially testable and re-runnable per frame
(cheap enough for thousands of edges).

## Parameters

### source

[`Endpoint`](../interfaces/Endpoint.md)

### target

[`Endpoint`](../interfaces/Endpoint.md)

### opts?

`Record`\<`string`, `unknown`\>

## Returns

`ReadonlyArray`\<[`ShapesPoint`](../interfaces/ShapesPoint.md)\>
