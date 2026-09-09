# Interface: UseCanvasMessageResult

## Properties

### clearMessage

> **clearMessage**: () => `void`

Clear the current message.

#### Returns

`void`

***

### message

> **message**: `string`

The message currently showing, or `null` when none is.

***

### showMessage

> **showMessage**: (`text`, `timeout?`) => `void`

Show a message. With `timeout` (ms) it auto-clears after that delay.

#### Parameters

##### text

`string`

##### timeout?

`number`

#### Returns

`void`
