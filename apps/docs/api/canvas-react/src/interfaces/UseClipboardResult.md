# Interface: UseClipboardResult

## Properties

### canPaste

> **canPaste**: `boolean`

True iff the buffer has content to paste.

***

### copy

> **copy**: () => `void`

Copy the selection to the buffer.

#### Returns

`void`

***

### cut

> **cut**: () => `void`

Copy the selection to the buffer, then delete it (one undoable step).

#### Returns

`void`

***

### hasSelection

> **hasSelection**: `boolean`

True iff something is selected.

***

### paste

> **paste**: () => `void`

Paste the buffer (offset + re-id'd) and select the pasted items.

#### Returns

`void`

***

### remove

> **remove**: () => `void`

Delete the selection (one undoable step).

#### Returns

`void`
