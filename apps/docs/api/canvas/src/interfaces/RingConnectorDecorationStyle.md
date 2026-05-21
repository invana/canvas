# Interface: RingConnectorDecorationStyle

Defined in: [canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts:18](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts#L18)

Static halo-style ring painted underneath a connector's path — a single
thick stroke tracing the host's routed geometry, behind the host stroke.

Connectors are 1-D (no `inset`), so a true detached parallel-offset ring
would need separately routed geometry. This decoration takes the simpler
"single wider stroke" route: paint one band of `width` px behind the
host, optionally dashed, with `markerHalo` so the host's end markers
land inside the same band. Composes with `width` < host stroke for a
subtle outline or `width` > host stroke for a "highlighted edge" feel.

For a thicker / softer feathered halo, use `GlowConnectorDecoration`
instead — it stacks multiple layers with alpha falloff.

## Properties

### alpha?

> `readonly` `optional` **alpha?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts:23](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts#L23)

Halo alpha, `[0, 1]`. Default `0.6`.

***

### color

> `readonly` **color**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts:19](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts#L19)

***

### dashArray?

> `readonly` `optional` **dashArray?**: readonly \[`number`, `number`\]

Defined in: [canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts:25](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts#L25)

Dashed band — `[dashLength, gapLength]` in px. Default solid.

***

### width?

> `readonly` `optional` **width?**: `number`

Defined in: [canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts:21](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/canvas/src/primitives/decorations/connector/RingConnectorDecoration.ts#L21)

Halo band thickness in px. Default `6`.
