# Interface: CreateLayerStoreOptions

Defined in: [packages/canvas/src/state/Store.ts:100](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/Store.ts#L100)

## Properties

### enableDevtools?

> `optional` **enableDevtools?**: `boolean`

Defined in: [packages/canvas/src/state/Store.ts:112](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/Store.ts#L112)

Force devtools on/off. Default: enabled when `process.env.NODE_ENV !== 'production'`.
High-frequency mutation sites can pass `enableDevtools: false` per-store
to avoid devtools serialisation cost in dev too.

***

### name?

> `optional` **name?**: `string`

Defined in: [packages/canvas/src/state/Store.ts:105](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/state/Store.ts#L105)

Devtools display name. Used as the "store" name in Redux DevTools.
Convention: `<ClassName>:<id>` (e.g. `'GraphLayer:graph-1'`).
