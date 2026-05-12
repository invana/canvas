# Event Surface — Audit & Recommendation

## Context

For the rewritten architecture, this audit identifies the events emitted today, the missing ones, and **where each one should live**. The work led to a design change vs. `architecture-proposal.md` §2.6 — pointer events collapse from a three-tier model (DOM → renderer events → layer events) into a two-tier model (DOM → layer events), with the renderer providing `hitTest()` as a pure service. Rationale below.

This is a design document; implementation is a follow-up PR.

---

## Updated event model — two-tier (revises proposal §2.6)

```
DOM pointer events
        │
        ▼
Canvas dispatcher:
  - runs PrimitivesRenderer.hitTest(world) once per DOM event
  - cascades top-down through hittable layers by z-order
  - dispatches to the topmost layer that claims the hit
  - if no hit: emits viewport:* on canvas.events
        │
        ▼
Layer.onPointer*(hit, domEvent) template methods
  Domain layers override these and emit semantic events
        │
        ▼
layer.events                ← single, semantic event per interaction
  node:click, edge:hover, selection:changed (GraphLayer)
  table:click, column:click (future ERDiagramLayer)
```

### Why two-tier instead of three

The original three-tier proposal had `PrimitivesRenderer.events` emit `shape:click` / `connector:click`, with the layer translating to `node:click` etc. The renderer events were also declared **private to the owning layer**. Net effect: two emits per physical interaction, where the first is private and the second is the only one consumers actually subscribe to.

Collapsing it removes the redundancy:
- One emit per physical event
- Renderer's job is rendering + hit-testing, not eventing
- Aligns with the "Domain-Free Primitives Rule" — primitive renderer is a pure geometric service
- Tap channel surface is smaller and naturally clean
- Behaviours already subscribe to `layer.events` per proposal §2.6 — no behaviour change

Cost: `Layer` base class gains a small input-dispatch scaffold (~7 template methods). Canvas gains a pointer dispatcher.

---

## Where each event lives

| Event nature | Surface | Package |
|---|---|---|
| Canvas-wide lifecycle (registries) | `canvas.events` | `@invana/canvas` |
| **Camera** state changes (pan, zoom — transform state) | `canvas.events` (`camera:*`) | `@invana/canvas` |
| **Viewport** events (DOM surface — resize, no-hit pointer events) | `canvas.events` (`viewport:*`) | `@invana/canvas` |
| Per-layer render lifecycle (`render:start` / `render:end`) | `layer.events` | `@invana/canvas` |
| Whole-frame render lifecycle (`frame:rendered`) | `canvas.events` | `@invana/canvas` |
| Layer pointer events (semantic) | `layer.events` of the owning layer | the domain package (`@invana/graph` etc.) |
| Optional / derived / instrumented | opt-in behaviour | `@invana/canvas` for generic; domain package for domain-specific |

### Camera ≠ Viewport — naming discipline

The two are related but distinct concepts. Keep their event namespaces separate:

| Concept | What it is | Events |
|---|---|---|
| **Camera** | Transform state — pan offset, zoom scale, the world↔screen projection | `camera:pan`, `camera:zoom` |
| **Viewport** | The DOM surface — its width/height and the pointer/keyboard events landing on it | `viewport:resized`, `viewport:click`, `viewport:doubleclick`, `viewport:contextmenu`, `viewport:cursor:move` |

The camera doesn't get clicked or resized — the viewport does. `camera:zoom` means "camera's zoom-scale state changed"; `viewport:resized` means "the DOM rect we render into changed size." Don't conflate them.

---

## Inventory — what's there today

### `canvas.events`
- `renderer:initialised` {backend, capabilities} ✅
- `layer:added` {id} ✅ *(rename → `layer:registered`)*
- `layer:removed` {id} ✅ *(rename → `layer:deregistered`)*
- `behaviour:registered` / `behaviour:enabled` / `behaviour:disabled` ✅
- `camera:zoom` {scale, centerX, centerY} ✅
- `camera:pan` {x, y} ✅
- `background:click` — declared, **never emitted** (stub)

### `PrimitivesRenderer.events`
- `shape:pointerover/out/down/up/click` + `connector:*` ✅

**→ These get removed.** Renderer becomes silent; exposes `hitTest()` instead.

### `layer.events`
- Base infra exists; no domain events emit yet (`@invana/graph` is skeleton).

### Missing
Layout lifecycle, behaviour deregister, layer visibility/zindex/hittable changes, viewport resize, cursor tracking, double-click, right-click, drag stream, viewport-click (no-hit), layer pointer events, per-layer render lifecycle, whole-frame rendered.

---

## Final event catalogue

