# Function: useGraphCanvasOptions()

> **useGraphCanvasOptions**(): \[[`CanvasConfig`](../interfaces/CanvasConfig.md), (`patch`) => `void`\]

Subscribe to the canvas's serialisable config. Returns `[options, update]` —
`options` is the current [CanvasConfig](../interfaces/CanvasConfig.md), read **reactively** from
`store.view.definition` (the source of truth) via [useStore](useStore.md), so the
component re-renders only when the config slice actually changes (no coarse
`options:change` bus copy). `update` is the same patcher as
[useGraphCanvasUpdate](useGraphCanvasUpdate.md). Drive a settings UI from this.

## Returns

\[[`CanvasConfig`](../interfaces/CanvasConfig.md), (`patch`) => `void`\]
