# Interface: UseCanvasMessageResult

Defined in: [canvas-react/src/hooks/useCanvasMessage.ts:6](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCanvasMessage.ts#L6)

## Properties

### clearMessage

> **clearMessage**: () => `void`

Defined in: [canvas-react/src/hooks/useCanvasMessage.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCanvasMessage.ts#L12)

Clear the current message.

#### Returns

`void`

***

### message

> **message**: `string`

Defined in: [canvas-react/src/hooks/useCanvasMessage.ts:8](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCanvasMessage.ts#L8)

The message currently showing, or `null` when none is.

***

### showMessage

> **showMessage**: (`text`, `timeout?`) => `void`

Defined in: [canvas-react/src/hooks/useCanvasMessage.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useCanvasMessage.ts#L10)

Show a message. With `timeout` (ms) it auto-clears after that delay.

#### Parameters

##### text

`string`

##### timeout?

`number`

#### Returns

`void`
