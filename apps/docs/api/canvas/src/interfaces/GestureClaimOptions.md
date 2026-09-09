# Interface: GestureClaimOptions

Options for a single [GestureArbiter.claim](GestureArbiter.md#claim).

## Properties

### onRevoke?

> `optional` **onRevoke?**: () => `void`

Called when this claim is pre-empted by a higher-priority owner. The seam
a long-running gesture uses to abort cleanly instead of continuing to move
things while somebody else drives the pointer. Not called on a normal
release, nor when the same owner re-claims.

#### Returns

`void`

***

### priority?

> `optional` **priority?**: `number`

Higher wins. A claim is refused when another owner holds the gesture at an
equal or higher priority; a strictly higher priority **pre-empts** the
current owner (whose [GestureClaimOptions.onRevoke](#onrevoke) fires and whose
release function goes inert). Default `0` — every built-in behaviour claims
at the default, so no pre-emption happens unless a consumer asks for it.
