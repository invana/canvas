# Function: useStore()

> **useStore**\<`T`, `U`\>(`store`, `selector`, `isEqual?`): `U`

Bind a React component to **one slice** of a kernel [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md) (e.g.
`canvas.store.view`). The component re-renders **only** when the selected slice
changes (by `isEqual`, default `Object.is`) — idle slices cost nothing. Backed by
`useSyncExternalStore` over the kernel's `select` port, so it survives a backend
swap (zustand → Yjs).

**Selector stability (R4).** Pass a **stable** `selector` — a module-scope function
or one wrapped in `useCallback` — and have it return a **referentially-stable**
slice (a sub-object the store keeps identity-stable between unrelated updates, not
a freshly-built object each call). Deriving a new object per call throws
"getSnapshot should be cached"; derive in `useMemo` from a stable slice instead.
For derived slices that legitimately change identity, pass `shallowEqual`.

## Type Parameters

### T

`T`

### U

`U`

## Parameters

### store

[`ReactiveStore`](../../../canvas/src/interfaces/ReactiveStore.md)\<`T`\>

### selector

(`state`) => `U`

### isEqual?

(`a`, `b`) => `boolean`

## Returns

`U`

## Example

```ts
const selectDefinition = (s: CanvasView) => s.definition;   // module scope
const definition = useStore(canvas.store.view, selectDefinition);
```
