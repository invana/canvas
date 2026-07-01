# Event Taxonomy & State-Ownership Migration

> **Status: DESIGN / REFERENCE.** The canonical event catalogue + the
> **`<domain>:<subject>:<action>`** naming scheme for the `@invana/canvas-store`
> event bus, plus the **migration map** that moves *all* state and events out of the
> engine into the kernel — so **`canvas-store` owns the state entirely** and one
> `events.tap(…)` sees the whole stream. Companion to
> [`canvas-state-plan.md`](./canvas-state-plan.md) (the migration phases) and
> `store-owns-state-plan.md` §6 (events-on-the-tap).

---

## 1. The scheme — `<domain>:<subject>:<action>`

Every bus event's `type` is a **three-part, colon-delimited** key, carried in the
structured envelope (`@invana/canvas-store` `CanvasEvent`):

```ts
interface CanvasEvent<P> { type: string; timestamp: number; source: EventSource; payload: P }
// type = `<domain>:<subject>:<action>`   e.g. 'data:node:add', 'view:camera:zoom', 'input:node:click'
```

The `type` **is the query key** — prefix/wildcard match gives you a filter tree:

| query | matches |
|---|---|
| `data:*` | every graph-record mutation |
| `*:node:*` | everything about nodes (input, data, view) |
| `*:*:remove` | every deletion |
| `input:*` | the raw user-action / intent stream (audit + collab op-log) |
| `view:camera:*` | every camera change |

## 2. Domains (6 + collab) — mapped to the unidirectional loop

```
input:* ──► (behaviours) ──► view:* / data:* ──► (renderer) ──► render:*
            scene:* = composition          layout:* = derivation       canvas:* = lifecycle
```

| domain | meaning | `source.kind` | primary consumers |
|---|---|---|---|
| **`input`** | raw user input on elements (*before* any state write) | `behaviour` / `canvas` | behaviours · telemetry (intent) · collab op-log |
| **`view`** | authored config **+** interaction *state* mutations | `store` | rendering · React · telemetry · collab-doc |
| **`data`** | graph record mutations + flush | `data` | rendering (deltas) · telemetry · collab-data channel |
| **`scene`** | registry composition (instance added / enabled / removed) | `canvas` | rendering · devtools |
| **`layout`** | layout *execution* lifecycle | `layout` | telemetry · progress UI |
| **`render`** / **`canvas`** | frame loop + engine lifecycle | `canvas` | telemetry · FPS/devtools |
| **`collab`** (future) | presence + doc sync | `collab` | awareness UI · sync gateway |

## 3. Catalogue — every current event → taxonomy (the event migration map)

Today's 45 ad-hoc names live on **different emitters** (`canvas.events`,
`GraphStore.events`, each behaviour's `.events`, `layer.events`). The taxonomy
re-keys them and the migration routes them **all onto `store.events`**.

```
── INPUT (raw user actions) ─────────────────────────────────────────────
  node:click               → input:node:click
  node:hover               → input:node:hover
  node:drag-start / -end   → input:node:drag:start / input:node:drag:end
  background:contextmenu   → input:background:contextmenu
  preview:show/move/hide   → input:preview:show / :move / :hide

── VIEW (authored state — kernel `store.actions.*` labels become the type) ─
  options:change           → view:config:change            (coarse) + granular ↓
  style:changed            → view:layer:style
  theme:change             → view:theme:change   (+ view:theme:set)
  (layer settings)         → view:layer:add / :update / :setStyle / :setVisible / :remove
  (behaviour settings)     → view:behaviour:add / :enable / :disable / :update / :remove
  (layout settings)        → view:layout:set / :tune / :run / :remove
  camera:pan / camera:zoom → view:camera:pan / :zoom   (+ :set / :reset)
  selection:change         → view:selection:set   (+ :add / :toggle / :clear)
  inspect:change           → view:inspect:change
  view:change              → view:viewmode:change
  (templates)              → view:template:create / :update / :remove

── DATA (graph records) ─────────────────────────────────────────────────
  node:add/update/remove   → data:node:add / :update / :remove
  node:state               → data:node:state
  edge:add/update/remove   → data:edge:add / :update / :remove
  edge:state               → data:edge:state
  edge:orphaned            → data:edge:orphaned
  (groups)                 → data:group:add / :update / :remove
  (annotations)            → data:annotation:add / :update / :remove
  (layout positions)       → data:position:apply
  data:changed / flush     → data:layer:flush            (coarse, per-frame)

── SCENE (registry composition) ─────────────────────────────────────────
  layer:added / removed       → scene:layer:add / :remove
  behaviour:registered        → scene:behaviour:register
  behaviour:enabled/disabled  → scene:behaviour:enable / :disable
  layout:added / removed      → scene:layout:add / :remove

── LAYOUT (execution) ───────────────────────────────────────────────────
  layout:run:start / :end  → layout:run:start / :end   (+ layout:run:tick)

── RENDER / CANVAS (lifecycle) ──────────────────────────────────────────
  renderer:initialised     → canvas:renderer:ready
  start / end / tick        → render:loop:start / :stop / :tick
  message                   → canvas:message:show
```

