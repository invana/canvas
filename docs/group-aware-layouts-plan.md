# Group-aware layouts — containment across ELK, d3-hierarchy, geometric & d3-force

> **Status: implemented** (Phases 1–4). §11 records what shipped, including the
> four places the implementation departed from this plan. Sections 1–10 are kept as
> the design of record — read §11 for the as-built surface.

**Goal:** make `parentId` **groups** (nodes whose resolved style carries `group`) lay out
correctly in *every* layout that can meaningfully express containment — not just ELK —
and turn group handling on by default where it's safe.

**Packages:** `@invana/graph` (shared helpers + the recursive wrapper — new),
`@invana/graph-layout-elkjs`, `@invana/graph-layout-d3-hierarchy`,
`@invana/graph-layout-geometric`, `@invana/graph-layout-d3-force`,
`@invana/canvas-ui` (rule-12 editors).

---

## 1. Where we are

| Layout | Groups today | Mechanism |
|---|---|---|
| `ElkLayout` | ✅ real containment, **opt-in** (`includeGroups`, default `false`) | native ELK compound nesting |
| `D3ForceLayout` | 🟡 soft clustering, **opt-in** (`cluster`) | per-tick pull toward the group centroid |
| `D3HierarchyLayout` (tree / cluster / radial / pack / sunburst) | ❌ **crashes the run** | reads `parentId` nowhere |
| `GeometricLayout` (grid / snake / circular) | ❌ none | — |
| `D3SankeyLayout` | ❌ none | — |

Three distinct problems sit behind that table.

### 1.1 Everyone who *does* look at hierarchy conflates `parentId` with "group"

A group is a node whose **resolved style carries `group`** — `GraphLayer.isGroupNode`
(`GraphLayer.ts:2101`). But `parentId` is the single, general hierarchy field: per
`packages/graph/CLAUDE.md` it "covers tree + combo/group membership". Both group-aware
layouts ignore that distinction:

- `ElkLayout.computeCompound` (`ElkLayout.ts:187`) recurses on `store.childrenOf(id)`
  unconditionally, so a plain parent/child **tree** becomes a compound container.
- `D3ForceLayout.clusterIndices` (`D3ForceLayout.ts:210-244`) clusters on any
  `node.parentId` that is placed — same defect, softer symptom.

### 1.2 Collapsed groups are invisible to every layout

Collapse-hiding is **derived**, not stored: `GraphLayer.collapsedAncestor` (`:2142`)
hides descendants at render time; `node.hidden` is never set. So
`OneShotPositionLayout.shouldPlaceNode` — which only tests `node.hidden` — does not
filter them, and **every** layout currently lays out collapsed members as ordinary
nodes, reserving space nobody can see. In ELK's compound path it's worse: the invisible
members inflate the collapsed frame's box.

### 1.3 `D3HierarchyLayout` doesn't merely ignore groups — a group node breaks it

The tree is derived from **edges** (`D3HierarchyLayout.ts:112-128`: `source → target`
means parent → child), and `resolveRoot` (`:362-403`) hard-validates a single-rooted
tree. A group frame node has no incoming edge, so it counts as a **second root** and
`apply()` throws *"snapshot has more than one root. Pass `rootId` to disambiguate."*
Adding a group frame to a tree graph doesn't degrade — it crashes. This is a bug
independent of the group feature and should be fixed unconditionally.

---

## 2. The two meanings of "group support"

Deciding which one applies per layout is what shapes the whole plan.

**(A) Native containment** — the algorithm itself understands nested boxes and can
route edges *across* container boundaries. ELK has this (`elk.hierarchyHandling:
INCLUDE_CHILDREN`). `d3-hierarchy`'s tree/radial modes fundamentally cannot: they place
nodes by tree depth, and there is no container concept to hook. Neither can grid /
circular / sankey.

**(B) Recursive application** — layout-agnostic, and the one that generalises.
Depth-first, deepest group first:

1. run the layout on the subgraph **induced by a group's members**, in isolation →
   local positions;
