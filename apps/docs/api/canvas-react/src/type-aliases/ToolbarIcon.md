# Type Alias: ToolbarIcon

> **ToolbarIcon** = `ComponentType`\<\{ `className?`: `string`; `size?`: `number` \| `string`; \}\>

Defined in: [canvas-react/src/components/types.ts:9](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/components/types.ts#L9)

Icon component accepted by the UI controls. These components are
**icon-agnostic** — the consumer passes the icon (e.g. a `lucide-react`
glyph), so the package takes on no icon dependency. Any component that renders
from `size` / `className` satisfies this (lucide icons do).
