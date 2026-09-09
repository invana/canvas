# Interface: IOverlayDevice

## Methods

### clear()

> **clear**(): `this`

Erase everything drawn so far. Every redraw starts here.

#### Returns

`this`

***

### closePath()

> **closePath**(): `this`

#### Returns

`this`

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

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

***

### fill()

> **fill**(`style`): `this`

#### Parameters

##### style

[`OverlayFillLike`](../type-aliases/OverlayFillLike.md)

#### Returns

`this`

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

***

### poly()

> **poly**(`points`, `close?`): `this`

Flat `[x0, y0, x1, y1, …]` or point objects.

#### Parameters

##### points

readonly `number`[] \| readonly `object`[]

##### close?

`boolean`

#### Returns

`this`

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

***

### setVisible()

> **setVisible**(`visible`): `this`

Hide without discarding — cheaper than clear + redraw for a blinking overlay.

#### Parameters

##### visible

`boolean`

#### Returns

`this`

***

### setZIndex()

> **setZIndex**(`z`): `this`

Paint order against sibling overlays.

#### Parameters

##### z

`number`

#### Returns

`this`

***

### stroke()

> **stroke**(`style`): `this`

#### Parameters

##### style

[`OverlayStroke`](OverlayStroke.md)

#### Returns

`this`
