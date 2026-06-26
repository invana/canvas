# Interface: UseHistoryResult

Defined in: [canvas-react/src/hooks/useHistory.ts:12](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L12)

## Properties

### canRedo

> **canRedo**: `boolean`

Defined in: [canvas-react/src/hooks/useHistory.ts:20](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L20)

***

### canUndo

> **canUndo**: `boolean`

Defined in: [canvas-react/src/hooks/useHistory.ts:19](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L19)

***

### redo

> **redo**: () => `void`

Defined in: [canvas-react/src/hooks/useHistory.ts:16](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L16)

Re-apply the most recently undone change. No-op when `!canRedo`.

#### Returns

`void`

***

### redraw

> **redraw**: () => `void`

Defined in: [canvas-react/src/hooks/useHistory.ts:18](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L18)

Force a full re-render of the target layer (render pass; not undoable).

#### Returns

`void`

***

### undo

> **undo**: () => `void`

Defined in: [canvas-react/src/hooks/useHistory.ts:14](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useHistory.ts#L14)

Revert the most recent change. No-op when `!canUndo`.

#### Returns

`void`
