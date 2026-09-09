# Interface: History

Undo/redo over a [ReactiveStore](../../../canvas/src/interfaces/ReactiveStore.md). Built on the patch+inverse stream.

## Methods

### canRedo()

> **canRedo**(): `boolean`

#### Returns

`boolean`

***

### canUndo()

> **canUndo**(): `boolean`

#### Returns

`boolean`

***

### clear()

> **clear**(): `void`

Drop all recorded steps.

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Stop recording (and release the change subscription).

#### Returns

`void`

***

### redo()

> **redo**(): `void`

#### Returns

`void`

***

### undo()

> **undo**(): `void`

#### Returns

`void`
