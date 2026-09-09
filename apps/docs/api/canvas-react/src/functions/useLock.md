# Function: useLock()

> **useLock**(`options?`, `canvas?`): [`UseLockResult`](../interfaces/UseLockResult.md)

View lock — disables a configurable set of behaviours (pan + node drag by
default) while keeping zoom available. "Lock" is app policy, not an engine
concept, so which behaviours it disables is configurable. State is owned by
the hook.

## Parameters

### options?

[`UseLockOptions`](../interfaces/UseLockOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

[`UseLockResult`](../interfaces/UseLockResult.md)
