# Interface: DevInfoLayerFields

Flat form-field shape the `@invana/forms` generator renders. The engine's
`margin: number | { x?, y? }` union is flattened into two scalar fields —
`marginX` / `marginY` (see `mapping.ts`), since a single field can't be both.

## Properties

### accentColor?

> `optional` **accentColor?**: `string`

***

### backgroundColor?

> `optional` **backgroundColor?**: `string`

***

### corner?

> `optional` **corner?**: `DevInfoCorner`

***

### fontSize?

> `optional` **fontSize?**: `number`

***

### marginX?

> `optional` **marginX?**: `number`

Horizontal inset in px. Maps into `margin`.

***

### marginY?

> `optional` **marginY?**: `number`

Vertical inset in px. Maps into `margin`.

***

### opacity?

> `optional` **opacity?**: `number`

***

### textColor?

> `optional` **textColor?**: `string`
