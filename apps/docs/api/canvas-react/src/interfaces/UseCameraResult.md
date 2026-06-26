# Interface: UseCameraResult

Defined in: [canvas-react/src/hooks/useCamera.ts:9](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L9)

## Properties

### fitContent

> **fitContent**: (`worldRect`, `padding?`) => `void`

Defined in: [canvas-react/src/hooks/useCamera.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L21)

Fit a world-space rectangle into the viewport.

#### Parameters

##### worldRect

`Rect$1`

##### padding?

`number`

#### Returns

`void`

***

### getZoom

> **getZoom**: () => `number`

Defined in: [canvas-react/src/hooks/useCamera.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L23)

Read the current uniform scale (does not subscribe — use `useZoom` for live state).

#### Returns

`number`

***

### pan

> **pan**: (`dx`, `dy`) => `void`

Defined in: [canvas-react/src/hooks/useCamera.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L19)

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

Defined in: [canvas-react/src/hooks/useCamera.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L15)

Set an absolute scale, anchored at the viewport centre.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### zoomIn

> **zoomIn**: (`factor?`) => `void`

Defined in: [canvas-react/src/hooks/useCamera.ts:11](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L11)

Multiply scale by `factor` (default 1.2), anchored at the viewport centre.

#### Parameters

##### factor?

`number`

#### Returns

`void`

***

### zoomOut

> **zoomOut**: (`factor?`) => `void`

Defined in: [canvas-react/src/hooks/useCamera.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L13)

Divide scale by `factor` (default 1.2), anchored at the viewport centre.

#### Parameters

##### factor?

`number`

#### Returns

`void`

***

### zoomTo

> **zoomTo**: (`scale`, `centerX?`, `centerY?`) => `void`

Defined in: [canvas-react/src/hooks/useCamera.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCamera.ts#L17)

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
