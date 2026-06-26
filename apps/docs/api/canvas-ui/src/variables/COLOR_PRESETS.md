# Variable: COLOR\_PRESETS

> `const` **COLOR\_PRESETS**: readonly \[\{ `label`: `"Slate"`; `value`: `"#9ca3af"`; \}, \{ `label`: `"Red"`; `value`: `"#ef4444"`; \}, \{ `label`: `"Amber"`; `value`: `"#f59e0b"`; \}, \{ `label`: `"Emerald"`; `value`: `"#10b981"`; \}, \{ `label`: `"Blue"`; `value`: `"#3b82f6"`; \}, \{ `label`: `"Violet"`; `value`: `"#8b5cf6"`; \}\]

Defined in: [canvas-ui/src/presets/colors.ts:7](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-ui/src/presets/colors.ts#L7)

Shared colour palette offered as swatch presets on every colour field across
the editors (node fill / stroke / label, and the upcoming edge / canvas
surfaces). Hex strings so a seeded `#rrggbb` value highlights its matching
preset. A specific editor can pass its own palette instead where it matters.
