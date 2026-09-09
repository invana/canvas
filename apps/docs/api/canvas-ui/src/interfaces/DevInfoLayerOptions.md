# Interface: DevInfoLayerOptions

The subset of `DevInfoLayerOptions` this editor produces — a serialisable
patch. The base `id` / `enabled` (and `zIndex`, init-only) fields are out of
scope; only the display knobs round-trip. `margin` keeps the engine's
`number | { x?, y? }` encoding (per-axis inset), re-fused in `mapping.ts`.

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

Accent / header colour (`#rrggbb`).

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

Overlay background CSS colour (may be `rgba(...)`, hence a free string).

***

### corner?

> `optional` **corner?**: `DevInfoCorner`

Which corner to anchor the overlay.

***

### fontSize?

> `optional` **fontSize?**: `number`

Font size in px.

***

### margin?

> `optional` **margin?**: `number` \| \{ `x?`: `number`; `y?`: `number`; \}

Inset from the chosen corner in screen pixels — uniform or per-axis.

***

### opacity?

> `optional` **opacity?**: `number`

Panel opacity 0–1.

***

### textColor?

> `optional` **textColor?**: `string`

Text colour (`#rrggbb`).
