# CLAUDE.md — packages/graph-layout-d3-hierarchy (`@invana/graph-layout-d3-hierarchy`)

D3 hierarchy `Layout` for `@invana/graph` — tidy `tree`, dendrogram `cluster`, radial variants of both, plus `pack` (circle-packing) and `sunburst`.

```ts
const layout = new D3HierarchyLayout({ mode: 'radial-tree', radius: 400, transition: true });
await layout.apply(graphLayer);
```

Extends `SubgraphPositionLayout` (from `@invana/graph`) — the base for one-shot
layouts that can run over an arbitrary node set. The subclass only implements
`computeSubgraphLayout()` (snapshot →
d3 → projected positions) and `onPositionsApplied()` (flush pack sizes / sunburst arcs
via the per-run `meta`). The base owns **everything else**: the `transition` /
`transitionEase` options (glide vs snap), cancellation (`stop()` + run-token), and the
uniform `start`/`tick`/`end` lifecycle. `pack` / `sunburst` veto the glide via
`shouldTransition()` (they replace node geometry rather than move it).

A `Layout` reads `layer.data`, computes positions, writes them back. It does not register with the canvas, render, or subscribe to input (proposal §2.3).

Tree/parent-child topology is derived from edges: each `edge.source → edge.target` means `source` is the parent of `target`. The snapshot must form a single tree (one root, no cycles, every non-root has exactly one parent); `apply()` throws otherwise.

## Groups

A group frame carries **no edges of its own**, so it can't just be dropped into an
edge-derived tree — it would read as a second root and the whole run would throw
("more than one root"). Two behaviours, by option:

- **`includeGroups` off (default)** — group frames are excluded from the tree
  entirely and keep their frozen positions. Members are placed by tree topology and
  an `autoFit` frame wraps wherever they land. That's usually what you want from a
  tree layout, and it's why the option is off by default.
- **`includeGroups: true`** — each group is laid out as its own tree, boxed, and
  placed as one node at its parent's level (edges between members and outsiders are
  lifted to the box, so it connects to the rest of the tree normally).
  **Each group must contain a single subtree**: one parentless member, with edges
  reaching all the others. A group spanning two branches has no tidy-tree solution
  and **throws, naming the group** — deliberately, since one box arranged by some
  other rule while every sibling box is a tree is far harder to diagnose than an
  error.
- **`pack` / `sunburst` ignore the option.** Their real output is per-node geometry
  (circle radii, arc sectors) threaded through the run's `meta`, which can't be
  merged across one run per group. They fall back to a single flat run.

Collapsed-group members are excluded from the tree in every mode — collapse-hiding
is derived (`collapsedAncestor`), so a plain `hidden` check used to miss them and
lay out nodes nobody could see.
