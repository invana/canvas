# Interface: CanvasConfig

Defined in: [canvas/src/engine/CanvasConfig.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L14)

Per-instance options keyed by id. Each value is the instance's own option bag.

## Properties

### activeLayout?

> `optional` **activeLayout?**: `string`

Defined in: [canvas/src/engine/CanvasConfig.ts:26](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L26)

Id of the active layout among [layouts](#layouts). A graph runs one at a time.
`Canvas.runLayout(id)` applies it; a domain facade (e.g. `GraphCanvas`)
auto-runs it when the target layer's data changes.

***

### behaviours?

> `optional` **behaviours?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/engine/CanvasConfig.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L18)

Behaviour options keyed by the behaviour's id.

***

### layers?

> `optional` **layers?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/engine/CanvasConfig.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L16)

Layer options keyed by the layer's id.

***

### layouts?

> `optional` **layouts?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [canvas/src/engine/CanvasConfig.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/engine/CanvasConfig.ts#L20)

Layout options keyed by the layout's id.
