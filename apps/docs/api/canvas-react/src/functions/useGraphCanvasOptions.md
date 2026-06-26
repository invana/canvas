# Function: useGraphCanvasOptions()

> **useGraphCanvasOptions**(): \[[`CanvasConfig`](../interfaces/CanvasConfig.md), (`patch`) => `void`\]

Defined in: [canvas-react/src/hooks/useGraphCanvasOptions.ts:13](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useGraphCanvasOptions.ts#L13)

Subscribe to the canvas's serialisable config. Returns
`[options, update]` — `options` is the current [CanvasConfig](../interfaces/CanvasConfig.md) snapshot
(`canvas.get()`), kept in sync via the `options:change` bus event, and
`update` is the same patcher as [useGraphCanvasUpdate](useGraphCanvasUpdate.md). Drive a
settings UI from this.

## Returns

\[[`CanvasConfig`](../interfaces/CanvasConfig.md), (`patch`) => `void`\]
