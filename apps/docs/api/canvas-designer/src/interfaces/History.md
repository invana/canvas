# Interface: History\<T\>

Minimal undo/redo history for a single value (the card template).

- `set(next)` — replace the present **without** recording (transient: live
  drags / typing, so a gesture isn't a hundred undo steps).
- `commit(next, tag?)` — record the present onto the undo stack, then set
  `next`. Consecutive commits sharing a `tag` within a short window
  **coalesce** into one entry (so editing a field reads as one undo step).
- `record(snapshot)` — push an explicit restore point (e.g. the pre-drag
  state captured on pointer-down), used when the change itself went through
  transient `set`s.
- `undo` / `redo` / `reset`.

## Type Parameters

### T

`T`

## Properties

### canRedo

> **canRedo**: `boolean`

***

### canUndo

> **canUndo**: `boolean`

***

### commit

> **commit**: (`next`, `tag?`) => `void`

#### Parameters

##### next

`T`

##### tag?

`string`

#### Returns

`void`

***

### record

> **record**: (`snapshot`) => `void`

#### Parameters

##### snapshot

`T`

#### Returns

`void`

***

### redo

> **redo**: () => `void`

#### Returns

`void`

***

### reset

> **reset**: (`next`) => `void`

#### Parameters

##### next

`T`

#### Returns

`void`

***

### set

> **set**: (`next`) => `void`

#### Parameters

##### next

`T`

#### Returns

`void`

***

### state

> **state**: `T`

***

### undo

> **undo**: () => `void`

#### Returns

`void`

***

### version

> **version**: `number`

Bumps on **external jumps** (undo / redo / reset) but NOT on live edits
(set / commit). Key uncontrolled forms on it so they re-seed after a jump
without resetting mid-typing.
