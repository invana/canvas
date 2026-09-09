# Function: useBehaviourRegistration()

> **useBehaviourRegistration**(`create`, `id`, `enabled`, `identity`): `void`

Shared registration lifecycle for behaviour wrappers. One place owns the two
effects every wrapper needs:

1. **Register / unregister** keyed on `identity` (the behaviour `id`, plus
   `targetLayerId` for layer-scoped behaviours). Construction options are read once
   via `create()` — change an identity value (or the component `key`) to
   recreate with new options.
2. **Reactive `enabled`** — toggles via `canvas.behaviours.setEnabled(id, …)`
   whenever the `enabled` prop changes, *without* re-registering. This is
   what lets a toolbar flip a behaviour on/off declaratively.

`setEnabled` no-ops on an unknown id and on a no-op state change, and effects
run top-down, so the register effect has always run before the enable effect.

## Parameters

### create

() => [`IBehaviour`](../../../canvas/src/interfaces/IBehaviour.md)

Factory that constructs the engine behaviour from current props.

### id

`string`

Behaviour id (used for unregister + setEnabled).

### enabled

`boolean`

Desired enabled state; reconciled on every change.

### identity

readonly `unknown`[]

Values that force a recreate when changed (e.g. `[id]` or `[id, targetLayerId]`).

## Returns

`void`
