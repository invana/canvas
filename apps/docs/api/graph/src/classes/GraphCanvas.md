# Class: GraphCanvas

## Extends

- `Canvas`

## Constructors

### Constructor

> **new GraphCanvas**(`opts?`): `GraphCanvas`

#### Parameters

##### opts?

`CanvasOptions`

#### Returns

`GraphCanvas`

#### Inherited from

`Canvas.constructor`

## Properties

### behaviours

> `readonly` **behaviours**: [`BehaviourRegistry`](../../../canvas/src/classes/BehaviourRegistry.md)

#### Inherited from

`Canvas.behaviours`

***

### camera

> **camera**: [`Camera`](../../../canvas/src/classes/Camera.md)

#### Inherited from

`Canvas.camera`

***

### context

> **context**: [`CanvasContext`](../../../canvas/src/interfaces/CanvasContext.md)

#### Inherited from

`Canvas.context`

***

### events

> `readonly` **events**: [`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

Public surface — populated by `init()` / `initWithRenderer()`. Accessing
before init throws (definite-assignment via `!`). Use `isInitialised`
to guard if needed.

#### Inherited from

`Canvas.events`

***

### gestures

> `readonly` **gestures**: [`GestureArbiter`](../../../canvas/src/interfaces/GestureArbiter.md)

Pointer-gesture arbitration for this canvas — see `input/GestureArbiter.ts`.
Built in the constructor (no dependency on the scene graph) so it is live
before any behaviour registers, and handed to every participant as
`ctx.gestures`.

#### Inherited from

`Canvas.gestures`

***

### id

> `readonly` **id**: `string`

#### Inherited from

`Canvas.id`

***

### layers

> `readonly` **layers**: [`LayerRegistry`](../../../canvas/src/classes/LayerRegistry.md)

#### Inherited from

`Canvas.layers`

***

### layouts

> `readonly` **layouts**: [`LayoutRegistry`](../../../canvas/src/classes/LayoutRegistry.md)

#### Inherited from

`Canvas.layouts`

***

### options

> `readonly` **options**: `CanvasOptions`

#### Inherited from

`Canvas.options`

***

### store

> `readonly` **store**: [`CanvasStore`](../../../canvas-store/src/interfaces/CanvasStore.md)

The renderer-free kernel (`@invana/canvas-store`) — the observable truth this
engine projects. **`store.view.definition` is the single source of truth for
serialisable config**: [update](#update) writes it and [get](#get) reads it (no
parallel `this.config`). Readers subscribe to slices via `useStore`/`select`.

The store owns `view`, `data`, `events` (the one canvas-wide bus — [events](#events)
*is* `store.events`), `theme`, and `history`.

#### Inherited from

`Canvas.store`

## Accessors

### currentMessage

#### Get Signature

> **get** **currentMessage**(): `string`

The message currently on the channel, or `null` when idle. Stored so a
status surface that subscribes *after* a message was pushed (e.g. a footer
`CanvasMessageBar` mounting once the engine is ready) can show the current
line instead of missing the one-shot `message` event. Note: a `timeout`ed
message is auto-cleared by the displaying surface, not the engine, so this
keeps reporting it until replaced or [clearMessage](#clearmessage)-ed.

##### Returns

`string`

#### Inherited from

`Canvas.currentMessage`

***

### frames

#### Get Signature

> **get** **frames**(): `FrameMeter`

Frame-performance recorder — instantaneous + windowed FPS and the per-phase
CPU breakdown for the last N frames. Read it for a HUD (`canvas.frames.stats()`)
or subscribe to the per-frame `render:loop:tick` event for streaming.

##### Returns

`FrameMeter`

#### Inherited from

`Canvas.frames`

***

### isInitialised

#### Get Signature

> **get** **isInitialised**(): `boolean`

##### Returns

`boolean`

#### Inherited from

`Canvas.isInitialised`

***

### renderer

#### Get Signature

> **get** **renderer**(): [`IRenderer`](../../../canvas/src/interfaces/IRenderer.md)

The mounted drawing backend, or `undefined` before `init()`.

Replaces the old `application` getter, which handed out pixi's
`Application` and could not survive the backend split — a getter typed in
pixi nouns forces every consumer to know which backend is mounted. Reach
for a *capability* (`renderer.capabilities`, `renderer.extract?.()`)
instead; if you genuinely need the pixi object, narrow the backend
yourself with an `instanceof PixiRenderer` at the call site.

##### Returns

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md)

#### Inherited from

`Canvas.renderer`

## Methods

### behaviour()

> **behaviour**\<`T`\>(`id`): `T`

Typed behaviour lookup.

#### Type Parameters

##### T

`T` *extends* [`Behaviour`](../../../canvas/src/classes/Behaviour.md)\<[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)\> = [`Behaviour`](../../../canvas/src/classes/Behaviour.md)\<[`BehaviourOptions`](../../../canvas/src/interfaces/BehaviourOptions.md)\>

#### Parameters

##### id

`string`

#### Returns

`T`

***

### clearMessage()

> **clearMessage**(): `void`

Clear the current canvas message (emits `message` with `text: null`).

#### Returns

`void`

#### Inherited from

`Canvas.clearMessage`

***

### destroy()

> **destroy**(): `void`

Tear down everything: ticker callback, registries (which unmount their
Layers / destroy their Behaviours and any ScreenLayer roots they own),
the world subtree, bus subscriptions, pixi Application. Idempotent.

#### Returns

`void`

#### Overrides

`Canvas.destroy`

***

### downloadState()

> **downloadState**(`filename?`): `void`

Serialise the full canvas state and trigger a browser download of the
`.json` file. No-op outside a DOM environment. Delegates to
downloadCanvasState.

#### Parameters

##### filename?

`string`

#### Returns

`void`

#### Inherited from

`Canvas.downloadState`

***

### export()

> **export**(`opts?`): `Promise`\<`Blob`\>

Export the canvas as a raster image `Blob` (PNG / JPEG / WebP).

Renders a region of the world container off-screen via the renderer's
`extract` system — `area: 'viewport'` (default) captures what's currently
visible at the on-screen zoom; `area: 'content'` captures the whole diagram
at native scale. Screen overlays (minimap, dev-info) are excluded; the
background is reproduced from the `background` option. See
ExportImageOptions.

Rejects if called before [init](#init) / in headless mode (no GPU renderer),
or when the capture region is empty. SVG export is a separate API (Phase 2).

With `format: 'svg'` this returns a vector `image/svg+xml` blob via
exportSVG instead of a raster extract (see [exportSVGString](#exportsvgstring)
for coverage notes).

#### Parameters

##### opts?

`ExportImageOptions`

#### Returns

`Promise`\<`Blob`\>

#### Example

```ts
const blob = await canvas.export({ format: 'png', area: 'content' });
const url = URL.createObjectURL(blob);
```

#### Inherited from

`Canvas.export`

***

### exportDataURL()

> **exportDataURL**(`opts?`): `string`

Export the canvas as a `data:` URL — the synchronous counterpart to
[export](#export), handy for `<img src>` / quick previews. Prefer [export](#export)
for downloads (a `Blob` URL avoids a large base64 string). Same options and
throw conditions as [export](#export).

#### Parameters

##### opts?

`ExportImageOptions`

#### Returns

`string`

#### Inherited from

`Canvas.exportDataURL`

***

### exportState()

> **exportState**(): `CanvasStateSnapshot`

Serialise the canvas's **full render state** to a plain JSON object — view
definition (scene / layers / behaviours / layouts / templates / theme +
styling), live interaction (selection / hover / camera / focus), and every
data-owning layer's records (nodes / edges with positions). The result is a
pure POJO safe to `JSON.stringify` / persist / diff.

The state counterpart to [export](#export) (which produces an *image*). Restore
with [importState](#importstate). Delegates to exportCanvasState.

#### Returns

`CanvasStateSnapshot`

#### Example

```ts
const snapshot = canvas.exportState();
await fetch('/scene', { method: 'PUT', body: JSON.stringify(snapshot) });
```

#### Inherited from

`Canvas.exportState`

***

### exportSVGString()

> **exportSVGString**(`opts?`): `string`

Export the canvas as a **true vector SVG** string — a second projection of
the scene (shape specs + routed connector paths) into scalable markup,
independent of the GPU raster path. Resolution-independent and faithful for
geometric shapes, connectors, solid fills/strokes, composite cards, and
text labels.

Not represented (use raster [export](#export) when these matter): `image` /
`glyph` / `svg` fills, decorations other than labels, effects, and blur /
shadow filters — see `export/svgExport.ts`. Throws when the capture region
is empty. Unlike raster export this works headless (no GPU renderer needed).

#### Parameters

##### opts?

`ExportSvgOptions`

#### Returns

`string`

#### Inherited from

`Canvas.exportSVGString`

***

### fitView()

> **fitView**(`padding?`): `void`

Fit the camera to all content — zoom + centre so every world layer's content
fits the viewport (the "zoom to extent" action; the same
`camera.fitContent` the Fit toolbar button calls, over the union of layers).
No-op when there's nothing with real extent to fit.

#### Parameters

##### padding?

`number`

Screen-px margin around the content. Default `80`.

#### Returns

`void`

#### Inherited from

`Canvas.fitView`

***

### get()

> **get**(): [`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

Current serialisable config snapshot — drive a settings UI / save-load from
this. Projected from `store.view.definition` (the source of truth).

#### Returns

[`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

#### Inherited from

`Canvas.get`

***

### importState()

> **importState**(`snapshot`, `opts?`): `void`

Restore the canvas from a CanvasStateSnapshot produced by
[exportState](#exportstate). Loads each layer's data, pushes the definition to the
registered instances, and restores the live interaction (unless
`skipInteraction`). The canvas's layers/behaviours/layouts must already be
registered under the snapshot's ids — import addresses instances by id, it
does not create them. Delegates to importCanvasState.

#### Parameters

##### snapshot

`CanvasStateSnapshot`

##### opts?

`ImportCanvasStateOptions`

#### Returns

`void`

#### Inherited from

`Canvas.importState`

***

### importStateFrom()

> **importStateFrom**(`source`, `opts?`): `Promise`\<`void`\>

Restore the canvas from a CanvasStateSnapshot, a JSON string, or a
picked `File` / `Blob` (e.g. from an `<input type="file">`). Parses the
source then applies it like [importState](#importstate). Delegates to
importCanvasStateFromFile.

#### Parameters

##### source

`CanvasStateSource`

##### opts?

`ImportCanvasStateOptions`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Canvas.importStateFrom`

***

### init()

> **init**(`opts`): `Promise`\<`void`\>

Production init: create a pixi `Application`, mount its canvas into the
supplied DOM container, wire the ticker, and emit
`'canvas:renderer:ready'` on the bus.

The selected backend (and capabilities) flows through the bus event so
consumers see which renderer pixi resolved.

#### Parameters

##### opts

`CanvasOptions`

#### Returns

`Promise`\<`void`\>

#### Overrides

`Canvas.init`

***

### initWithRenderer()

> **initWithRenderer**(`renderer`, `screenWidth`, `screenHeight`): `void`

Init against a renderer the caller already built and mounted — the seam for
a **headless** backend, and the reason the engine's own test suite needs no
drawing library.

Synchronous on purpose. [init](#init) resolves its default backend with a
lazy `import()` and is therefore async; this path takes the renderer as an
argument instead, so it stays callable from a plain test body.

The caller owns the renderer's `mount` — this only wires the camera, the
context and the layer/behaviour registries on top of it.

#### Parameters

##### renderer

[`IRenderer`](../../../canvas/src/interfaces/IRenderer.md)

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

#### Inherited from

`Canvas.initWithRenderer`

***

### layer()

> **layer**\<`T`\>(`id`): `T`

Typed layer lookup; defaults to `GraphLayer`.

#### Type Parameters

##### T

`T` *extends* [`Layer`](../../../canvas/src/classes/Layer.md)\<`unknown`, `object`, [`EventMap`](../../../canvas/src/type-aliases/EventMap.md), `string`\> = [`GraphLayer`](GraphLayer.md)

#### Parameters

##### id

`string`

#### Returns

`T`

***

### layout()

> **layout**\<`T`\>(`id`): `T`

Typed layout lookup.

#### Type Parameters

##### T

`T` *extends* [`Layout`](../../../canvas/src/classes/Layout.md)\<[`Layer`](../../../canvas/src/classes/Layer.md)\<`any`, `any`, `any`, `any`\>\> = [`Layout`](../../../canvas/src/classes/Layout.md)\<[`Layer`](../../../canvas/src/classes/Layer.md)\<`any`, `any`, `any`, `any`\>\>

#### Parameters

##### id

`string`

#### Returns

`T`

***

### redraw()

> **redraw**(): `void`

Repaint every layer from its current state — calls [Layer.redraw](../../../canvas/src/classes/Layer.md#redraw) on
each (a no-op for layers that don't override it). A pure render pass:
positions and data are untouched. Use after an external style/theme change
that bypassed the per-layer dirty path, or to recover from a suspected
render desync. For layout re-positioning use [runLayout](#runlayout); for both at
once use [refresh](#refresh).

#### Returns

`void`

#### Inherited from

`Canvas.redraw`

***

### refresh()

> **refresh**(): `Promise`\<`void`\>

Full refresh: re-run the active layout (`config.activeLayout`) to
re-position items, then [redraw](#redraw) every layer. The single call behind
a toolbar "re-render" button — re-layout + repaint in one. Resolves once
the layout settles; the layout step is skipped when no `activeLayout` is set.

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Canvas.refresh`

***

### runLayout()

> **runLayout**(`id`): `Promise`\<`void`\>

Run a registered layout against the layer named by its `targetLayerId`.
No-op if the layout or its target layer isn't found. Layouts run against
data, so call this after the target layer has data.

#### Parameters

##### id

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Canvas.runLayout`

***

### showMessage()

> **showMessage**(`text`, `timeout?`): `void`

Show a transient message on the shared canvas message channel — emits a
`message` event for a status surface (e.g. canvas-react's `CanvasMessageBar`)
to display. Last-write-wins: a newer message replaces the current one. With
`timeout` (ms) the surface auto-clears it after that delay; without, it
stays until replaced or [clearMessage](#clearmessage)-ed. Reachable from layers /
behaviours / layouts too, via `ctx.showMessage`.

#### Parameters

##### text

`string`

##### timeout?

`number`

#### Returns

`void`

#### Inherited from

`Canvas.showMessage`

***

### stateToJSON()

> **stateToJSON**(`space?`): `string`

The current full canvas state as a JSON string (pretty-printed by default).
Sugar over `JSON.stringify(this.exportState(), null, space)`; delegates to
canvasStateToJSON.

#### Parameters

##### space?

`string` \| `number`

#### Returns

`string`

#### Inherited from

`Canvas.stateToJSON`

***

### stopLayout()

> **stopLayout**(): `void`

Cancel the layout run that's currently in flight, if any. Reads the running
layout id from the reactive run-status (`runtime.layout.activeId`, written by
[runLayout](#runlayout)) and calls its optional `stop()` — which settles the run,
emits `end` (`reason: 'stopped'`), and clears `runtime.layout.running` back
through the same bridge. No-op when nothing is running or the layout has no
`stop()`. This is the engine-level counterpart a "Stop layout" control calls
to halt the active (e.g. load-time) layout, distinct from any layout a UI
applied out-of-band.

#### Returns

`void`

#### Inherited from

`Canvas.stopLayout`

***

### tickOnce()

> **tickOnce**(`deltaMs?`): `void`

Run one tick manually with a fixed delta. Useful in tests; in production
pixi's ticker calls `tick` automatically.

#### Parameters

##### deltaMs?

`number`

#### Returns

`void`

#### Inherited from

`Canvas.tickOnce`

***

### update()

> **update**(`patch`): `void`

Apply a JSON config patch. Writes `store.view.definition` (the source of
truth) and pushes each layer/behaviour slice to that instance's `setOptions`,
resolved by id (unknown ids no-op — register the instance first). Observers
subscribe to `store.view` slices (`useStore` / `select`) or `state:change`
rather than a coarse bus event.

The config is pure JSON keyed by id — instances themselves are registered
imperatively (`canvas.layers.add(new XLayer({ id }))`).

#### Parameters

##### patch

[`CanvasConfig`](../../../canvas-react/src/interfaces/CanvasConfig.md)

#### Returns

`void`

#### Overrides

`Canvas.update`
