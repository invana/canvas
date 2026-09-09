# Type Alias: BackgroundMode

> **BackgroundMode** = `"auto"` \| `"light"` \| `"dark"`

Mode selector for light/dark colour resolution. `'auto'` follows the active
theme published on `ctx.theme` (the canvas no longer reads
`prefers-color-scheme` itself — the domain `ThemeBehaviour` is the sole
publisher); `'light'` / `'dark'` pin explicitly regardless of the theme.
