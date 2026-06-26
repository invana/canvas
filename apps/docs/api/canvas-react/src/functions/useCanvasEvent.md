# Function: useCanvasEvent()

> **useCanvasEvent**\<`E`\>(`event`, `handler`, `canvas?`): `void`

Defined in: [canvas-react/src/hooks/useCanvasEvent.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCanvasEvent.ts#L20)

Subscribe to a typed canvas-wide event (`camera:zoom`, `camera:pan`,
`layer:added`, …) for the lifetime of the calling component. Fully typed off
the engine's exported CanvasGlobalEvents map.

The handler is held in a ref so changing it between renders does **not** tear
down and re-create the subscription; only a change of the resolved `canvas`
(or the `event` name) does. That keeps subscriptions stable and — because the
effect is keyed on the resolved instance — correct across multiple canvases.

## Type Parameters

### E

`E` *extends* keyof `CanvasGlobalEvents`

## Parameters

### event

`E`

Event name from CanvasGlobalEvents.

### handler

(`payload`) => `void`

Fired with the event payload.

### canvas?

`Canvas`

Optional explicit instance; defaults to the context canvas.

## Returns

`void`
