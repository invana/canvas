# Function: useViewTarget()

> **useViewTarget**(`options?`, `canvas?`): `ViewTarget`

Defined in: [canvas-react/src/hooks/useViewTarget.ts:23](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewTarget.ts#L23)

Reactive view of the single node/edge currently targeted for **read-only
property viewing**, driven by a `ClickViewBehaviour`'s `view:change` event.
Returns `null` when no element is targeted (or the behaviour isn't
registered).

The read-only counterpart of [useInspectTarget](useInspectTarget.md): that one feeds an
editor (`ClickInspectBehaviour`), this one feeds a viewer
(`ClickViewBehaviour`). Both are distinct from [useSelection](useSelection.md) (which can
hold many elements) — this is always the *one* element a viewer should show.

## Parameters

### options?

[`UseViewTargetOptions`](../interfaces/UseViewTargetOptions.md) = `{}`

### canvas?

`Canvas`

## Returns

`ViewTarget`
