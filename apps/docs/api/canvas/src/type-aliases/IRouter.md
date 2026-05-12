# Type Alias: IRouter

> **IRouter** = (`source`, `target`, `waypoints?`, `opts?`, `ctx?`) => [`Polyline`](Polyline.md)

Defined in: [packages/canvas/src/primitives/types.ts:124](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L124)

Router: a pure function `(source, target, waypoints?, opts?, ctx?) → Polyline`.

Routers decide path **topology** — where bends sit. They emit a flat
polyline (Point[]); the visual style of segments between bend points is
decided by the downstream `PathStyle`. Routers never touch pixi.

`waypoints` are intermediate user-supplied points the router should respect.
Built-in `straight` passes them through verbatim; topological routers
(orth, manhattan, …) anchor stair / corner segments to them.

`ctx` is optional — only obstacle-aware routers consume it. The renderer
always passes a `RouterCtx`; routers that ignore it lose nothing.

## Parameters

### source

[`Endpoint`](../interfaces/Endpoint.md)

### target

[`Endpoint`](../interfaces/Endpoint.md)

### waypoints?

`ReadonlyArray`\<[`Point`](../interfaces/Point.md)\>

### opts?

`Record`\<`string`, `unknown`\>

### ctx?

[`RouterCtx`](../interfaces/RouterCtx.md)

## Returns

[`Polyline`](Polyline.md)
