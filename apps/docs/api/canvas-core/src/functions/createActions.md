# Function: createActions()

> **createActions**(`view`, `layer`, `events`): `object`

`createActions` — the **named, action-typed command API** over the kernel.

Every mutation is a discoverable method (not a raw `view.update(recipe, …)`),
and each **bakes in its action label** (`'view:layer:setStyle'`, `'view:camera:zoom'`, …),
so telemetry, history, and the CRDT op-log all read as intent. View commands go
through the one `view.update(recipe, action)` seam; data commands proxy to the
target [LayerData](../classes/LayerData.md).

Group by concern: `node / edge / group / annotation / positions` (data) and
`layers / behaviours / layouts / camera / selection / hover / templates / theme`
(view).

⚠ **Data actions target the default [LayerData](../classes/LayerData.md) store only.** The
injected `layer(id)` accessor (see `createCanvasStore`) **throws** for any id
where a *custom* [DataSource](../interfaces/DataSource.md) was registered via `setSource` — e.g.
`@invana/graph`'s `GraphStore`. For those, mutate through the domain store's
own API (`store.source(id)` / the layer's methods) instead. Unifying the data
actions over the `DataSource` interface is future work — audited and
deliberately deferred 2026-08-13 (the contract would need write methods it
doesn't carry today).

## Parameters

### view

[`ReactiveStore`](../interfaces/ReactiveStore.md)\<[`CanvasView`](../interfaces/CanvasView.md)\>

### layer

(`id`) => [`LayerData`](../classes/LayerData.md)

### events

[`CanvasEventBus`](../classes/CanvasEventBus.md)

## Returns

### annotation

> **annotation**: `object`

#### annotation.add

> **add**: (`l`, `a`) => `void`

##### Parameters

###### l

`string`

###### a

[`AnnotationRecord`](../interfaces/AnnotationRecord.md)

##### Returns

`void`

#### annotation.remove

> **remove**: (`l`, `id`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

##### Returns

`void`

#### annotation.update

> **update**: (`l`, `id`, `patch`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

###### patch

`Partial`\<[`AnnotationRecord`](../interfaces/AnnotationRecord.md)\>

##### Returns

`void`

### behaviours

> **behaviours**: `object`

#### behaviours.add

> **add**: (`id`, `opts`) => `void`

##### Parameters

###### id

`string`

###### opts

`Bag`

##### Returns

`void`

#### behaviours.disable

> **disable**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### behaviours.enable

> **enable**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### behaviours.remove

> **remove**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### behaviours.update

> **update**: (`id`, `patch`) => `void`

##### Parameters

###### id

`string`

###### patch

`Bag`

##### Returns

`void`

### camera

> **camera**: `object`

#### camera.pan

> **pan**: (`dx`, `dy`) => `void`

##### Parameters

###### dx

`number`

###### dy

`number`

##### Returns

`void`

#### camera.reset

> **reset**: () => `void`

##### Returns

`void`

#### camera.set

> **set**: (`c`) => `void`

##### Parameters

###### c

`CameraInput`

##### Returns

`void`

#### camera.zoom

> **zoom**: (`factor`) => `void`

##### Parameters

###### factor

`number`

##### Returns

`void`

#### camera.zoomTo

> **zoomTo**: (`zoom`) => `void`

##### Parameters

###### zoom

`number`

##### Returns

`void`

### edge

> **edge**: `object`

#### edge.add

> **add**: (`l`, `e`) => `void`

##### Parameters

###### l

`string`

###### e

[`EdgeRecord`](../interfaces/EdgeRecord.md)

##### Returns

`void`

#### edge.remove

> **remove**: (`l`, `id`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

##### Returns

`void`

#### edge.update

> **update**: (`l`, `id`, `patch`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

###### patch

`Partial`\<[`EdgeRecord`](../interfaces/EdgeRecord.md)\>

##### Returns

`void`

### focus

> **focus**: `object`

#### focus.clear

> **clear**: () => `void`

##### Returns

`void`

#### focus.set

> **set**: (`ids`, `dim`) => `void`

##### Parameters

###### ids

`Iterable`\<`string`\>

###### dim?

`boolean` = `true`

##### Returns

`void`

### group

> **group**: `object`

#### group.add

> **add**: (`l`, `g`) => `void`

##### Parameters

###### l

`string`

###### g

[`GroupRecord`](../interfaces/GroupRecord.md)

##### Returns

`void`

#### group.remove

> **remove**: (`l`, `id`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

##### Returns

`void`

#### group.update

> **update**: (`l`, `id`, `patch`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

###### patch

`Partial`\<[`GroupRecord`](../interfaces/GroupRecord.md)\>

##### Returns

`void`

### hover

> **hover**: `object`

#### hover.clear

> **clear**: () => `void`

##### Returns

`void`

#### hover.set

> **set**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

### layers

> **layers**: `object`

#### layers.add

> **add**: (`id`, `opts`) => `void`

##### Parameters

###### id

`string`

###### opts

`Bag`

##### Returns

`void`

#### layers.remove

> **remove**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### layers.setStyle

> **setStyle**: (`id`, `style`) => `void`

##### Parameters

###### id

`string`

###### style

`Bag`

##### Returns

`void`

#### layers.setVisible

> **setVisible**: (`id`, `visible`) => `void`

##### Parameters

###### id

`string`

###### visible

`boolean`

##### Returns

`void`

#### layers.update

> **update**: (`id`, `patch`) => `void`

##### Parameters

###### id

`string`

###### patch

`Bag`

##### Returns

`void`

### layouts

> **layouts**: `object`

#### layouts.remove

> **remove**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### layouts.run

> **run**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### layouts.set

> **set**: (`id`, `opts`) => `void`

##### Parameters

###### id

`string`

###### opts

`Bag`

##### Returns

`void`

#### layouts.tune

> **tune**: (`id`, `patch`) => `void`

##### Parameters

###### id

`string`

###### patch

`Bag`

##### Returns

`void`

### layoutStatus

> **layoutStatus**: `object`

#### layoutStatus.begin

> **begin**: (`id`, `animate`) => `void`

##### Parameters

###### id

`string`

###### animate?

`boolean` = `false`

##### Returns

`void`

#### layoutStatus.end

> **end**: () => `void`

##### Returns

`void`

#### layoutStatus.progress

> **progress**: (`progress`) => `void`

##### Parameters

###### progress

`number`

##### Returns

`void`

### message

> **message**: `object`

#### message.clear

> **clear**: () => `void`

##### Returns

`void`

#### message.show

> **show**: (`text`) => `void`

##### Parameters

###### text

`string`

##### Returns

`void`

### node

> **node**: `object`

#### node.add

> **add**: (`l`, `n`) => `void`

##### Parameters

###### l

`string`

###### n

[`NodeRecord`](../interfaces/NodeRecord.md)

##### Returns

`void`

#### node.moveTo

> **moveTo**: (`l`, `id`, `x`, `y`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

###### x

`number`

###### y

`number`

##### Returns

`void`

#### node.remove

> **remove**: (`l`, `id`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

##### Returns

`void`

#### node.update

> **update**: (`l`, `id`, `patch`) => `void`

##### Parameters

###### l

`string`

###### id

`string`

###### patch

`Partial`\<[`NodeRecord`](../interfaces/NodeRecord.md)\>

##### Returns

`void`

### positions

> **positions**: `object`

Bulk layout output → node positions (transform-only re-render).

#### positions.apply

> **apply**: (`l`, `positions`) => `void`

##### Parameters

###### l

`string`

###### positions

`Iterable`\<\{ `id`: `string`; `x`: `number`; `y`: `number`; \}\>

##### Returns

`void`

### raise

> **raise**: `object`

Paint-order lift, per source. `source` is the id of whatever is asking
(a behaviour id) — each owns its own set, so a hover lift and a selection
lift coexist and either can be dropped without disturbing the other.
The renderer projects the union; see `CanvasView.interaction.raised`.

#### raise.clear

> **clear**: (`source`) => `void`

##### Parameters

###### source

`string`

##### Returns

`void`

#### raise.set

> **set**: (`source`, `ids`) => `void`

##### Parameters

###### source

`string`

###### ids

`Iterable`\<`string`\>

##### Returns

`void`

### scene

> **scene**: `object`

#### scene.set

> **set**: (`patch`) => `void`

##### Parameters

###### patch

`Partial`\<[`CanvasSceneOptions`](../interfaces/CanvasSceneOptions.md)\>

##### Returns

`void`

#### scene.setBackground

> **setBackground**: (`backgroundColor`) => `void`

##### Parameters

###### backgroundColor

`number`

##### Returns

`void`

#### scene.setZoomLimits

> **setZoomLimits**: (`min`, `max`) => `void`

##### Parameters

###### min

`number`

###### max

`number`

##### Returns

`void`

### selection

> **selection**: `object`

#### selection.add

> **add**: (`ids`) => `void`

##### Parameters

###### ids

`Iterable`\<`string`\>

##### Returns

`void`

#### selection.clear

> **clear**: () => `void`

##### Returns

`void`

#### selection.set

> **set**: (`ids`) => `void`

##### Parameters

###### ids

`Iterable`\<`string`\>

##### Returns

`void`

#### selection.toggle

> **toggle**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

### templates

> **templates**: `object`

#### templates.create

> **create**: (`template`) => `void`

##### Parameters

###### template

`unknown`

##### Returns

`void`

#### templates.remove

> **remove**: (`id`) => `void`

##### Parameters

###### id

`string`

##### Returns

`void`

#### templates.update

> **update**: (`id`, `patch`) => `void`

##### Parameters

###### id

`string`

###### patch

`Bag`

##### Returns

`void`

### theme

> **theme**: `object`

#### theme.set

> **set**: (`patch`) => `void`

##### Parameters

###### patch

`Bag`

##### Returns

`void`

### transientPins

> **transientPins**: `object`

#### transientPins.add

> **add**: (`ids`) => `void`

##### Parameters

###### ids

`Iterable`\<`string`\>

##### Returns

`void`

#### transientPins.clear

> **clear**: () => `void`

##### Returns

`void`

#### transientPins.remove

> **remove**: (`ids`) => `void`

##### Parameters

###### ids

`Iterable`\<`string`\>

##### Returns

`void`
