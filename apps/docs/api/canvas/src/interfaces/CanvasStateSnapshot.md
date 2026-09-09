# Interface: CanvasStateSnapshot

The full, self-contained JSON document describing a canvas — everything a
fresh (structurally identical) canvas needs to re-render the same scene:

- **`view.definition`** — "what it IS": scene options, layer/behaviour/layout
  options, `activeLayout`, authored templates, theme config. (styling lives
  inside the per-layer options + templates.)
- **`view.interaction`** — "the live view": selection, hover, camera, focus,
  view states, view mode.
- **`data`** — each data-owning layer's bulk records (nodes/edges with
  positions), keyed by layer id.

Serialise with [exportCanvasState](../functions/exportCanvasState.md); restore with [importCanvasState](../functions/importCanvasState.md).
`runtime` (transient layout/message status) is intentionally omitted — it is
never persisted.

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Per-layer bulk data keyed by layer id (only layers that implement [DataSerializableLayer](DataSerializableLayer.md)).

***

### version

> **version**: `number`

Envelope schema version — see [CANVAS\_STATE\_VERSION](../variables/CANVAS_STATE_VERSION.md).

***

### view

> **view**: `object`

#### definition

> **definition**: `object`

##### definition.activeLayout

> **activeLayout**: `string`

Id of the active layout among [layouts](#view), or `null`.

##### definition.behaviours

> **behaviours**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Behaviour options keyed by instance id. `enabled` is explicit (rule 7).

##### definition.canvas

> **canvas**: [`CanvasSceneOptions`](../../../canvas-store/src/interfaces/CanvasSceneOptions.md)

Canvas/scene-level config (background, zoom limits, world bounds, …).

##### definition.layers

> **layers**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layer options keyed by instance id (a rendering layer binds a data source).

##### definition.layouts

> **layouts**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layout options keyed by instance id.

##### definition.templates

> **templates**: `unknown`[]

Authored node/edge templates (designer output).

##### definition.theme

> **theme**: `Record`\<`string`, `unknown`\>

Theme **config** (registry + active family + mode + accent). The *resolved* theme is derived.

#### interaction

> **interaction**: [`CanvasInteractionSnapshot`](CanvasInteractionSnapshot.md)