**Coarse channels stay** alongside the granular types (for "anything changed"
subscribers): `state:change` (any `view` mutation) and `data:layer:flush` (per-frame
delta). The granular `<domain>:<subject>:<action>` types are for filtered subscribers
(telemetry/realtime/query); the coarse ones for the redraw firehose.

> **As-built (renderer-split kernel+seam).** The kernel `CanvasGlobalEvents`
> (`packages/canvas-store/src/events/CanvasEventBus.ts`) is now the **typed
> superset** — `@invana/canvas`'s duplicate event map is folded in and its own
> `events/` bus deleted; the engine emits/subscribes on `store.events`. Newly typed
> on the kernel map: `input:background:click`, `input:camera:pan` /
> `input:camera:zoom` (renderer→orchestrator gesture intent), `tap:dropped`, an
> extended `layout:run:start` / `:end` (adds `nodeCount`/`edgeCount`/`animate` /
> `reason`), `canvas:renderer:ready` (adds `capabilities`), a nullable
> `canvas:message:show` (`text: null` clears; `timeout` auto-clears), and a
> **`@deprecated` `options:change`** bridge (dropped in migration Phase 6). The
> renderer contract that consumes these is `IRenderer` (`src/renderer/IRenderer.ts`).

## 4. State-ownership migration — *state entirely owned by `canvas-store`*

Today state is **scattered**: config in `Canvas.config` (plain object), graph data in
`GraphStore` (its own emitter, **not** on the canvas tap), selection in
`ClickSelectBehaviour`, hover/runtime-state in `GraphStore` presence, camera in
`pixi-viewport`, theme in the `ctx.theme` signal. The migration consolidates **all of
it** into `canvas-store`, and bridges **every** emitter onto `store.events`.

### 4a. Where each piece of state moves

| State (today) | Current owner | `canvas-store` home | Emits (taxonomy) |
|---|---|---|---|
| config — layers/behaviours/layouts opts, `activeLayout` | `Canvas.config` (plain obj) | **`view.definition`** | `view:<subject>:<action>` · `state:change` |
| templates, theme | `GraphLayer` opts / `ctx.theme` | `view.definition.templates` / `.theme` | `view:template:*` · `view:theme:*` |
| node/edge data + payloads | `GraphStore` | **`data` (`LayerData`)** | `data:node:*` · `data:edge:*` |
| positions | `GraphStore` (typed) | `data` (typed-array, internal) | `data:position:apply` · `data:layer:flush` |
| groups / annotations | (new) | `data.groups` / `.annotations` | `data:group:*` · `data:annotation:*` |
| selection set | `ClickSelectBehaviour` map | **`view.interaction.selection`** (D11) | `view:selection:*` |
| hover | `GraphStore` presence | `view.interaction.hover` | `view:hover:*` (+ `input:node:hover`) |
| runtime states (highlighted/selected/…) | `GraphStore` presence (`node:state`) | `view.interaction.states` (D3) | `data:node:state` |
| camera transform | `pixi-viewport` | **`view.interaction.camera`** (abstract) | `view:camera:*` |

After this, **the only state outside `canvas-store` is the renderer's pixi scene
graph** — which is a *projection*, not state.

### 4b. Where each emitter's events get unified

