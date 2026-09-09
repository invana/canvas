# Interface: CanvasGlobalEvents

The canvas-wide event map. Consumers (engine, domain) **augment** this via
declaration merging — `declare module '@invana/canvas-core' { interface
CanvasGlobalEvents { 'shape:click': … } }` — so new events are typed without
touching the core.

## Properties

### canvas:message:show

> **canvas:message:show**: `object`

The shared status-message channel. `text: null` clears; `timeout` (ms) auto-clears.

#### text

> **text**: `string`

#### timeout?

> `optional` **timeout?**: `number`

***

### canvas:renderer:fallback

> **canvas:renderer:fallback**: `object`

The active renderer crashed at **render time** and the engine has halted its
render loop. Emitted once (experimental WebGPU only — see
`CanvasOptions.preference`); the consumer should tear the canvas down and
re-init on `to` (WebGL). `reason` is a short diagnostic tag.

#### from

> **from**: `string`

#### reason?

> `optional` **reason?**: `string`

#### to

> **to**: `string`

***

### canvas:renderer:ready

> **canvas:renderer:ready**: `object`

#### backend

> **backend**: `string`

#### capabilities?

> `optional` **capabilities?**: `Record`\<`string`, `unknown`\>

***

### data:flush

> **data:flush**: `object`

A `layer` data flush (nodes/edges/groups/annotations delta), bridged onto the bus.

#### delta

> **delta**: [`LayerFlush`](LayerFlush.md)

#### layerId

> **layerId**: `string`

***

### data:intent

> **data:intent**: `object`

A named data **intent** — one per data action (audit / collab), distinct from the per-frame flush.

#### action

> **action**: `string`

#### ids

> **ids**: readonly `string`[]

#### layerId

> **layerId**: `string`

***

### input:background:click

> **input:background:click**: `object`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### input:background:contextmenu

> **input:background:contextmenu**: `object`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### input:camera:pan

> **input:camera:pan**: `object`

A pan **gesture** reported by the renderer (drag / keyboard / inertia) —
gesture *intent*, distinct from the resulting `view.interaction.camera` change
(a `state:change`). `x`/`y` are the world-origin offset the camera settled on.

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### input:camera:zoom

> **input:camera:zoom**: `object`

A zoom **gesture** reported by the renderer (wheel / pinch). `scale` is the resolved uniform zoom; `center*` the screen pivot.

#### centerX

> **centerX**: `number`

#### centerY

> **centerY**: `number`

#### scale

> **scale**: `number`

***

### input:node:click

> **input:node:click**: `object`

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### input:node:drag:end

> **input:node:drag:end**: `object`

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

***

### input:node:drag:start

> **input:node:drag:start**: `object`

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

***

### input:node:hover

> **input:node:hover**: `object`

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

***

### layout:run:end

> **layout:run:end**: `object`

A layout run ended. `reason` distinguishes a natural settle from an external stop / abort.

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

#### reason?

> `optional` **reason?**: `"settled"` \| `"stopped"` \| `"cancelled"`

***

### layout:run:start

> **layout:run:start**: `object`

A layout run started. `nodeCount`/`edgeCount`/`animate` describe the run when the producer knows them.

#### animate?

> `optional` **animate?**: `boolean`

#### edgeCount?

> `optional` **edgeCount?**: `number`

#### id

> **id**: `string`

#### layerId

> **layerId**: `string`

#### nodeCount?

> `optional` **nodeCount?**: `number`

***

### layout:run:tick

> **layout:run:tick**: `object`

#### id

> **id**: `string`

#### progress?

> `optional` **progress?**: `number`

***

### render:loop:tick

> **render:loop:tick**: [`FrameTick`](../../../canvas-store/src/interfaces/FrameTick.md)

One measured engine frame — emitted once per `Canvas.tickOnce`. Carries the
inter-frame period, per-phase CPU breakdown, and the attributed
[InteractionKind](../../../canvas-store/src/type-aliases/InteractionKind.md), so a tap can drive an FPS trace + attribute dips to
the gesture that caused them. See [FrameTick](../../../canvas-store/src/interfaces/FrameTick.md).

***

### scene:behaviour:disable

> **scene:behaviour:disable**: `object`

#### id

> **id**: `string`

***

### scene:behaviour:enable

> **scene:behaviour:enable**: `object`

#### id

> **id**: `string`

***

### scene:behaviour:register

> **scene:behaviour:register**: `object`

#### id

> **id**: `string`

***

### scene:layer:add

> **scene:layer:add**: `object`

#### id

> **id**: `string`

***

### scene:layer:remove

> **scene:layer:remove**: `object`

#### id

> **id**: `string`

***

### scene:layer:visibilitychange

> **scene:layer:visibilitychange**: `object`

A layer's whole-layer `visible` flag changed via `Layer.setVisible`. Lets
dependent layers (e.g. a `MiniMapLayer` mirroring a source graph) react
without polling. `visible` is the post-change value.

#### id

> **id**: `string`

#### visible

> **visible**: `boolean`

***

### scene:layout:add

> **scene:layout:add**: `object`

#### id

> **id**: `string`

***

### scene:layout:remove

> **scene:layout:remove**: `object`

#### id

> **id**: `string`

***

### specs:flush

> **specs:flush**: `object`

One layer's coalesced **spec** changes — the visual description, ids only.
Domain-free by construction: a renderer subscribes to this and never learns
what a node or an edge is. See `docs/renderer-split-design.md` §4.2b.

#### delta

> **delta**: `SpecFlush`

#### layerId

> **layerId**: `string`

***

### state:change

> **state:change**: `object`

A `view`-store mutation, bridged onto the bus (see `createCanvasStore`).
`durationMs` is the update's produce+commit wall-clock cost, when the store
reports it — so a tap can attribute time without a separate telemetry sink.

#### action?

> `optional` **action?**: `string`

#### changedPaths

> **changedPaths**: `string`[]

#### durationMs?

> `optional` **durationMs?**: `number`

***

### tap:dropped

> **tap:dropped**: `object`

A tap dropped an event (filtered or sampled out) — diagnostic.

#### reason

> **reason**: `"excluded"` \| `"sampled"`

#### type

> **type**: `string`

***

### theme:change

> **theme:change**: [`ResolvedTheme`](ResolvedTheme.md)