### Locked-in decisions
1. **Lifecycle verb:** `registered` / `deregistered` across both layers and behaviours.
2. **Drag detection:** behaviours, not renderer. Behaviours synthesise drag from `pointerdown/move/up` on their target layer.
3. **Cursor tracking:** opt-in `CursorTrackBehaviour`, emits `viewport:cursor:move` (default-excluded from tap).
4. **Pointer events:** renderer is silent; layer template methods emit semantic events directly.
5. **Camera vs viewport split:** `camera:*` only for transform state changes; `viewport:*` for DOM surface events (resize, no-hit pointer events, cursor track).
6. **`BackgroundLayer` default `hittable: false`** — clicks pass through to `viewport:click`. Flip to `hittable: true` if you want the layer to claim its own clicks via `backgroundLayer.events.on('click', …)`.

### `canvas.events` — emitted inline by core classes

Lifecycle (cheap, intrinsic — emit inline, no behaviour wrapping):
- `renderer:initialised` {backend, capabilities}
- `layer:registered` {id}
- `layer:deregistered` {id}
- `layer:visibility:changed` {id, visible}
- `layer:zindex:changed` {id, zIndex}
- `layer:hittable:changed` {id, hittable}
- `layer:reordered` {order: string[]}
- `behaviour:registered` {id}
- `behaviour:enabled` {id}
- `behaviour:disabled` {id}
- `behaviour:deregistered` {id}
- `behaviour:shortcut:conflict` {aId, bId, shortcut}

Camera — transform state only (cheap, intrinsic):
- `camera:pan` {x, y}
- `camera:zoom` {scale, centerX, centerY}

