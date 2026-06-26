# Function: resolveEasing()

> **resolveEasing**(`name`, `fallback?`): [`Easing`](../type-aliases/Easing.md)

Defined in: [canvas/src/primitives/animation/easings.ts:52](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/animation/easings.ts#L52)

Resolve an [EasingName](../type-aliases/EasingName.md) (or `undefined`) to its `Easing` function,
falling back to `fallback` (default [easeOutCubic](../variables/easeOutCubic.md)) for an unknown or
missing name. Lets config carry a serializable easing key while runtime code
gets the function.

## Parameters

### name

[`EasingName`](../type-aliases/EasingName.md)

### fallback?

[`Easing`](../type-aliases/Easing.md) = `easeOutCubic`

## Returns

[`Easing`](../type-aliases/Easing.md)
