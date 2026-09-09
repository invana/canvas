# Variable: COLLAPSED\_STATE

> `const` **COLLAPSED\_STATE**: `"collapsed"` = `'collapsed'`

The state name that closes a container frame — [CanonicalStateName](../type-aliases/CanonicalStateName.md)'s
`'collapsed'`, named so callers don't hardcode the string.

Collapse is **interaction state, not styling**: the truth lives in the
store's presence set (`store.setNodeState(id, COLLAPSED_STATE, true)`) or
the node's document `states[]`, never in `style`. Two things follow, and
they're the point of modelling it this way:

- **Every node describes its own closed look**, through the same overlay
  catalogue as `hovered` / `selected` — `state.collapsed` on the node, on
  the layer template, or on a per-type template. Nothing about a closed
  frame is hardcoded in the layer.
- Geometry has a sensible default with no authoring: the resolved shape's
  own minimal form (`ShapeCtor.collapsedOf` — a `tabbed-rect` closes to its
  tab). An overlay that declares its own `shape` opts out of it.
