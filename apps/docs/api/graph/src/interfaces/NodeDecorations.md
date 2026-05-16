# Interface: NodeDecorations

Defined in: [graph/src/layer/types.ts:446](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L446)

Slot-based decoration attachments on a node. Each slot holds at most one
decoration; `null` clears it. State overlays can swap a slot's spec
(e.g., `state.hover.decorations.halo = {...}` adds a halo on hover).

Slot names match the canvas renderer's decoration-slot model:
`setDecoration(id, slot, spec)`.

Decoration style payloads come from `@invana/canvas` — typed loosely as
`unknown` here until the canvas package re-exports named style types for
each decoration kind (HaloStyle, GlowStyle, …).

## Indexable

> \[`slot`: `string`\]: `unknown`

Open-ended for any registered decoration slot.

## Properties

### border?

> `readonly` `optional` **border?**: `unknown`

Defined in: [graph/src/layer/types.ts:454](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L454)

Slot 'border' — border / dash-border / marching-ants.

***

### glow?

> `readonly` `optional` **glow?**: `unknown`

Defined in: [graph/src/layer/types.ts:450](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L450)

Slot 'glow'.

***

### halo?

> `readonly` `optional` **halo?**: `unknown`

Defined in: [graph/src/layer/types.ts:448](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L448)

Slot 'halo' — `HaloStyle` from @invana/canvas.

***

### pulse?

> `readonly` `optional` **pulse?**: `unknown`

Defined in: [graph/src/layer/types.ts:452](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L452)

Slot 'pulse' — pulse-ring decoration.

***

### ring?

> `readonly` `optional` **ring?**: `unknown`

Defined in: [graph/src/layer/types.ts:456](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L456)

Slot 'ring'.
