# Interface: UseSelectModeResult

Defined in: [canvas-react/src/hooks/useSelectMode.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelectMode.ts#L13)

## Properties

### mode

> **mode**: `string`

Defined in: [canvas-react/src/hooks/useSelectMode.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelectMode.ts#L15)

Currently-active mode key.

***

### modeOptions

> **modeOptions**: `Record`\<`string`, `string`\>

Defined in: [canvas-react/src/hooks/useSelectMode.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelectMode.ts#L17)

Key → label map for a picker.

***

### setMode

> **setMode**: (`mode`) => `void`

Defined in: [canvas-react/src/hooks/useSelectMode.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useSelectMode.ts#L19)

Switch mode: enables that mode's behaviour, disables the others.

#### Parameters

##### mode

`string`

#### Returns

`void`
