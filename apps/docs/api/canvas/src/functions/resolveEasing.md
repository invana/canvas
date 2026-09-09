# Function: resolveEasing()

> **resolveEasing**(`name`, `fallback?`): [`Easing`](../type-aliases/Easing.md)

Resolve an [EasingName](../type-aliases/EasingName.md) (or `undefined`) to its `Easing` function,
falling back to `fallback` (default [easeOutCubic](../variables/easeOutCubic.md)) for an unknown or
missing name. Lets config carry a serializable easing key while runtime code
gets the function.

## Parameters

### name

[`EasingName`](../type-aliases/EasingName.md)

### fallback?

[`Easing`](../type-aliases/Easing.md)

## Returns

[`Easing`](../type-aliases/Easing.md)
