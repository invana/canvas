# Type Alias: BackgroundMode

> **BackgroundMode** = `"auto"` \| `"light"` \| `"dark"`

Defined in: [canvas/src/layers/BackgroundLayer.ts:46](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/layers/BackgroundLayer.ts#L46)

Mode selector for light/dark colour resolution. `'auto'` follows the active
theme published on `ctx.theme` (the canvas no longer reads
`prefers-color-scheme` itself — the domain `ThemeBehaviour` is the sole
publisher); `'light'` / `'dark'` pin explicitly regardless of the theme.
