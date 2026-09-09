# Interface: UseSelectModeResult

## Properties

### mode

> **mode**: `string`

Currently-active mode key.

***

### modeOptions

> **modeOptions**: `Record`\<`string`, `string`\>

Key → label map for a picker.

***

### setMode

> **setMode**: (`mode`) => `void`

Switch mode: enables that mode's behaviour, disables the others.

#### Parameters

##### mode

`string`

#### Returns

`void`
