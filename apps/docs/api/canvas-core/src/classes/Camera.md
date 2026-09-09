# Class: Camera

## Constructors

### Constructor

> **new Camera**(`opts`): `Camera`

#### Parameters

##### opts

[`CameraOptions`](../interfaces/CameraOptions.md)

#### Returns

`Camera`

## Accessors

### scale

#### Get Signature

> **get** **scale**(): `number`

Current uniform scale.

##### Returns

`number`

***

### screenHeight

#### Get Signature

> **get** **screenHeight**(): `number`

##### Returns

`number`

***

### screenWidth

#### Get Signature

> **get** **screenWidth**(): `number`

##### Returns

`number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Current world-container x in screen pixels. (Where world (0,0) sits.)

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

##### Returns

`number`

## Methods

### centerOn()

> **centerOn**(`worldX`, `worldY`): `void`

Centre the viewport on a world-space point — pan so `(worldX, worldY)`
maps to the screen centre, keeping the current zoom. The pan-only
counterpart to [fitContent](#fitcontent): use it for "focus" / "go to" actions
that should locate a target without rescaling the view.

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

`void`

***

### configureInput()

> **configureInput**(`config`): `void`

Configure the camera's own pan / zoom inputs. This is the seam camera-input
behaviours use instead of naming a backend plugin: the options are described
semantically (`percent`, `modifier`) and the realisation lives in the
binding, so `DragPanBehaviour` / `WheelZoomBehaviour` / `PinchZoomBehaviour`
survive the renderer swap unchanged.

Patch semantics — an omitted key is left alone, `null` removes that input:

```ts
camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
camera.configureInput({ wheel: null });   // wheel zoom off, pinch untouched
```

Re-configuring an already-installed input replaces it, because the
underlying inputs read their config only at install time.

#### Parameters

##### config

[`CameraInputConfig`](../interfaces/CameraInputConfig.md)

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Tear down subscriptions. Called by `Canvas.destroy`.

#### Returns

`void`

***

### fitContent()

> **fitContent**(`worldRect`, `padding?`): `void`

Fit a world-space rectangle into the viewport. Scales so the whole rect
is visible (limited by the smaller axis), centres it. `padding` is in
screen pixels around the rect.

#### Parameters

##### worldRect

[`Rect`](../interfaces/Rect.md)

##### padding?

`number` = `24`

#### Returns

`void`

***

### getVisibleBounds()

> **getVisibleBounds**(): [`Rect`](../interfaces/Rect.md)

The world-space rectangle currently visible. Used by viewport culling
(per `decorations-plan.md` §11.6) and minimap layers.

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### onDragStart()

> **onDragStart**(`fn`): () => `void`

Subscribe to the start of a drag-pan gesture — fired once the pointer has
actually moved enough to pan. `DragPanBehaviour` uses it as the cursor
fallback for the `space` modifier, which can't be read off a pointer event.

#### Parameters

##### fn

() => `void`

#### Returns

an unsubscribe function.

() => `void`

***

### pan()

> **pan**(`dx`, `dy`): `void`

Pan by `(dx, dy)` screen pixels.

#### Parameters

##### dx

`number`

##### dy

`number`

#### Returns

`void`

***

### resize()

> **resize**(`screenWidth`, `screenHeight`): `void`

Update on viewport resize. Forwarded so the binding's own math stays correct.

#### Parameters

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

***

### setDragSuspended()

> **setDragSuspended**(`suspended`): `void`

Suspend / restore drag-panning without tearing the input down. This is how
gesture arbitration yields the camera: while another behaviour owns the
pointer (a node drag, a lasso, a resize) panning is suspended, and it
resumes when that gesture releases.

Momentum is deliberately left running, so an in-flight glide finishes as it
always has. Edge-triggered — restoring resets the underlying input, so a
repeated call in the same state is a no-op.

#### Parameters

##### suspended

`boolean`

#### Returns

`void`

***

### setPosition()

> **setPosition**(`x`, `y`): `void`

Set absolute world-container offset. `(x, y)` is where world (0,0) lives
in screen pixels. Most consumers want `pan(dx, dy)` instead.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`void`

***

### setTransform()

> **setTransform**(`t`, `opts?`): `void`

Write an absolute `{ x, y, zoom }` transform in one step — the seam for a
layer mirroring an **external** camera authority (a MapLibre basemap, a
remote collaborator's viewport, a replayed session).

Unlike `setZoom` + `setPosition`, this re-anchors nothing: the transform
lands exactly as given, because the external authority has already solved
for it and any re-anchoring here would desync the two views. `zoom` is
emitted only when it actually changed — most mirrored gestures are pan-only
and the `input:camera:zoom` listeners are O(N) over their tracked elements.

#### Parameters

##### t

[`CameraTransformValue`](../interfaces/CameraTransformValue.md)

The transform to apply.

##### opts?

###### clamp?

`boolean`

Apply the camera's min/max zoom clamp. Default `true`.
  Pass `false` when mirroring an authority with its own scale range — a web
  mercator basemap runs to `2 ** 22`, far past the camera's default ceiling
  of 100, and clamping would silently peg the canvas away from the map.

#### Returns

`void`

***

### setZoom()

> **setZoom**(`scale`): `void`

Set absolute scale, anchored at the viewport centre. The world point at
the centre stays put. For zoom-around-an-arbitrary-point semantics use
`zoomAt`.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### tick()

> **tick**(`dt`): `void`

Advance time-based input animation (momentum, snap). Called by
`Canvas.tickOnce()` every frame — the engine owns the only clock (G3).
No-op until a camera-input behaviour enables an input that animates.

#### Parameters

##### dt

`number`

#### Returns

`void`

***

### toScreen()

> **toScreen**(`worldX`, `worldY`): [`Point`](../interfaces/Point.md)

World → screen.

#### Parameters

##### worldX

`number`

##### worldY

`number`

#### Returns

[`Point`](../interfaces/Point.md)

***

### toWorld()

> **toWorld**(`screenX`, `screenY`): [`Point`](../interfaces/Point.md)

Screen → world.

#### Parameters

##### screenX

`number`

##### screenY

`number`

#### Returns

[`Point`](../interfaces/Point.md)

***

### zoomAt()

> **zoomAt**(`factor`, `centerX?`, `centerY?`): `void`

Multiply scale by `factor`, holding the world point under the screen
cursor `(centerX, centerY)` in place. Default centre = viewport centre.

Bindings offer only centre-anchored zoom, so the arbitrary-anchor math is
done here: project the anchor to world, change scale, then translate so the
same world point lands at the same screen point.

#### Parameters

##### factor

`number`

##### centerX?

`number` = `...`

##### centerY?

`number` = `...`

#### Returns

`void`
