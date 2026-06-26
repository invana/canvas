# Function: useLock()

> **useLock**(`options?`, `canvas?`): [`UseLockResult`](../interfaces/UseLockResult.md)

Defined in: [canvas-react/src/hooks/useLock.ts:30](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useLock.ts#L30)

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
