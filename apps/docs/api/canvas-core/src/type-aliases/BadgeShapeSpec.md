# Type Alias: BadgeShapeSpec

> **BadgeShapeSpec** = `Omit`\<[`BaseShapeSpec`](../interfaces/BaseShapeSpec.md), `"x"` \| `"y"`\> & `object`

Shape spec accepted by `BadgeOptions.shape` — every `BaseShapeSpec` field
except `x` / `y` (placement supplies those), plus an open index for the
kind-specific fields each shape adds (`radius` on `CircleSpec`, `width` /
`height` / `cornerRadius` on `RectSpec`, future shape extras).

The renderer doesn't validate kind-specific fields here — that happens
inside the registered shape's constructor. Keeping this type open avoids
enumerating every shape kind in the badge type surface.
