# Interface: CanvasConfig

Defined in: canvas/dist/index.d.ts:1993

Per-instance options keyed by id. Each value is the instance's own option bag.

## Properties

### activeLayout?

> `optional` **activeLayout?**: `string`

Defined in: canvas/dist/index.d.ts:2005

Id of the active layout among [layouts](#layouts). A graph runs one at a time.
`Canvas.runLayout(id)` applies it; a domain facade (e.g. `GraphCanvas`)
auto-runs it when the target layer's data changes.

***

### behaviours?

> `optional` **behaviours?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: canvas/dist/index.d.ts:1997

Behaviour options keyed by the behaviour's id.

***

### layers?

> `optional` **layers?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: canvas/dist/index.d.ts:1995

Layer options keyed by the layer's id.

***

### layouts?

> `optional` **layouts?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: canvas/dist/index.d.ts:1999

Layout options keyed by the layout's id.
