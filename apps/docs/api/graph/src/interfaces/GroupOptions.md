# Interface: GroupOptions

Marks a node as a **compound group** — a visual frame drawn behind its
descendants (children point to it via `parentId`). The presence of this
field on a node's resolved [NodeStyle](NodeStyle.md) is the only signal the layer
uses to decide whether to apply group semantics; the structural shape
(`style.shape`) stays a regular `rect` / `circle` / etc.

Group semantics, in summary:

Whether a frame is open or closed is **not** part of these options — it's
the [COLLAPSED\_STATE](../variables/COLLAPSED_STATE.md) node state (`store.setNodeState(id,
'collapsed')`, or `states: ['collapsed']` in the data to start closed).
These options describe the frame itself; the state describes its condition,
and `state.collapsed` overlays describe how it looks in that condition.

- **Expanded** (the `collapsed` state absent):
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

- **Collapsed** (the [COLLAPSED\_STATE](../variables/COLLAPSED_STATE.md) state active):
  - The node renders as a normal interactive node (`hittable: true`,
    default z-order). All descendants are hidden from the renderer; edges
    pointing at a hidden descendant are re-routed to the nearest visible
    collapsed-group ancestor at render time (no mutation to the edge data).
  - Auto-fit is skipped and the resolved shape closes to its own minimal
    form (`ShapeCtor.collapsedOf` — a `tabbed-rect` becomes its tab; a
    `rect` / `circle` has none and keeps its declared size). Author
    `state.collapsed.shape` to describe the closed silhouette yourself
    instead — declaring a shape there opts out of the minimal form.
  - The `+`/`−` toggle is rendered via the [ToggleDecorationStyle](../../../canvas/src/variables/SpecStore.md)
    decoration on the group — wire up `CollapseExpandBehaviour` to make the
    toggle clickable. A count of the hidden descendants is available too,
    opt-in via [GroupOptions.showCollapsedCount](#showcollapsedcount).

Nested groups fall out of the `parentId` chain for free: a group node
whose own `parentId` points at another group becomes a sub-group; the
recompute walks deepest-first.

Membership uses the existing `GraphNode.parentId` (single hierarchy field
shared with tree structures) — no separate group-membership concept.

## Properties

### autoFit?

> `readonly` `optional` **autoFit?**: `boolean`

When `true`, the frame's size tracks the bounding box of its direct
children (computed every flush). When `false`, the declared `width` /
`height` / `radius` are used verbatim. Default `false`.

***

### behindChildren?

> `readonly` `optional` **behindChildren?**: `boolean`

Frame renders at `style.zIndex − 1` so descendants paint on top. Set to
`false` to keep the frame at its declared z-index (and let descendants
paint underneath when their z-index is lower). Default `true`.

***

### headerHeight?

> `readonly` `optional` **headerHeight?**: `number`

Height (px) of the band reserved above the children bbox for the
group's title. Default `0`.

How it *draws* depends on the frame's shape kind:

- `kind: 'rect'` / `'circle'` — nothing is drawn. The band only shifts
  the auto-fit recompute so a label placed at the top doesn't collide
  with the children underneath it.
- `kind: 'tabbed-rect'` — the band becomes the frame's **tab**: it's
  the folder's title flag, sitting above the body rather than inside
  it, and the title renders in it.

***

### height?

> `readonly` `optional` **height?**: `number`

Sibling of [width](#width) for `kind: 'rect'`.

***

### padding?

> `readonly` `optional` **padding?**: `number`

Inset around the children bbox before the frame outline. Default `16`.

***

### radius?

> `readonly` `optional` **radius?**: `number`

Floor (with `autoFit`) or fixed (without) radius. Circle frames only.
Ignored for rect frames.

***

### showCollapsedCount?

> `readonly` `optional` **showCollapsedCount?**: `boolean`

Show a badge with the number of hidden descendants while collapsed.
Default `false`.

Off by default because the badge is placed `inside-center`, and on a
`tabbed-rect` inside placements route into the **tab** — so the count
lands on top of the group's own title. Turn it on for frames whose title
is elsewhere (or absent).

***

### tabAlign?

> `readonly` `optional` **tabAlign?**: `"center"` \| `"left"` \| `"right"`

Which side of the frame the tab hugs. Default `'left'`.

***

### tabOffset?

> `readonly` `optional` **tabOffset?**: `number`

Gap between the [tabAlign](#tabalign) edge and the tab. Default `0`.

***

### tabPadding?

> `readonly` `optional` **tabPadding?**: `number`

Horizontal breathing room between the title and each end of an
auto-sized tab. Default `10`. Ignored when [tabWidth](#tabwidth) is set.

***

### tabSkew?

> `readonly` `optional` **tabSkew?**: `number`

Horizontal run of the tab's angled side — the taper that reads as a
folder tab rather than a box. Default `0` (square). The auto-sizing in
[tabWidth](#tabwidth) adds this on top of the measured title, so leaning the
tab never squeezes the text.

***

### tabWidth?

> `readonly` `optional` **tabWidth?**: `number`

Width of a `tabbed-rect` frame's tab. Ignored by other shape kinds.

Leave it unset (the default) to **auto-size the tab to the title** — the
layer measures the group's resolved `labelText` in its resolved font and
hands the size to the shape, which decides what to do with it
(`ShapeCtor.fitToContent`). That's what keeps a row of frames with
differently-sized titles looking consistent without per-frame tuning.
Set it to pin every tab to the same width instead.

***

### togglePlacement?

> `readonly` `optional` **togglePlacement?**: `any`

Where the auto-attached `+` / `−` toggle sits relative to the group's
frame. Two forms:

- **Keyword** — one of the [TogglePlacement](../../../canvas/src/variables/SpecStore.md) aliases
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

When `true`, `GroupResizeBehaviour` mounts corner / radial handle
decorations on this group and lets the user drag to resize. Composes
with `autoFit` per the floor rule on `width` / `height` / `radius`.
Default `false`.

***

### width?

> `readonly` `optional` **width?**: `number`

Floor (with `autoFit`) or fixed (without) width. Rect frames only.
Ignored for circle frames.
