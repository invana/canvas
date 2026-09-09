# Type Alias: EasingName

> **EasingName** = `"linear"` \| `"easeInOutSine"` \| `"easeOutCubic"` \| `"easeInOutCubic"` \| `"easeOutQuad"`

Stable string keys for the built-in easings.

Serializable easing handle — use this (not an `Easing` function) anywhere an
easing must live in JSON config or bind to a `<select>` / lil-gui dropdown
(e.g. a layout's `transitionEase`). Resolve to the function with
[resolveEasing](../functions/resolveEasing.md).