2. take the local AABB, add the group's `padding` (+ `headerHeight` on top) → that's
   the group's **box size**;
3. at the parent level, replace the whole group with a **single super-node** of that
   size, remapping inter-group edges to it;
4. run the layout at the parent level;
5. translate every member's local position by the container's final position.

This is the classic recursive-group-layout shape (yFiles calls it the same thing). It
gives radial, tree, grid, circular and force real containment without any of them
knowing groups exist.

**Quality caveat, stated up front:** recursion lays each group out *blind to the outside
world* — edges leaving the group don't influence member placement, so a member that
connects outward can end up on the far side of its box. ELK's native `INCLUDE_CHILDREN`
does not have this weakness. Recursion is "correct containment, decent aesthetics";
native compound is better where it exists. That's why ELK keeps its own path.

---

## 3. Shared foundation — `@invana/graph`

New module `packages/graph/src/layout/groups.ts`, exported from the package root and
consumed by every layout package (they already peer on `@invana/graph`). Five layouts
must not each own a private copy of these rules.

### 3.1 `groupSnapshot(layer, opts)` — the group-aware placement predicate

One place that answers "which nodes does this run place, and how do edges map":

- **placeable** := `shouldPlaceNode(node)` (the existing `hidden` test) **and**
  `layer.collapsedAncestor(node.id) === undefined`. Pruned nodes keep their frozen
  positions — the same semantic `includeHidden: false` already has. Fixes §1.2 for
  every layout at once.
- **group parents only** := a child is nested under its parent only when
  `layer.isGroupNode(parent)`; otherwise it's a flat sibling. Fixes §1.1.
- **collapsed ⇒ leaf**: when `layer.isCollapsedGroup(parent)`, don't recurse — the group
  is a plain node sized to its collapsed super-node footprint (interactive node + count
  badge, which is what the renderer draws).
- **cycle guard**: a visited `Set<string>` through the recursion, so `a.parentId === 'a'`
  degrades to flat instead of a stack overflow.

### 3.2 `remapEdges(layer, edges, placeable)` — endpoint resolution

Edges incident to pruned nodes must **not** be dropped, or a collapsed group loses all
the edge attraction its members contribute; the renderer already re-routes them to the
collapsed ancestor via `GraphLayer.effectiveEndpoint` (`:2159`). Remap instead:

```
src := effectiveEndpoint*(e.source)   // applied to a fixpoint — see below
tgt := effectiveEndpoint*(e.target)
skip when src === tgt (collapsed self-loop) or either is unplaceable
```

Two wrinkles the helper owns:

- `collapsedAncestor` returns the **nearest** collapsed ancestor, which may itself sit
  under a *higher* collapsed group (the nested-collapse case
  `refreshDescendantsAndIncidentEdges` handles). Apply to a **fixpoint** so the endpoint
  lands on the outermost visible representative.
- Remapping produces **duplicate `(src, tgt)` pairs** when several member-edges collapse
  onto the same node pair. Dedupe and synthesise ids — ELK requires unique edge ids, and
  duplicates skew force weights.

### 3.3 `groupBoxInsets(layer, groupNode)` — geometry from `style.group`

Read the resolved `GroupOptions` (`packages/graph/src/layer/types.ts:838`) via
`layer.resolveNodeStyle(node).group`:

