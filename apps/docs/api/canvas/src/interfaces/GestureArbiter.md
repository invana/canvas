# Interface: GestureArbiter

Arbitrates exclusive ownership of the pointer gesture. Reached as
`ctx.gestures`; provided per-`Canvas`.

## Properties

### owner

> `readonly` **owner**: `string`

The current owner id, or `null` when the gesture is free.

## Methods

### claim()

> **claim**(`owner`, `opts?`): () => `void`

Try to take the gesture for `owner` (by convention the behaviour's `id`).
Returns a **release** function on success, or `null` when another owner
already holds it at an equal-or-higher priority — in which case the caller
should not start its gesture.

Release is idempotent and identity-checked: calling it after the claim has
already ended (or been pre-empted) does nothing, so it can never clear
somebody else's claim.

#### Parameters

##### owner

`string`

##### opts?

[`GestureClaimOptions`](GestureClaimOptions.md)

#### Returns

() => `void`

***

### onOwnerChange()

> **onOwnerChange**(`listener`): () => `void`

Subscribe to ownership changes — the hook `DragPanBehaviour` uses to
suspend and restore camera panning. Fires with the new owner (`null` when
released). Returns an unsubscribe function.

#### Parameters

##### listener

(`owner`) => `void`

#### Returns

() => `void`
