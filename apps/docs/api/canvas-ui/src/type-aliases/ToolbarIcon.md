# Type Alias: ToolbarIcon

> **ToolbarIcon** = `ComponentType`\<\{ `className?`: `string`; `size?`: `number` \| `string`; \}\>

Icon component accepted by the UI controls. These components are
**icon-agnostic** — the consumer passes the icon (e.g. a `lucide-react`
glyph), so the package takes on no icon dependency. Any component that renders
from `size` / `className` satisfies this (lucide icons do).
