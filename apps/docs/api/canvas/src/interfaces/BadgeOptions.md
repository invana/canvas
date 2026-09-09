# Interface: BadgeOptions

Options for `PrimitivesRenderer.setBadge`. The `shape` field carries the
full shape spec (any kind + fill + stroke + kind-specific fields);
placement is interpreted differently depending on the host kind (shape
AABB vs. connector path) — see [placement](#placement).

The path-only fields ([pathOffset](#pathoffset), [autoRotate](#autorotate),
[keepUpright](#keepupright)) are ignored when the host is a shape.

## Properties

### autoRotate?

> `readonly` `optional` **autoRotate?**: `boolean`

**Connector hosts only.** When `true`, the badge's `rotation` follows
the path tangent at the anchor point — i.e. the badge tilts to read
along the line. Default `false`. Ignored on shape hosts.

***

### decorations?

> `readonly` `optional` **decorations?**: `Readonly`\<`Record`\<`string`, [`DecorationSpec`](../../../renderer-pixijs/src/interfaces/DecorationSpec.md)\>\>

Decorations applied to the badge shape, keyed by slot. Internally each
entry becomes a `setDecoration(badgeId, slot, spec)` call, so any
registered decoration kind (glow, ring, marching-ants, …) works.

***

### effects?

> `readonly` `optional` **effects?**: `Readonly`\<`Record`\<`string`, [`EffectSpec`](../../../renderer-pixijs/src/interfaces/EffectSpec.md)\>\>

Effects applied to the badge shape, keyed by slot. Internally each entry
becomes a `setEffect(badgeId, slot, spec)` call, so any registered shape
effect (`shake`, `breathing`, …) modulates the badge's transform / style
the same way it would a free-standing shape.

Lifecycle parity with `decorations`: replacing the badge via `setBadge`
disposes prior effects; removing the host disposes the badge and all its
effects.

***

### keepUpright?

> `readonly` `optional` **keepUpright?**: `boolean`

**Connector hosts only.** When [autoRotate](#autorotate) is `true`, flip the
badge by 180° if the tangent points "downwards" so its top edge always
faces the viewer (text remains readable on every edge orientation).
Default `true`. Ignored on shape hosts.

***

### offsetX?

> `readonly` `optional` **offsetX?**: `number`

Pixel offset applied after origin resolution. Default `0` for both.

***

### offsetY?

> `readonly` `optional` **offsetY?**: `number`

***

### origin?

> `readonly` `optional` **origin?**: `"center"` \| [`NamedBadgePlacement`](../type-aliases/NamedBadgePlacement.md)

Which point of the badge's own AABB lands at the host anchor.

- **`undefined`** (default): mirror of `placement`. The badge sits fully
  outside the host edge — e.g. `placement: 'top-right'` puts the badge's
  bottom-left corner at the host's top-right corner. (When `placement`
  is a raw `{x, y}` point with no inherent mirror, the default falls
  back to `'center'`.)
- **`'center'`**: the badge centres on the anchor and half-overhangs
  the host edge (the gray "A" pattern in the reference design).
- **A named `BadgePlacement`**: any of the eight points on the badge.
  The raw `{x, y}` variant of `BadgePlacement` is not valid here —
  origin is always a named point on the badge.

***

### pathOffset?

> `readonly` `optional` **pathOffset?**: `number`

**Connector hosts only.** Shift the path-anchor along the local tangent
direction (positive = forward toward `'end'`, negative = backward toward
`'start'`). Useful for nudging a `'middle'`-anchored badge sideways
along the line without changing its `t`. Ignored on shape hosts.

***

### placement

> `readonly` **placement**: [`BadgePlacement`](../type-aliases/BadgePlacement.md) \| [`ConnectorBadgePlacement`](../type-aliases/ConnectorBadgePlacement.md)

Where the badge attaches to its host.

- **Shape host** — one of [BadgePlacement](../type-aliases/BadgePlacement.md): a named AABB anchor
  (corner / edge midpoint) or a raw `{x, y}` world point.
- **Connector host** — one of [ConnectorBadgePlacement](../type-aliases/ConnectorBadgePlacement.md): `'start'`,
  `'middle'`, `'end'`, or an arc-length `t ∈ [0, 1]`.

The host kind is resolved at `setBadge` time from the `hostId`; mismatches
(a named-AABB placement on a connector host, or `'middle'` on a shape
host) throw with a clear error.

***

### shape

> `readonly` **shape**: `BadgeShapeSpec`

The badge plate as a shape spec, sans `x` / `y` (placement provides position).
