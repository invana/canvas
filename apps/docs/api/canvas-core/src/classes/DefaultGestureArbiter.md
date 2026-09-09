# Class: DefaultGestureArbiter

The default in-memory [GestureArbiter](../interfaces/GestureArbiter.md). Renderer-free and DOM-free: it
knows nothing about pointers, only about who asked first.

## Implements

- [`GestureArbiter`](../interfaces/GestureArbiter.md)

## Constructors

### Constructor

> **new DefaultGestureArbiter**(): `DefaultGestureArbiter`

#### Returns

`DefaultGestureArbiter`

## Accessors

### owner

#### Get Signature

> **get** **owner**(): `string`

The current owner id, or `null` when the gesture is free.

##### Returns

`string`

The current owner id, or `null` when the gesture is free.

#### Implementation of

[`GestureArbiter`](../interfaces/GestureArbiter.md).[`owner`](../interfaces/GestureArbiter.md#owner)

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

[`GestureClaimOptions`](../interfaces/GestureClaimOptions.md)

#### Returns

() => `void`

#### Implementation of

[`GestureArbiter`](../interfaces/GestureArbiter.md).[`claim`](../interfaces/GestureArbiter.md#claim)

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

#### Implementation of

[`GestureArbiter`](../interfaces/GestureArbiter.md).[`onOwnerChange`](../interfaces/GestureArbiter.md#onownerchange)