Viewport — DOM surface (cheap, intrinsic; pointer events fire only when no layer claims the hit):
- `viewport:resized` {width, height}
- `viewport:click` {worldX, worldY, screenX, screenY, button, modifiers}
- `viewport:contextmenu` {worldX, worldY, screenX, screenY, modifiers}
- `viewport:doubleclick` {worldX, worldY, screenX, screenY, modifiers} *(synthesised by dispatcher's click recognizer)*

Whole-frame render lifecycle (default-excluded from tap):
- `frame:rendered` {durationMs, layersRendered} — emitted after `surfaces.render()` each tick

### `canvas.events` — emitted by opt-in behaviours (`@invana/canvas`)

| Behaviour | Emits | Reads |
|---|---|---|
| `CursorTrackBehaviour` | `viewport:cursor:move` {worldX, worldY, screenX, screenY} | DOM `pointermove` on canvas element |
| `LayoutInstrumentationBehaviour` | `layout:start` {layoutId, layerId}, `layout:end` {layoutId, layerId, durationMs} | wraps `Layout.apply()` |

### `layer.events` — per-layer render lifecycle (emitted by `Canvas.tick` on each layer's events)

These fire on **every layer's `events`** as the canvas tick walks layers in z-order. Default-excluded from tap (high-frequency).
- `render:start` {dirtyCount}
- `render:end` {durationMs, dirtyCount}

### `layer.events` — semantic events emitted by Layer's template-method overrides (in domain package)

For `@invana/graph` (`GraphLayer`):
- `node:pointerover` / `node:pointerout` / `node:pointerdown` / `node:pointerup` / `node:pointermove`
- `node:click` / `node:doubleclick` / `node:contextmenu`
- `node:dragstart` / `node:drag` / `node:dragend` *(emitted by `DragNodeBehaviour`, which synthesises from pointerdown/move/up)*
- `edge:pointerover/out/down/up/move`
- `edge:click/doubleclick/contextmenu`
- `selection:changed` {added, removed, selected}
- `viewport:fitcontent`
- `data:changed` {addedNodes, removedNodes, addedEdges, removedEdges}

For a future `ERDiagramLayer`: same pattern but `table:click`, `column:click`, `relationship:hover`, etc.

Payloads on pointer events include `worldX`, `worldY`, `screenX`, `screenY`, `button`, modifiers (`shift/ctrl/alt/meta`), `pointerId`, and the resolved domain object (`node` / `edge` / etc.).

---

## How Layer dispatch works

`Layer` base class adds these template methods (default no-op):

```ts
abstract class Layer {
  // called by Canvas dispatcher when this layer is the topmost hittable layer
  // that claims a hit at the given world point.
  onPointerOver(hit: HitResult, e: PointerEvent): void;
  onPointerOut (hit: HitResult, e: PointerEvent): void;
  onPointerDown(hit: HitResult, e: PointerEvent): void;
  onPointerUp  (hit: HitResult, e: PointerEvent): void;
  onPointerMove(hit: HitResult, e: PointerEvent): void;

  // synthesised by Layer base from down/up + timing — subclasses override
  // to emit semantic events:
  onClick      (hit: HitResult, e: PointerEvent): void;
  onDoubleClick(hit: HitResult, e: PointerEvent): void;
  onContextMenu(hit: HitResult, e: PointerEvent): void;
}
```

`GraphLayer` overrides these and emits `node:click`, `edge:click`, etc. on `this.events`. No `shape:click` ever exists.

Viewport dispatch lives entirely in `Canvas` — when the top-down hit-test cascade returns null, `Canvas` emits `viewport:click` / `viewport:contextmenu` / `viewport:doubleclick` directly on `canvas.events`. No behaviour required.

### `BackgroundLayer` vs `viewport:*` — two different concepts

| Scenario | What fires |
|---|---|
| `BackgroundLayer` has `hittable: true` and the user clicks it | `backgroundLayer.events.emit('click', …)` — normal layer template-method pipeline, nothing special |
| No layer claims the hit (every `hittable: true` layer's `hitTest` returned null, e.g. clicking empty space with a non-hittable background) | `canvas.events.emit('viewport:click', …)` |

**Default `BackgroundLayer` is `hittable: false`** because it's decorative — clicks should pass through to `viewport:click` so app code can treat "clicked empty area" as one event regardless of which BG pattern is active.

---

## Critical files to modify / add

### Core class changes
- `packages/canvas/src/events/CanvasEvent.ts` — add `viewport:cursor:move`, `render:start`, `render:end`, `frame:rendered` to `DEFAULT_TAP_EXCLUDE`
- `packages/canvas/src/events/CanvasEventBus.ts` — extend type map with all new `canvas.events` listed above
- `packages/canvas/src/registries/LayerRegistry.ts` — rename emits to `registered`/`deregistered`; emit `layer:reordered`
- `packages/canvas/src/registries/BehaviourRegistry.ts` — emit `behaviour:deregistered`, `behaviour:shortcut:conflict`
- `packages/canvas/src/layers/Layer.ts` — add the seven `onPointer*` / `onClick` / `onDoubleClick` / `onContextMenu` template methods + visibility/zIndex/hittable setters that emit
- `packages/canvas/src/layers/BackgroundLayer.ts` — set default `hittable: false`
- `packages/canvas/src/camera/Camera.ts` — no resize event here (lives on viewport)
- `packages/canvas/src/engine/Canvas.ts` — wire ResizeObserver → `viewport:resized`; **new pointer dispatcher**: attach DOM listeners, run cross-layer hit-test cascade, dispatch to topmost hittable layer's `onPointer*`, or emit `viewport:click` / `viewport:contextmenu` / `viewport:doubleclick` on miss; include click/double-click/context-menu recognizer; per-layer `render:start` / `render:end` + `frame:rendered` emits around the tick
- `packages/canvas/src/primitives/PrimitivesRenderer.ts` + `primitives/types.ts` — **remove** `PrimitivesRendererEventMap` pointer events; `hitTest(world)` becomes the public surface (already exists, just elevate it). Keep render lifecycle events if any.
- `packages/canvas/src/layouts/Layout.ts` — no inline emits; `LayoutInstrumentationBehaviour` does the wrapping

### New built-in behaviours (`@invana/canvas`, all opt-in)
- `packages/canvas/src/behaviours/CursorTrackBehaviour.ts`
- `packages/canvas/src/behaviours/LayoutInstrumentationBehaviour.ts`

### Domain layer changes (`@invana/graph`, future)
- `packages/graph/src/layers/GraphLayer.ts` — override `onPointer*` / `onClick` / `onDoubleClick` / `onContextMenu`, resolve hit's `id` → node vs. edge, emit `node:*` / `edge:*` on `this.events`
- `packages/graph/src/behaviours/DragNodeBehaviour.ts` — synthesise `node:dragstart/drag/dragend` from `node:pointerdown/move/up`

### Architecture proposal update
- `architecture-proposal.md` §2.6 — revise three-tier diagram → two-tier; update "End-to-end: hover triggers a halo" walkthrough; update §4 table (`Behaviours emit on global canvas.events` row); reflect that renderer has no event surface for pointers

---

## Verification

- `pnpm --filter @invana/canvas check-types` — clean.
- Storybook story `events-tap-demo`: subscribes `canvas.events.tap(...)` and dumps every envelope into `DevInfoLayer`. Trigger each lifecycle / camera / background-pointer event manually; confirm fires.
- Storybook story `cursor-track-demo`: registers + enables `CursorTrackBehaviour`, listens to `viewport:cursor:move`, shows live world coords. Disabling the behaviour stops the events.
- Storybook story `frame-timing-demo`: subscribes to `frame:rendered` and `graphLayer.events.on('render:end', …)`, shows per-tick + per-layer render durations in `DevInfoLayer`.
- Once `@invana/graph` lands: a story that subscribes `graphLayer.events.on('node:click', …)`; confirm one and only one emit per click; confirm no `shape:click` event exists on any surface.
- No tests in `packages/canvas` (per project rule).

---

## Out of scope

- Implementing the events themselves — follow-up PR.
- Telemetry sinks (Datadog, etc.) — `tap()` is the integration point; sinks are app-level.
- Renderer-level drag synthesis — explicitly rejected.
- Renderer-level pointer events — explicitly rejected (this plan's main change).
