# Function: select()

> **select**\<`T`, `U`\>(`store`, `selector`, `isEqual?`): [`Selected`](../interfaces/Selected.md)\<`U`\>

Project a [ReactiveStore](../interfaces/ReactiveStore.md) to one slice, re-notifying **only** when that
slice changes (by `isEqual`). Selector + equality semantics live here — in our
code, not the backend — so they survive a backend swap. The React `useStore`
hook (in `@invana/canvas-react`) binds this to `useSyncExternalStore`.

## Type Parameters

### T

`T`

### U

`U`

## Parameters

### store

[`ReactiveStore`](../interfaces/ReactiveStore.md)\<`T`\>

### selector

(`state`) => `U`

### isEqual?

(`a`, `b`) => `boolean`

## Returns

[`Selected`](../interfaces/Selected.md)\<`U`\>
