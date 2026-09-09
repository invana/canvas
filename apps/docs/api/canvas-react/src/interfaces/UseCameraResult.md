# Interface: UseCameraResult

## Properties

### fitContent

> **fitContent**: (`worldRect`, `padding?`) => `void`

Fit a world-space rectangle into the viewport.

#### Parameters

##### worldRect

`Rect`

##### padding?

`number`

#### Returns

`void`

***

### getZoom

> **getZoom**: () => `number`

Read the current uniform scale (does not subscribe — use `useZoom` for live state).

#### Returns

`number`

***

### pan

> **pan**: (`dx`, `dy`) => `void`

Pan by `(dx, dy)` screen pixels.

#### Parameters

##### dx

`number`

##### dy

`number`

#### Returns

`void`

***

### setZoom

> **setZoom**: (`scale`) => `void`

Set an absolute scale, anchored at the viewport centre.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### zoomIn

> **zoomIn**: (`factor?`) => `void`

Multiply scale by `factor` (default 1.2), anchored at the viewport centre.

#### Parameters

##### factor?

`number`

#### Returns

`void`

***

### zoomOut

> **zoomOut**: (`factor?`) => `void`

Divide scale by `factor` (default 1.2), anchored at the viewport centre.

#### Parameters

##### factor?

`number`

#### Returns

`void`

***

### zoomTo

> **zoomTo**: (`scale`, `centerX?`, `centerY?`) => `void`

Set an absolute scale around an arbitrary screen point (defaults to centre).

#### Parameters

##### scale

`number`

##### centerX?

`number`

##### centerY?

`number`

#### Returns

`void`
