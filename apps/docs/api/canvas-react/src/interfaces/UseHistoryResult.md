# Interface: UseHistoryResult

## Properties

### canRedo

> **canRedo**: `boolean`

***

### canUndo

> **canUndo**: `boolean`

***

### redo

> **redo**: () => `void`

Re-apply the most recently undone change. No-op when `!canRedo`.

#### Returns

`void`

***

### redraw

> **redraw**: () => `void`

Force a full re-render of the target layer (render pass; not undoable).

#### Returns

`void`

***

### undo

> **undo**: () => `void`

Revert the most recent change. No-op when `!canUndo`.

#### Returns

`void`
