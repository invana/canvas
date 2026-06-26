# Type Alias: EasingName

> **EasingName** = `"linear"` \| `"easeInOutSine"` \| `"easeOutCubic"` \| `"easeInOutCubic"` \| `"easeOutQuad"`

Defined in: [canvas/src/primitives/animation/easings.ts:32](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/animation/easings.ts#L32)

Stable string keys for the built-in easings.

Serializable easing handle — use this (not an `Easing` function) anywhere an
easing must live in JSON config or bind to a `<select>` / lil-gui dropdown
(e.g. a layout's `transitionEase`). Resolve to the function with
[resolveEasing](../functions/resolveEasing.md).
