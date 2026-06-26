# Type Alias: ColorRole

> **ColorRole** = `"surface"` \| `"cardBg"` \| `"foreground"` \| `"heading"` \| `"muted"` \| `"accent"` \| `"divider"` \| `"stroke"` \| `"selectionRing"` \| `"hoverRing"`

Defined in: graph/src/theme/types.ts:18

Semantic colour variables — the canvas analogue of CSS custom properties.
Styling templates reference a role (`title → heading`); the active
[Theme](../interfaces/Theme.md) defines what that role resolves to per light/dark variant.
