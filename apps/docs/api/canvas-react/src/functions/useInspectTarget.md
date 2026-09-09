# Function: useInspectTarget()

> **useInspectTarget**(`options?`, `canvas?`): `InspectTarget`

Reactive view of the single node/edge currently targeted for editing, driven
by a `ClickInspectBehaviour`'s `inspect:change` event. Returns `null` when no
element is targeted (or the behaviour isn't registered).

Distinct from [useSelection](useSelection.md): selection can hold many elements (for
highlighting / multi-drag), whereas this is always the *one* element a
property editor should edit.

## Parameters

### options?

[`UseInspectTargetOptions`](../interfaces/UseInspectTargetOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

`InspectTarget`
