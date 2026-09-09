# Type Alias: DeepPartial\<T\>

> **DeepPartial**\<`T`\> = `T` *extends* `Primitive` ? `T` : `T` *extends* `ReadonlySet`\<`unknown`\> ? `T` : `T` *extends* `ReadonlyMap`\<`unknown`, `unknown`\> ? `T` : `T` *extends* `ReadonlyArray`\<`unknown`\> ? `T` : `T` *extends* (...`args`) => `unknown` ? `T` : `{ [K in keyof T]?: DeepPartial<T[K]> }`

Deep-partial that **stops at** sets / maps / arrays / functions — those are
replaced wholesale, matching the runtime deep-merge (and `CanvasConfig`'s
shallow-replace semantics). So `{ interaction: { selection: newSet } }` swaps
the set rather than trying to partial-merge its internals.

## Type Parameters

### T

`T`
