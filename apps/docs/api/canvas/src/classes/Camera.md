# Class: Camera

Defined in: [canvas/src/camera/Camera.ts:67](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L67)

## Constructors

### Constructor

> **new Camera**(`opts`): `Camera`

Defined in: [canvas/src/camera/Camera.ts:84](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L84)

#### Parameters

##### opts

[`CameraOptions`](../interfaces/CameraOptions.md)

#### Returns

`Camera`

## Properties

### viewport

> `readonly` **viewport**: `Viewport`

Defined in: [canvas/src/camera/Camera.ts:75](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L75)

The underlying `pixi-viewport` `Viewport`. Public for engine internals
(camera-input behaviours that need `viewport.drag()` / `viewport.snap()`
/ `viewport.animate()` etc.). Domain code should go through Camera's
typed methods (`pan`, `setZoom`, `toWorld`, ...) rather than touching
Viewport directly.

## Accessors

### scale

#### Get Signature

> **get** **scale**(): `number`

Defined in: [canvas/src/camera/Camera.ts:119](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L119)

Current uniform scale.

##### Returns

`number`

***

### screenHeight

#### Get Signature

> **get** **screenHeight**(): `number`

Defined in: [canvas/src/camera/Camera.ts:136](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L136)

##### Returns

`number`

***

### screenWidth

#### Get Signature

> **get** **screenWidth**(): `number`

Defined in: [canvas/src/camera/Camera.ts:132](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L132)

##### Returns

`number`

***

### x

#### Get Signature

> **get** **x**(): `number`

Defined in: [canvas/src/camera/Camera.ts:124](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L124)

Current world-container x in screen pixels. (Where world (0,0) sits.)

##### Returns

`number`

***

### y

#### Get Signature

> **get** **y**(): `number`

Defined in: [canvas/src/camera/Camera.ts:128](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L128)

##### Returns

`number`

## Methods

### centerOn()

> **centerOn**(`worldX`, `worldY`): `void`

Defined in: [canvas/src/camera/Camera.ts:235](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L235)

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

### fitContent()

> **fitContent**(`worldRect`, `padding?`): `void`

Defined in: [canvas/src/camera/Camera.ts:206](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L206)

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

Defined in: [canvas/src/camera/Camera.ts:268](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L268)

The world-space rectangle currently visible. Used by viewport culling
(per `decorations-plan.md` §11.6) and minimap layers.

#### Returns

[`Rect`](../interfaces/Rect.md)

***

### pan()

> **pan**(`dx`, `dy`): `void`

Defined in: [canvas/src/camera/Camera.ts:153](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L153)

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

Defined in: [canvas/src/camera/Camera.ts:244](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L244)

Update on viewport resize. Forwards to Viewport so its hit-area + plugin math stays correct.

#### Parameters

##### screenWidth

`number`

##### screenHeight

`number`

#### Returns

`void`

***

### setPosition()

> **setPosition**(`x`, `y`): `void`

Defined in: [canvas/src/camera/Camera.ts:146](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L146)

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

### setZoom()

> **setZoom**(`scale`): `void`

Defined in: [canvas/src/camera/Camera.ts:163](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L163)

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

Defined in: [canvas/src/camera/Camera.ts:280](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L280)

Advance viewport plugins that animate over time (decelerate, snap, etc.).
Called by `Canvas.tickOnce()` every frame. No-op until a camera-input
behaviour enables a plugin that uses `update()`.

#### Parameters

##### dt

`number`

#### Returns

`void`

***

### toScreen()

> **toScreen**(`worldX`, `worldY`): [`Point`](../interfaces/Point.md)

Defined in: [canvas/src/camera/Camera.ts:259](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L259)

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

Defined in: [canvas/src/camera/Camera.ts:253](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L253)

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

Defined in: [canvas/src/camera/Camera.ts:184](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/camera/Camera.ts#L184)

Multiply scale by `factor`, holding the world point under the screen
cursor `(centerX, centerY)` in place. Default centre = viewport centre.

Viewport has no built-in arbitrary-anchor zoom, so we do the math here:
project the anchor to world, change scale, then translate so the same
world point lands at the same screen point.

#### Parameters

##### factor

`number`

##### centerX?

`number` = `...`

##### centerY?

`number` = `...`

#### Returns

`void`
