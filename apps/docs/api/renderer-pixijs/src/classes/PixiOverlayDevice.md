# Class: PixiOverlayDevice

## Implements

- [`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md)

## Constructors

### Constructor

> **new PixiOverlayDevice**(`parent`, `label`, `zIndex?`): `PixiOverlayDevice`

#### Parameters

##### parent

`Container`

##### label

`string`

##### zIndex?

`number` = `9999`

#### Returns

`PixiOverlayDevice`

## Methods

### clear()

> **clear**(): `this`

Erase everything drawn so far. Every redraw starts here.

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`clear`](../../../canvas/src/interfaces/IOverlayDevice.md#clear)

***

### closePath()

> **closePath**(): `this`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`closePath`](../../../canvas/src/interfaces/IOverlayDevice.md#closepath)

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`destroy`](../../../canvas/src/interfaces/IOverlayDevice.md#destroy)

***

### ellipse()

> **ellipse**(`cx`, `cy`, `radiusX`, `radiusY`): `this`

#### Parameters

##### cx

`number`

##### cy

`number`

##### radiusX

`number`

##### radiusY

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`ellipse`](../../../canvas/src/interfaces/IOverlayDevice.md#ellipse)

***

### fill()

> **fill**(`style`): `this`

#### Parameters

##### style

[`OverlayFillLike`](../../../canvas/src/type-aliases/OverlayFillLike.md)

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`fill`](../../../canvas/src/interfaces/IOverlayDevice.md#fill)

***

### lineTo()

> **lineTo**(`x`, `y`): `this`

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`lineTo`](../../../canvas/src/interfaces/IOverlayDevice.md#lineto)

***

### moveTo()

> **moveTo**(`x`, `y`): `this`

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`moveTo`](../../../canvas/src/interfaces/IOverlayDevice.md#moveto)

***

### poly()

> **poly**(`points`, `close?`): `this`

Flat `[x0, y0, x1, y1, …]` or point objects.

#### Parameters

##### points

readonly `number`[] \| readonly `object`[]

##### close?

`boolean` = `true`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`poly`](../../../canvas/src/interfaces/IOverlayDevice.md#poly)

***

### quadraticCurveTo()

> **quadraticCurveTo**(`cx`, `cy`, `x`, `y`): `this`

#### Parameters

##### cx

`number`

##### cy

`number`

##### x

`number`

##### y

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`quadraticCurveTo`](../../../canvas/src/interfaces/IOverlayDevice.md#quadraticcurveto)

***

### rect()

> **rect**(`x`, `y`, `width`, `height`): `this`

#### Parameters

##### x

`number`

##### y

`number`

##### width

`number`

##### height

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`rect`](../../../canvas/src/interfaces/IOverlayDevice.md#rect)

***

### roundRect()

> **roundRect**(`x`, `y`, `width`, `height`, `radius`): `this`

#### Parameters

##### x

`number`

##### y

`number`

##### width

`number`

##### height

`number`

##### radius

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`roundRect`](../../../canvas/src/interfaces/IOverlayDevice.md#roundrect)

***

### setPosition()

> **setPosition**(`x`, `y`): `this`

Move the whole overlay; useful for screen-space chrome.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`setPosition`](../../../canvas/src/interfaces/IOverlayDevice.md#setposition)

***

### setVisible()

> **setVisible**(`visible`): `this`

Hide without discarding — cheaper than clear + redraw for a blinking overlay.

#### Parameters

##### visible

`boolean`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`setVisible`](../../../canvas/src/interfaces/IOverlayDevice.md#setvisible)

***

### setZIndex()

> **setZIndex**(`z`): `this`

Paint order against sibling overlays.

#### Parameters

##### z

`number`

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`setZIndex`](../../../canvas/src/interfaces/IOverlayDevice.md#setzindex)

***

### stroke()

> **stroke**(`style`): `this`

#### Parameters

##### style

[`OverlayStroke`](../../../canvas/src/interfaces/OverlayStroke.md)

#### Returns

`this`

#### Implementation of

[`IOverlayDevice`](../../../canvas/src/interfaces/IOverlayDevice.md).[`stroke`](../../../canvas/src/interfaces/IOverlayDevice.md#stroke)
