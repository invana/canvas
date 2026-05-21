# Interface: GroupOptions

Defined in: [graph/src/layer/types.ts:757](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L757)

Marks a node as a **compound group** — a visual frame drawn behind its
descendants (children point to it via `parentId`). The presence of this
field on a node's resolved [NodeStyle](NodeStyle.md) is the only signal the layer
uses to decide whether to apply group semantics; the structural shape
(`style.shape`) stays a regular `rect` / `circle` / etc.

Group semantics, in summary:

- **Expanded state** (`collapsed !== true`):
  - The node renders behind its children (z-index pushed underneath when
    `behindChildren !== false`) and is **non-hittable** — pointer events
    pass through the frame to the canvas background. The frame is a pure
    drawing, not an interactive node.
  - With `autoFit: true`, the layer recomputes `width` / `height` (rect)
    or `radius` (circle) every flush from the children's bounding box,
    plus `padding` and optional `headerHeight`. The declared `width` /
    `height` / `radius` fields act as a **lower bound** in this mode.
  - With `autoFit: false`, the layer uses the declared `width` / `height`
    / `radius` literally; children may visually leak outside.

- **Collapsed state** (`collapsed === true`):
  - The node renders as a normal interactive node (`hittable: true`,
    default z-order). All descendants are hidden from the renderer; edges
    pointing at a hidden descendant are re-routed to the nearest visible
    collapsed-group ancestor at render time (no mutation to the edge data).
  - The layer synthesises a count badge showing the number of hidden
    descendants. The `+`/`−` toggle is rendered via the
    ToggleDecorationStyle decoration on the group — wire up
    `CollapseExpandBehaviour` to make the toggle clickable.

Nested groups fall out of the `parentId` chain for free: a group node
whose own `parentId` points at another group becomes a sub-group; the
recompute walks deepest-first.

Membership uses the existing `GraphNode.parentId` (single hierarchy field
shared with tree structures) — no separate group-membership concept.

## Properties

### autoFit?

> `readonly` `optional` **autoFit?**: `boolean`

Defined in: [graph/src/layer/types.ts:763](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L763)

When `true`, the frame's size tracks the bounding box of its direct
children (computed every flush). When `false`, the declared `width` /
`height` / `radius` are used verbatim. Default `false`.

***

### behindChildren?

> `readonly` `optional` **behindChildren?**: `boolean`

Defined in: [graph/src/layer/types.ts:785](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L785)

Frame renders at `style.zIndex − 1` so descendants paint on top. Set to
`false` to keep the frame at its declared z-index (and let descendants
paint underneath when their z-index is lower). Default `true`.

***

### collapsed?

> `readonly` `optional` **collapsed?**: `boolean`

Defined in: [graph/src/layer/types.ts:779](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L779)

True = render the group as a collapsed super-node (children hidden,
+/- toggle shows `+`, count badge shows the hidden descendant count).
Toggle through `CollapseExpandBehaviour` or by updating this field
directly via `store.updateNode`. Default `false`.

***

### headerHeight?

> `readonly` `optional` **headerHeight?**: `number`

Defined in: [graph/src/layer/types.ts:792](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L792)

Optional header band height (px) added above the children bbox. The
frame still draws as a single rect / circle — `headerHeight` only
shifts the auto-fit recompute so the label area at the top stays clear
of children. Default `0`.

***

### height?

> `readonly` `optional` **height?**: `number`

Defined in: [graph/src/layer/types.ts:799](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L799)

Sibling of [width](#width) for `kind: 'rect'`.

***

### padding?

> `readonly` `optional` **padding?**: `number`

Defined in: [graph/src/layer/types.ts:772](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L772)

Inset around the children bbox before the frame outline. Default `16`.

***

### radius?

> `readonly` `optional` **radius?**: `number`

Defined in: [graph/src/layer/types.ts:804](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L804)

Floor (with `autoFit`) or fixed (without) radius. Circle frames only.
Ignored for rect frames.

***

### togglePlacement?

> `readonly` `optional` **togglePlacement?**: `any`

Defined in: [graph/src/layer/types.ts:823](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L823)

Where the auto-attached `+` / `−` toggle sits relative to the group's
frame. Two forms:

- **Keyword** — one of the TogglePlacement aliases
  (`'bottom'`, `'inside-bottom'`, `'top-right'`, `'bottom-left'`, …).
  Resolved against the host's AABB by the toggle decoration.
- **Shape-local coords** — `{ x, y }`, an absolute point inside the
  host shape's local frame (centre-relative for `circle`, top-left-
  relative for `rect`). Use this when none of the keywords place the
  toggle where you want it (diagonal offsets, mock-specific spots).

Default `'bottom'` — centred just below the silhouette, matching the
"small bubble attached to the rim" pattern in the reference UI.
Clicks are dispatched at the canvas level by `CollapseExpandBehaviour`,
so the toggle remains clickable regardless of whether the resolved
position falls inside or outside the host's hit area.

***

### userResizable?

> `readonly` `optional` **userResizable?**: `boolean`

Defined in: [graph/src/layer/types.ts:770](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L770)

When `true`, `GroupResizeBehaviour` mounts corner / radial handle
decorations on this group and lets the user drag to resize. Composes
with `autoFit` per the floor rule on `width` / `height` / `radius`.
Default `false`.

***

### width?

> `readonly` `optional` **width?**: `number`

Defined in: [graph/src/layer/types.ts:797](https://github.com/invana/canvas/blob/1a808c5a9a1fe77fb1c6d5a7dcaf728db16cdbd4/packages/graph/src/layer/types.ts#L797)

Floor (with `autoFit`) or fixed (without) width. Rect frames only.
Ignored for circle frames.