- `padding` (default `16`, per the type's own doc) on all four sides;
- `headerHeight` (default `0`) added to the **top** inset, so the title band — or a
  `tabbed-rect` frame's tab — gets reserved space and `GraphLayer.projectGroupShape`
  doesn't have to grow the frame after the fact;
- the declared `width`/`height`/`radius` as a size **floor** for `autoFit: false` groups
  only. For `autoFit: true`, the current size is *last frame's* auto-fit frame — used as
  a floor it can never shrink.

---

## 4. Phase 1 — `ElkLayout`: fix the compound path, default it on

Native containment (§2A). Detailed because it's the first actionable phase.

### 4.1 Thread `layer` into the compound builder

`computeCompound(store, sizeOf)` takes only the store, so it can't ask group questions.
Change to `computeCompound(layer, sizeOf)` and read `layer.store` inside. `computeLayout`
already receives `layer` (`:120`). Everything below depends on it.

### 4.2 Adopt the shared helpers

Replace the private logic with §3.1 / §3.2 / §3.3:

- nest only when `isGroupNode(parent)`; a non-group parent's child becomes a root;
- prune collapsed subtrees, emit collapsed groups as leaves;
- cycle guard;
- replace the hardcoded `'elk.padding': '[top=24,left=24,bottom=24,right=24]'` (`:212`)
  with the resolved insets; keep `elk.nodeSize.constraints: MINIMUM_SIZE` but stop
  feeding auto-fit containers their stale `sizeOf` box as a floor.

### 4.3 Gate `INCLUDE_CHILDREN` by algorithm

`elk.hierarchyHandling: 'INCLUDE_CHILDREN'` (`:236`) is set unconditionally today.
`layered` supports it properly; `force` / `stress` / `radial` / `disco` degrade to laying
each container out separately. Set it only for the supported set (`layered`, plus
`rectpacking` / `mrtree` where applicable). Nesting still happens — only cross-hierarchy
edge handling is gated. Apply the gate **before** the `layoutOptions` spread in
`buildLayoutOptions`, so the user's passthrough keeps winning.

### 4.4 Collapse the two code paths into one

After 4.1–4.3 the tree builder with zero group parents produces **exactly** the flat
graph (every node a root, no children, identical edges, `hierarchyHandling` unset).
Delete the flat branch (`ElkLayout.ts:129-175`) and always run the tree builder; the
`walk()` flattener (`:247`) already handles depth 0, and the index-paired `sizes[]` array
disappears with it. One path can't drift, and §1.2's fix lands in both for free.

Cost: positions accumulate into a `number[]` then a `Float32Array` instead of a
preallocated buffer. Negligible against an ELK solve, but stated rather than hidden.

### 4.5 Flip the default

- `types.ts:91` — keep the field, TSDoc becomes **Default `true`**, documenting the
  narrowed semantics (real group nodes only; collapsed ⇒ leaf; inert without groups).
- `ElkLayout.ts` — read as `this.opts.includeGroups !== false`, so explicit `false` still
  forces flat.
- `packages/canvas-ui/src/editors/layouts/elk-layout/fields.ts:96` — "Nest groups" must
  render checked on a fresh config; check `mapping.ts` doesn't write an explicit `false`
  when the user never touched the toggle.
- `packages/graph-layout-elkjs/CLAUDE.md` — add a **Compound groups** section (none
  today): what counts as a group, collapsed handling, inset source, algorithm gate, opt-out.

**Blast radius:** 15 story files construct an `ElkLayout`; **none** sets `includeGroups`,
and none uses `parentId` or `style.group`. Flipping the default has no visible in-repo
effect — and those 15 stories are the pixel-identical regression check for 4.4.

---

## 5. Phase 2 — `D3HierarchyLayout`: stop crashing on group nodes

Unconditional bug fix (§1.3), independent of the feature. A group frame node is a
structural annotation, not a tree member; it must not enter the edge-derived tree.

- Exclude group container nodes from the `nodeById` snapshot (`:102-106`) — they are not
  tree nodes, they *contain* tree nodes.
- Apply §3.1's placeable predicate so collapsed subtrees drop out too. Note the existing
  hidden-endpoint branch (`:115-125`) already handles "edge to an excluded node" by
  dropping the edge — pruned members ride that path.
- Excluded group nodes keep their frozen positions in Phase 2; Phase 4 gives them real
  ones.

This alone turns "crash" into "layout ignores the frame", which is the correct
pre-feature baseline.

---

## 6. Phase 3 — the recursive wrapper in `@invana/graph`

§2B, implemented **once**. This is the phase with a real design decision in it.

### 6.1 The blocker: layouts take a `GraphLayer`, not a subgraph

`OneShotPositionLayout.computeLayout(layer)` is layer-in. To run a layout on one group's
members in isolation, something has to give. Two options:

**(a) A subgraph *view*** — a facade implementing the slice of `GraphLayer` /
`GraphStore` the layouts touch (`nodes()`, `edges()`, `hasNode`, `getNode`,
`childrenOf`, `getPosition`, `boundsOfNode`, `resolveNodeStyle`). No layout changes.
But the surface each layout uses is discovered by inspection, not declared — a layout
reaching for something the facade doesn't implement fails at runtime, and nothing stops
that regressing later.

**(b) A declared snapshot capability** — introduce

```ts
interface LayoutSubgraph {
  ids: string[];
  edges: { id: string; source: string; target: string }[];
  sizeOf(id: string): { width: number; height: number };
  getPosition(id: string): { x: number; y: number } | undefined;
}
```

and an optional protected `computeSubgraphLayout(sub): LayoutPositions | null`. A layout
opts into recursion by refactoring its `computeLayout` into "build a `LayoutSubgraph`
from the layer → delegate". The wrapper drives *that* method. Layouts that don't
implement it simply aren't wrappable (sankey).

**Recommendation: (b).** It costs a small refactor per layout, but it makes "can this be
nested?" a compile-time fact instead of a runtime gamble — and snapshot-driven compute is
the shape these layouts should have anyway (it's also what would let them move to a
worker later, cf. `render-pipeline-plan.md` §8).

### 6.2 The wrapper

`RecursiveGroupLayout` — a decorator over any `OneShotPositionLayout` implementing
`computeSubgraphLayout`, or equally a mixin; the algorithm is the same:

1. Build the group forest via §3.1 (group parents only, collapsed pruned, cycle-guarded).
2. **Depth-first, deepest first.** For each group: induce the subgraph over its direct
   members (a nested group participates as its already-computed box), run
   `computeSubgraphLayout`, record local positions, compute the AABB, add §3.3 insets →
   the group's box size.
3. **Top level**: every top-level group is one super-node of its computed box size;
   inter-group edges are remapped to the representative super-node and deduped (a
   level-scoped generalisation of §3.2). Run `computeSubgraphLayout` once more.
4. **Translate**: walk the forest outward, offsetting each member's local position by its
   container's final position. Emit absolute positions for members **and** container
   nodes; `GraphLayer.projectGroupShape`'s auto-fit then settles the frames.

Output is a normal `LayoutPositions`, so the `OneShotPositionLayout` base keeps owning
snap/tween, cancellation and lifecycle — the wrapper adds no new machinery there.

Cost: N+1 layout runs for N groups instead of 1. Fine for one-shot algorithms on
realistic group counts; explicitly **not** fine for iterative simulation (see Phase 4).

---

## 7. Phase 4 — per-layout adoption

| Layout | Approach | Notes |
|---|---|---|
| `ElkLayout` | **native** (Phase 1) | Keeps its own compound path — `INCLUDE_CHILDREN` beats recursion because it sees cross-boundary edges. Consumes §3 helpers only. |
| `GeometricLayout` (grid / snake / circular) | **recursive** | The cleanest fit — no topology assumptions to violate. Likely the first wrapper adopter and the best test case. |
| `D3HierarchyLayout` | **recursive, restricted** | See constraint below. |
| `D3ForceLayout` | **neither — fix what's there** | Iterative; recursion would mean N nested simulations. Keep the `cluster` force, gate `clusterIndices` (`:210-244`) on `isGroupNode` + §3.1's placeable so it clusters *groups*, not trees, and ignores collapsed members. Document plainly that force gives attraction, not containment. |
| `D3SankeyLayout` | **opt out** | Flow columns have no meaningful containment; leave group-unaware and say so in its `CLAUDE.md`. |

**The d3-hierarchy constraint (unavoidable, state it in the docs):** its per-group
induced subgraph must itself be a **single-rooted tree** — i.e. groups must align with
subtrees. A group spanning two branches has multiple roots inside the box and `resolveRoot`
throws. Options when that happens: fail loudly with a message naming the group, or fall
back to laying that group out flat. **Recommend failing loudly** — a silently different
algorithm inside one box is worse than an error that names the offending group. This also
means `pack` / `sunburst` (which already replace node *geometry* and veto the transition
via `shouldTransition`) should stay group-unaware for now.

---

## 8. Editors (rule 12)

Every new option needs its schema editor updated in
`packages/canvas-ui/src/editors/layouts/<surface>/` (`fields.ts` + `mapping.ts`):

- `elk-layout` — reflect the new `includeGroups` default (§4.5);
- `geometric-layout`, `d3-hierarchy-layout` — new group toggle from Phase 4;
- `d3-force-layout` — the `cluster` field exists; its description should stop implying
  containment.

---

## 9. Verification

1. `pnpm build && pnpm check-types`.
2. **ELK regression:** the 15 group-free ELK stories must render *pixel-identically*
   after §4.4's unification. That's the safety net for the riskiest refactor here.
3. **d3-hierarchy:** a tree graph plus one group frame currently throws; after Phase 2 it
   must lay out cleanly with the frame ignored, then contain properly after Phase 4.
4. **New behaviour** needs a group + layout story to eyeball; none exists in the repo.
   Per root rule 10, no story is added unless explicitly asked for.

## 10. Risks & open questions

- §4.4 is a behaviour-preserving refactor of code that currently works; the regression
  check is visual, not automated.
- §3.2's edge remapping is the one place this plan *adds* graph semantics to layouts
  rather than removing them. Fallback is today's drop-the-edge behaviour, at the cost of
  collapsed groups floating free.
- Phase 3 option (b) touches four layout packages' `computeLayout`. Phasing it behind
  Geometric first keeps the blast radius to one package until the interface proves out.
- **Open:** does `RecursiveGroupLayout` ship as a decorator the consumer wraps
  (`new RecursiveGroupLayout(new GeometricLayout(...))`) or as an `includeGroups` option
  on each layout that internally delegates? The option form is friendlier and matches
  ELK's surface; the decorator form is more honest about the N+1 cost. Leaning **option
  form** for API symmetry across layouts.
- **Open:** should group recursion default to `true` everywhere once correct (matching
  §4.5), or stay opt-in outside ELK until the aesthetics of blind-subgraph layout are
  judged in practice? Leaning **opt-in for the recursive layouts**, default-on for ELK
  only — the quality caveat in §2 is real and ELK doesn't share it.

---

## 11. As built

### Shipped surface

**`@invana/graph`** — two new modules, both exported from the package root:

- `src/layout/groups.ts` — the shared rules (§3): `isPlaceableNode` /
  `collectPlaceableNodes` (hidden **and** collapsed-derived pruning),
  `effectiveLayoutEndpoint` (fixpoint) + `collectLayoutEdges` (remap, dedupe,
  self-loop drop) + `isMergedEdgeId`, `buildGroupForest` (group-parents-only,
  collapsed-as-leaf, cycle-guarded), `groupInsets` / `groupSizeFloor`,
  `resolveNodeSize`.
- `src/layout/SubgraphPositionLayout.ts` — the recursion (§6), as a base class
  layouts extend. Declares `computeSubgraphLayout(sub)` + the `canRecurseGroups()`
  veto; owns post-order sizing, per-level edge lifting, and the pre-order translate.

**Per layout:**

| Layout | What changed |
|---|---|
| `ElkLayout` | Adopts the shared helpers; flat + compound branches **collapsed into one**; insets from `GroupOptions`; `INCLUDE_CHILDREN` gated to `layered`; `includeGroups` now defaults **on**; merged edge ids skipped by the `edgeRouting` write-back. |
| `GeometricLayout` | Now a `SubgraphPositionLayout`; gains `includeGroups` (default off). |
| `D3HierarchyLayout` | Now a `SubgraphPositionLayout`; **group frames no longer crash the tree**; gains `includeGroups` (default off, ignored by `pack`/`sunburst`); root errors name the offending group. |
| `D3ForceLayout` | `cluster` gated on `isGroupNode`; both snapshots prune collapsed members. |
| `D3SankeyLayout` | Untouched; documented as group-unaware by design. |

**Editors** (rule 12): `includeGroups` added to `geometric-layout` and
`d3-hierarchy-layout` (hidden for `pack`/`sunburst`); `elk-layout`'s mapping now
seeds `?? true` so an untouched config shows the toggle checked.

### Departures from the plan

1. **The recursion is a base class, not a decorator** (§10's first open question,
   resolved as recommended): `includeGroups` on each layout, matching ELK's surface,
   with `SubgraphPositionLayout` owning the algorithm. No `RecursiveGroupLayout`
   type exists.
2. **`LayoutSubgraph` grew two members the plan didn't anticipate** — `dataOf(id)`
   (pack/sunburst value accessors read the node payload) and `isGroup(id)`. The
   second is load-bearing: a layout that derives topology from *edges* must be able
   to tell a frame from a node, or it reads the frame as a disconnected component.
   That's what makes the d3-hierarchy crash fix expressible without handing the
   layout a store.
3. **A `canRecurseGroups()` veto was needed.** `pack` / `sunburst` produce per-node
   *geometry* through the run's `meta`, and the recursion returns one merged
   position set with no meta — so they opt out and fall back to a flat run rather
   than silently losing their radii/arcs.
4. **`pack` / `sunburst` also drop group frames from the tree.** The veto in (3)
   means they run flat even with `includeGroups: true` — so they must still
   exclude frames, or they inherit exactly the §1.3 crash the option was meant to
   avoid. The layout asks whether the run is *actually* recursing, not what the
   option says.
5. **`ElkLayoutOptions.defaultNodeSize` is now actually honoured.** It was
   documented but never read (a module-level constant was used instead); folding
   sizing through `resolveNodeSize(layer, node, fallback)` wired it up.

### Behaviour changes to know about

- **Every layout now prunes collapsed-group members.** This is the §1.2 fix and it
  is intentional, but it *is* a visible change on any graph with a collapsed group:
  those members stop reserving empty space, so the visible graph re-packs.
- **`GeometricLayout` cell pitch now reads `sub.sizeOf`** rather than the cached
  `node.boundingBox`. On the first pass — before anything has rendered — that
  resolves real shape bounds instead of an empty box, so large nodes get a
  big-enough cell on run one instead of only after a redraw.
- **`ElkLayout` defaults to nesting.** No in-repo story is affected (none uses
  groups), but a downstream consumer with `style.group` nodes will see them contain.

### Verification performed

- `pnpm build` — 18/18 tasks pass, including the Storybook production build.
- `pnpm check-types` — passes for every package except a **pre-existing** failure
  inside `node_modules/@invana/styling/src/themes.config.ts` (a third-party
  design-kit file, untouched here).
- **Visual confirmation in Storybook**, via a layout switcher added to
  `usecases/InvanaArchitecture` (11 group frames, members inside them, edges crossing
  frame boundaries — the most demanding group case in the repo):
  - **ELK** — every stage becomes a real compound container with its members packed
    inside; the `tabbed-rect` tab band is preserved (no member packed into it), the
    14px padding holds, and cross-stage edges route between boxes. This is the
    end-to-end check on `groupInsets` replacing the hardcoded `24`, and on
    `includeGroups` defaulting on.
  - **Force** — clusters form and frames track their members while boxes stay loose,
    which is exactly the "attraction, not containment" the docs now claim.
  - **Authored** — the snapshot restores the original diagram after either solver.
- Still not done: a *pixel-identical* before/after diff on the 15 group-free ELK
  stories (§9.2). They build and the shared path is exercised, but nobody has
  compared renders frame by frame.
