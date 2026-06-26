# Interface: UseClipboardResult

Defined in: [canvas-react/src/hooks/useClipboard.ts:15](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L15)

## Properties

### canPaste

> **canPaste**: `boolean`

Defined in: [canvas-react/src/hooks/useClipboard.ts:25](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L25)

True iff the buffer has content to paste.

***

### copy

> **copy**: () => `void`

Defined in: [canvas-react/src/hooks/useClipboard.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L19)

Copy the selection to the buffer.

#### Returns

`void`

***

### cut

> **cut**: () => `void`

Defined in: [canvas-react/src/hooks/useClipboard.ts:17](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L17)

Copy the selection to the buffer, then delete it (one undoable step).

#### Returns

`void`

***

### hasSelection

> **hasSelection**: `boolean`

Defined in: [canvas-react/src/hooks/useClipboard.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L27)

True iff something is selected.

***

### paste

> **paste**: () => `void`

Defined in: [canvas-react/src/hooks/useClipboard.ts:21](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L21)

Paste the buffer (offset + re-id'd) and select the pasted items.

#### Returns

`void`

***

### remove

> **remove**: () => `void`

Defined in: [canvas-react/src/hooks/useClipboard.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useClipboard.ts#L23)

Delete the selection (one undoable step).

#### Returns

`void`