Every scoped emitter becomes a `SourceEmitter` with `setBus(store.events)`, so its
events land on the one tap (this is `store-owns-state-plan` §6):

| Emitter (today) | Events | → bridged onto `store.events` as |
|---|---|---|
| `Canvas.update()` | `options:change` | `view:*` + `state:change` *(M0 already bridges this)* |
| `LayerData` (kernel) | flush delta | `data:layer:flush` + `data:<subject>:<action>` *(built)* |
| `GraphStore.events` | `node:*` `edge:*` `flush` | `data:*` (`source.kind='data'`) |
| `ClickSelectBehaviour.events` | `selection:change` | `view:selection:set` / `input:node:click` |
| `ClickInspect`/`ClickView` | `inspect:change` | `view:inspect:change` |
| `HoverElementPreviewBehaviour` | `preview:*` | `input:preview:*` |
| `DragNodeBehaviour` | `node:drag-*` | `input:node:drag:*` → writes `data:node:update` |
| `GraphLayer.events` | `style:changed` | `view:layer:style` |
| registries (already on bus) | `layer:added`, `behaviour:enabled`, … | `scene:*` |
| renderer / loop | `renderer:initialised`, `tick` | `canvas:renderer:ready`, `render:loop:tick` |

## 5. How the taxonomy powers the three capabilities

- **Telemetry** — `store.events.tap(e)` → bucket by `e.type.split(':')`. Domain counts
  (`data` vs `view` vs `input`), action rates (`*:*:add`), interaction→render latency
  (timestamp deltas across `input:* → view:*/data:* → render:*`). The `type` *is* the
  OTel span/metric name (bounded cardinality — ids ride in `payload`, never the name).
- **Realtime rendering** — the renderer subscribes by prefix: `data:*` (record deltas →
  redraw) + `view:*` (config → restyle), ignores `input:*`/`layout:*`. No "what changed?"
  guessing.
- **Querying / collab** — wildcard filters (`data:node:*`, `*:*:remove`); `input:*` is the
  intent/audit log (the collab op-log); `data:*` payloads stream on the data channel,
  `view:*` on the CRDT doc — the three-channel split keyed by domain.

## 6. Phasing (ties to `canvas-state-plan` §10 M0–M5)

1. **Taxonomy as types** — a typed, augmentable `CanvasGlobalEvents` map keyed by the
   taxonomy strings; per-domain packages augment it. Re-key the kernel's `actions` +
   bridges (`view:*`, `data:*`, the `data:intent` → granular types). *(canvas-store)*
2. **M0–M1** — back `Canvas.config` with `view`; engine consumers read via `store`.
3. **Bridge emitters** — `GraphStore`, behaviour, layer emitters → `SourceEmitter.setBus`
   (§4b) so `data:*` / `input:*` / `view:layer:*` reach the tap.
4. **M2** — fold selection/hover/states/camera into `view.interaction` (§4a) — the last
   state leaves the engine; `canvas-store` owns it entirely.
5. **M4/M5** — telemetry tap + Yjs route by domain (the three-channel split).

## 7. Open questions

1. **2-part fallbacks** — keep coarse `state:change` / `data:layer:flush`, or require all
   subscribers to use granular types? (Lean: keep both — coarse for redraw, granular for filters.)
2. **`input` vs `view` for behaviour writes** — a drag emits `input:node:drag` *and* writes
   `data:node:update`. Emit both (intent + effect)? (Lean: yes — intent for audit, effect for render.)
3. **Wildcard subscription API** — add `events.on('data:node:*', fn)` (prefix match) to the
   bus, or filter in the tap? (Lean: a small prefix matcher on the bus.)
4. **Action label ↔ event type unification** — is `store.actions.layers.setStyle`'s label
   exactly `view:layer:setStyle` (so action label == event type)? (Lean: yes — one string.)

## 8. Relationship to other docs

- [canvas-state-plan.md](./canvas-state-plan.md) — the kernel + migration phases (M0–M5) this feeds.
- [store-owns-state-plan.md](./store-owns-state-plan.md) — §6 events-on-the-tap (the §4b unification).
- [collaborative-state-plan.md](./collaborative-state-plan.md) — the three-channel split keyed by domain.
</content>
