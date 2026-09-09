# Function: useCanvasEvent()

> **useCanvasEvent**\<`E`\>(`event`, `handler`, `canvas?`): `void`

Subscribe to a typed canvas-wide event (`camera:zoom`, `camera:pan`,
`layer:added`, …) for the lifetime of the calling component. Fully typed off
the engine's exported [CanvasGlobalEvents](../../../canvas/src/interfaces/CanvasGlobalEvents.md) map.

The handler is held in a ref so changing it between renders does **not** tear
down and re-create the subscription; only a change of the resolved `canvas`
(or the `event` name) does. That keeps subscriptions stable and — because the
effect is keyed on the resolved instance — correct across multiple canvases.

## Type Parameters

### E

`E` *extends* keyof [`CanvasGlobalEvents`](../../../canvas/src/interfaces/CanvasGlobalEvents.md)

## Parameters

### event

`E`

Event name from [CanvasGlobalEvents](../../../canvas/src/interfaces/CanvasGlobalEvents.md).

### handler

(`payload`) => `void`

Fired with the event payload.

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

`void`
