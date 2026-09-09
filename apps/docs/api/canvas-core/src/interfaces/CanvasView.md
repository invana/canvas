# Interface: CanvasView

`CanvasView` — the reactive, observable, syncable half of `CanvasStore`: how a
visualisation is **defined**, **viewed**, and its small transient **runtime**
status. Small + human-rate → it lives on a [ReactiveStore](ReactiveStore.md). Bulk data
(nodes/edges/positions) is the **other** half (`CanvasStore.data`, typed-array,
never reactive).

Three compartments, three sync physics (see `docs/canvas-state-plan.md` §9):
- **`definition`** — "what it IS": persisted, converges (a CRDT doc later).
- **`interaction`** — "the live view": ephemeral / per-user (Awareness later).
- **`runtime`** — small observable transient status (layout run, message):
  reactive so UIs can react, but **never synced**.

Per-instance option bags are intentionally loose (`Record<string, unknown>`) at
this layer — the engine and the schema-driven editors give them concrete shape,
and the kernel stays domain-free (it treats element `style` as opaque).

## Properties

### definition

> **definition**: `object`

"What the visualisation IS" — persisted, converged (a CRDT doc later).

#### activeLayout

> **activeLayout**: `string`

Id of the active layout among [layouts](#definition), or `null`.

#### behaviours

> **behaviours**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Behaviour options keyed by instance id. `enabled` is explicit (rule 7).

#### canvas

> **canvas**: [`CanvasSceneOptions`](CanvasSceneOptions.md)

Canvas/scene-level config (background, zoom limits, world bounds, …).

#### layers

> **layers**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layer options keyed by instance id (a rendering layer binds a data source).

#### layouts

> **layouts**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Layout options keyed by instance id.

#### templates

> **templates**: `unknown`[]

Authored node/edge templates (designer output).

#### theme

> **theme**: `Record`\<`string`, `unknown`\>

Theme **config** (registry + active family + mode + accent). The *resolved* theme is derived.

***

### interaction

> **interaction**: `object`

"The live view onto it" — mostly ephemeral / per-user (Awareness later).

#### camera

> **camera**: `CameraTransform`

Abstract camera transform — renderer-agnostic; throttled/ephemeral.

#### focus

> **focus**: `object`

Focal-emphasis: the highlight set + whether the rest is dimmed. O(1) to set;
"muted" is a render-time derivation (`dim && !ids.has(id)`), not a per-node
write (see `canvas-state-plan.md` §7.1B). `null` when no focus is active.

##### focus.dim

> **dim**: `boolean`

##### focus.ids

> **ids**: `ReadonlySet`\<`string`\>

#### hover

> **hover**: `string`

Hovered element id, or `null`.

#### raised

> **raised**: `Record`\<`string`, `ReadonlySet`\<`string`\>\>

Elements lifted above their peers, keyed by the **source** that lifted
them (a behaviour id) — so independent sources (hover, selection, …)
never clobber each other's set, and each can be cleared on its own.

The renderer projects the union of every source onto its own paint order
and lowers anything absent from it. That single projection is what keeps
the lift honest: a raise is *derived from state*, not a side effect, so
it self-corrects when the state that motivated it changes (an element
stops being hovered, a frame opens and becomes a backdrop, …). Before,
each behaviour reparented display objects imperatively and tracked what
it had touched privately — nothing could reconcile them, so a stale lift
outranked the whole scene until that behaviour happened to run again.

Ids only: the kernel stays domain-free. What an id *means* (a frame
lifting its contents instead of itself, say) is the renderer's business.

#### selection

> **selection**: `ReadonlySet`\<`string`\>

The semantic selection set (D11 — owned here, not in a behaviour).

#### states

> **states**: `Record`\<`string`, `ReadonlySet`\<`string`\>\>

Visual state sets (highlighted / context-open / …) keyed by state name (presence overlay).

#### transientPins

> **transientPins**: `ReadonlySet`\<`string`\>

Nodes transiently locked during a drag/resize gesture — held against the
layout for the gesture's duration. **Distinct from data `pinned`** (the
permanent, synced user flag); these are ephemeral and never synced.

#### viewMode

> **viewMode**: `string`

Active interaction mode.

***

### runtime

> **runtime**: `object`

Small observable transient status — reactive (UIs react) but **never synced**.

#### layout

> **layout**: `object`

Layout run status — drives spinners / a stop control.

##### layout.activeId

> **activeId**: `string`

The layout id currently executing, or `null`.

##### layout.animate

> **animate**: `boolean`

Whether the run animates its settle (force sim) vs jumps to final positions.

##### layout.progress

> **progress**: `number`

0..1 progress when known (force `alpha`); `null` for one-shot / unknown.

##### layout.running

> **running**: `boolean`

#### message

> **message**: `string`

Transient overlay/status message, or `null`.
