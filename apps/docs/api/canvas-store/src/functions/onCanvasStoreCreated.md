# Function: onCanvasStoreCreated()

> **onCanvasStoreCreated**(`observer`): () => `void`

Register a global observer fired for **every** [CanvasStore](../interfaces/CanvasStore.md) created via
[createCanvasStore](createCanvasStore.md) — regardless of how the `Canvas` was constructed
(imperative `new Canvas()`, `<Canvas>`/`GraphCanvasApp`, or a bare
`createCanvasStore()`). The one central seam for cross-cutting instrumentation.

Opt-in (nothing runs until you register): production is unaffected. The intended
use is dev/observability — e.g. Storybook wires a tracer to *every* story's bus
in one place:

```ts
onCanvasStoreCreated((store) => createTapTracer(store.events, getTracer()));
```

## Parameters

### observer

[`CanvasStoreObserver`](../type-aliases/CanvasStoreObserver.md)

## Returns

an unsubscribe function.

() => `void`
