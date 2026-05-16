# Type Alias: EdgeAnchor

> **EdgeAnchor** = `"boundary"` \| `"center"` \| `"perpendicular"` \| `"edge-port"` \| `string` & `object`

Defined in: [graph/src/layer/types.ts:116](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/types.ts#L116)

Endpoint anchor.

- `'boundary'` (default) — trim the endpoint at the node's outline along
  the line from the other endpoint. Visually the edge stops at the node
  boundary; works with arrows and connector decorations cleanly.
- `'center'` — leave the endpoint at the node's centre. The edge passes
  through the node visually; rely on z-order (nodes drawn on top) to make
  it look like the edge terminates at the boundary. Pick this for radial
  layouts so polar pathStyles (e.g. `bump-radial`) compute their tangent
  from the true node-centre angle rather than the trimmed cut point.
- `'perpendicular'` — exit / enter perpendicular to the host edge of a
  rect-like node. Reserved for box-shaped nodes.
- `'edge-port'` — attach to a specific point on one face of the node's
  bounding box, picked by `{ side, offset }` on the per-endpoint
  `sourceAnchorOpts` / `targetAnchorOpts`. Used by the Sankey layout to
  stack ribbons along the right face of source and left face of target.

Widened to `string` so anchors registered at runtime (e.g. domain-specific
port anchors) can be referenced by name.
