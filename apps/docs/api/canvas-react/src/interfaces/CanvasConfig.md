# Interface: CanvasConfig

Per-instance options keyed by id. Each value is the instance's own option bag.

## Properties

### activeLayout?

> `optional` **activeLayout?**: `string`

Id of the active layout among [layouts](#layouts). A graph runs one at a time.
`Canvas.runLayout(id)` applies it; a domain facade (e.g. `GraphCanvas`)
auto-runs it when the target layer's data changes.

***

### behaviours?

> `optional` **behaviours?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Behaviour options keyed by the behaviour's id.

***

### fitOnLoad?

> `optional` **fitOnLoad?**: `boolean`

Fit the camera to content **once on load**, so the drawing is centred when it
first appears — independent of any layout. The engine fits the union of its
world layers' bounds once, after the viewport has its real size and (when an
[activeLayout](#activelayout) is set) that layout has settled. Default `false`
(opt-in). Init-only: read when the canvas initialises.

***

### layers?

> `optional` **layers?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layer options keyed by the layer's id.

***

### layouts?

> `optional` **layouts?**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layout options keyed by the layout's id.
