# Data Model + Implementation Phasing (G6-Aligned)

> **File location:** commit at repo root as `data-types-implementation-plan.md` (companion to the existing `data-types-instances.md`). Plan mode restricts edits to the harness plan path; sync on exit.

> **Reference:** [G6 Graph Options](https://g6.antv.antgroup.com/en/manual/graph/option) — this plan adopts G6's `NodeData` vs `NodeOption` split (and `EdgeData` vs `EdgeOption`) and adapts the existing `data-types-instances.md` to match the convention.

---

## Context

`data-types-instances.md` modelled the input/stored split (`NodeInput` → `GraphNode`) and put state overlays inside `style.states`. Reading the G6 reference reveals a cleaner convention:

- **`NodeData`** — per-instance descriptor (id, type, data, style, *states*, combo, children).
- **`NodeOption`** — type-level template (type, style, *state*, palette, animation), supplied as the `node` field on GraphOptions.
- **`state`** (singular) = overlay catalogue: `{ hover: {...}, selected: {...} }`.
- **`states`** (plural) = active state list: `['hover', 'selected']`.
- **Overlays live alongside `style`**, not inside it. Same level, different role.

Adopting this:

1. Cleans up the "state in singular vs plural" tension.
2. Removes the recursive type (`style.states.hover.states.foo` no longer possible by construction).
3. Lets per-instance state-overlay catalogues coexist with type-template overlays through a clean precedence rule.
4. Maps 1:1 to G6 conventions — familiar to consumers coming from that ecosystem.

This plan: (a) finalises the type model in §1–§3, then (b) phases the implementation in §4 so each phase is independently shippable.

---

---

## As built (reconciled 2026-08-10)

> **This plan has landed.** It was never updated as the work shipped, so the phasing below
> reads as outstanding when most of it is not. What follows is the outcome; the phases are
> kept for the reasoning, not as a to-do list.
>
> Reproduce these claims:
> ```bash
> grep -n "export interface NodeOption" packages/graph/src/layer/types.ts     # → 1133
> grep -n "export interface GraphNode"  packages/graph/src/store/types.ts     # → 38
> git ls-files apps/storybook/stories | grep "/Etc/"                          # → 7 stories
> grep -rl "style:" packages/graph-datasets/src --include='*.ts' | wc -l      # → 24
> grep -rn "NodeRenderHints|EdgeRenderHints" packages/graph/src               # → none
> ```

| Phase | Status | As built |
|---|---|---|
| 1 — types | 🚧 **partly** | `NodeOption` + `state` catalogue shipped as specified. The per-instance descriptor shipped as **`GraphNode`**, not `NodeData` (D-A below). **`NodeInput` was never built** — see D-C |
| 2 — store fields | ✅ | `GraphNode` carries `style`, `states`, `data`; `GraphStore` round-trips them |
| 3 — resolver eval at insert | ⚠️ **diverged** | Resolvers exist as `ResolvableNodeStyle` / `ResolvableEdgeStyle`, but they fire **at render**, against the stored `GraphNode` — *not* evaluated once at insert. See D-C |
| 4 — render path | ✅ | `GraphLayer` resolves style + `NodeOption` + state overlays, decorations included |
| 5 — migrate the six State stories | ✅ | All seven exist under `apps/storybook/stories/graph/Etc/` (incl. `Decorations.stories.ts`), on the new shape |
| 6 — migrate behaviours | ✅ | Behaviours read `style` / `states`. Remaining `node.data` reads (`HoverActivateBehaviour`, `ClickSelectBehaviour`) are **user payload passed to event consumers** — the intended use of `data`, not a render hint |
| 7 — datasets + stories | ✅ | 24 dataset files emit the new shape |
| 8 — remove legacy types | ✅ | `NodeRenderHints` / `EdgeRenderHints` are gone |

**Never written:** `packages/graph/tests/store/NodeData.test.ts` and
`packages/graph/tests/layer/NodeInput.test.ts`, both listed as NEW in §8. The store and layer
suites cover the shipped shape instead.

### Decisions ratified after the fact

**D-A — the per-instance type is `GraphNode`, not `NodeData`.** ✅ *Keep `GraphNode`.*
G6's naming was adopted for the *shape*, which is what mattered; the noun would cost a
breaking rename through datasets, stories, layouts and `canvas-ui` for familiarity alone.
§1's `NodeData` blocks describe `GraphNode` — read them that way.

**D-B — `style.decorations` is a discriminated-union array, not a slot dict.** ✅ *Keep the
array.* §1.5 and the Phase 5 example show `{ halo: {...}, border: {...} }`; the code ships an
array (see `Decorations.stories.ts`).
⚠ **Open cross-plan question:** the decorations→spec-state work in
[`renderer-split-design.md`](./renderer-split-design.md) models *attachment* as
`Record<slot, DecorationSpec>`. If that lands as a slot dict while style keeps an array, the
two disagree. **Resolve before either moves.**

**D-C — resolvers fire at render, and `NodeInput` was dropped.** ⚠️ *Recorded, not ratified.*
Phase 3 specified evaluating resolvers once at insert and storing concrete values; the
implementation resolves every frame against the stored node instead, and never introduced the
resolver-aware input type. Render-time resolution is strictly more expressive (a resolver can
react to state changes without a re-insert) and strictly more expensive (it runs per frame per
node) — which makes it a **100k-scale question**, not a style one. Revisit with the
measurement in `renderer-split-design.md` rather than in the abstract.

---

## 1. Type model (G6-aligned)

### NodeData (per-instance, stored) — **shipped as `GraphNode`, see D-A**

```typescript
interface NodeData<D = unknown> {
  id: string;
  type?: string;                          // tag — matches a NodeOption.type registered on the layer
  data?: D;                               // user payload
  style?: NodeStyle;                      // base style (concrete values)
  state?: Record<string, NodeStyle>;      // per-instance overlay catalogue (singular)
  states?: readonly string[];             // active state list (plural)
  combo?: string;
  children?: readonly string[];
  // store-side concerns:
  position?: { x: number; y: number };
  pinned?: boolean;
  parentId?: string;
}
```

### NodeInput<D> (what the consumer passes — resolver-aware) — **never built, see D-C**

```typescript
interface NodeInput<D = unknown> {
  id?: ResolvableId<D>;                          // string | (data: D) => string
  type?: string;
  data?: D;
  style?: ResolvableNodeStyle<D>;                // each field: T | (data: D) => T
  state?: { [stateName: string]: ResolvableNodeStyle<D> };
  states?: readonly string[];
  combo?: string;
  children?: readonly string[];
  position?: { x: number; y: number };
  pinned?: boolean;
  parentId?: string;
}
```

Per-input resolvers fire at insert; the store holds `NodeData` with concrete values.

### NodeOption (layer-level template — G6's `node` field)

```typescript
interface NodeOption {
  type?: string;                                                // type tag this template defines
  style?: ResolvableNodeStyle<GraphNode>;                       // resolved per render against stored GraphNode
  state?: { [stateName: string]: ResolvableNodeStyle<GraphNode> };
  palette?: PaletteConfig;                                      // (deferred — see open decisions)
}
```

Resolvers on NodeOption fire every frame.

> **No `animation` field.** G6 has `NodeOption.animation`, but in our engine "animation" is the per-frame `tick(dt)` *engine* (drives camera easing, decoration phase, effect modulation) — not a node-level config. The node-level analogue is **decorations** (added geometry — halo, glow, pulse-ring, marching-ants, badge) and **effects** (host transform/style modulation — shake, breathing). Both attach via `NodeStyle.decorations` / `NodeStyle.effects` (see §1.5), so they flow through the same `style` / `state` precedence as everything else. Per [[feedback_decoration_vs_animation]] these are three orthogonal concepts; we keep that boundary.

### GraphLayerOptions (our equivalent of G6's `GraphOptions`)

```typescript
interface GraphLayerOptions {
  // ...existing legacy fields (nodeDefaults, edgeDefaults, ...) preserved...

  /** G6-aligned node template. Replaces legacy `nodeDefaults` once migration completes. */
  node?: NodeOption;
  /** G6-aligned edge template. */
  edge?: EdgeOption;
}
```

### Edges mirror — EdgeData / EdgeInput / EdgeOption

Same shape, edge-flavoured. `EdgeData` has `source`/`target` instead of `position`/`parentId`; `EdgeStyle` has stroke/arrow/label fields instead of `bgFill`/`shape`. The original `edge.type: string` (predicate) is preserved as the type tag — same field G6 uses.

### 1.5 Decorations on NodeStyle (replaces G6's `animation`) — **shipped as an array, see D-B**

Decorations are added geometry attached to a host node (halo, glow, pulse-ring, marching-ants border, dashed border, badges). The engine already ships these primitives (`packages/canvas/src/primitives/decorations/`) and the layer already has imperative sugar (`graphLayer.haloNode`, `glowNode`, `pulseNode`, etc.). This plan adds the *declarative* path: decorations live on `NodeStyle` so they flow through input → store → state-overlay merge → renderer the same way `bgFill` does.

```typescript
interface NodeStyle {
  // ... bgFill, bgStroke*, shape, icon, image, label*, labelBackground* ...

  /**
   * Slot-based decoration attachments. Each slot holds at most one
   * decoration; `null` clears it. State overlays can swap a slot's spec
   * (e.g., `state.hover.decorations.halo = {...}` adds a halo on hover).
   *
   * Slots match the canvas renderer's decoration-slot model:
   * `setDecoration(id, slot, spec)`.
   */
  decorations?: {
    halo?: HaloStyle | null;                  // slot 'halo'
    glow?: GlowStyle | null;                  // slot 'glow'
    pulse?: PulseRingStyle | null;            // slot 'pulse'
    border?: BorderStyle | DashBorderStyle | MarchingAntsStyle | null;  // slot 'border'
    ring?: RingStyle | null;                  // slot 'ring'
    // ... other registered decoration slots ...
  };

  /**
   * Multiple badges per node (unlike single-slot decorations). Each badge
   * is itself a small decoration with its own placement. Existing
   * `badges` field stays as a sibling of `decorations` because the
   * cardinality differs (list vs slot dict).
   */
  badges?: readonly NodeBadge[];

  /**
   * Effects modulate the host's transform / style — shake, breathing,
   * shimmer. Sibling of `decorations`; same precedence rules. Optional
   * for the initial migration — engine support is already there
   * (`packages/canvas/src/primitives/effects/`).
   */
  effects?: {
    shake?: ShakeStyle | null;
    breathing?: BreathingStyle | null;
    // ... other registered effect kinds ...
  };
}
```

Decoration / effect *style payload* types (`HaloStyle`, `GlowStyle`, `ShakeStyle`, etc.) come from `@invana/canvas` — the layer doesn't redefine them, just re-uses the existing decoration / effect style interfaces.

**State overlays mutate decorations naturally:**

```typescript
{
  style: {
    bgFill: 0x3b82f6,
    decorations: {},          // none at rest
  },
  state: {
    selected: {
      decorations: { halo: { color: 0xfacc15, width: 3 } },
    },
    error: {
      decorations: { border: { kind: 'marching-ants', color: 0xff0000 } },
    },
  },
}
```

When a node carries `states: ['selected']`, the renderer reads the merged style, sees `decorations.halo = { color: 0xfacc15, width: 3 }`, and calls `setDecoration(id, 'halo', { kind: 'halo', style })`. Deactivating `selected` resets `decorations.halo` back to the base (`undefined`), which clears the slot via `setDecoration(id, 'halo', null)`.

**Imperative sugar coexists.** The existing `graphLayer.haloNode(id, style)` API stays for code that wants direct attachment. Internally it writes to the same state path the declarative `decorations` field projects to — one runtime mechanism, two ergonomic entry points.

---

## 2. State precedence (final)

At render time, for each node, the merged NodeStyle is built in this order (later wins per field):

1. **Built-in factory defaults** — engine baseline (`0x4A90E2` fill etc., to be carried over from `DEFAULT_NODE_HINTS`).
2. **`GraphLayerOptions.node.style`** (NodeOption.style, resolved against stored GraphNode).
3. **`NodeData.style`** (concrete, per-instance).
4. **Active state overlays** — for each name in `NodeData.states[]`, in array order:
   1. `GraphLayerOptions.node.state[name]` (resolved against GraphNode).
   2. `NodeData.state?.[name]` (concrete).

Two overlay catalogues at different scopes (layer-level + per-instance), stacked predictably. Same logic for edges.

---

## 3. Storage (GraphStore)

`GraphNode` in the store equals `NodeData` with all per-input resolvers already fired (no functions stored). Hot columns: `x`, `y`, pinned flag. Cold map gains: `style`, `state`, `states`, `combo`, `children`, `type`. No new column types required.

---

## 4. Implementation phasing

Eight phases, each independently shippable. Every phase has a clear scope, file list, exit criterion, and test/verification artifact. **Plan to merge each phase as its own PR** to keep review surface tight.

### Phase 1 — Types (no runtime change)

**Goal:** lock the type vocabulary. Code that doesn't reference the new types is byte-identical.

**Files:**
- `packages/graph/src/layer/types.ts` — add `NodeStyle`, `EdgeStyle`, `NodeShapeOptions` (+ `RectShapeOption` / `CircleShapeOption` / `ArcShapeOption`), `NodeIcon`, `NodeImage`, `NodeBadge`, `Resolvable<T, D>`, `ResolvableId<D>`, `ResolvableNodeStyle<D>`, `ResolvableEdgeStyle<D>`, `NodeInput<D>`, `EdgeInput<D>`, `NodeData<D>`, `EdgeData<D>`, `NodeOption`, `EdgeOption`, `GraphDataOptions<DN, DE>`.
- `packages/graph/src/layer/index.ts`, `packages/graph/src/index.ts` — export the new types.

**Exit criterion:**
- `pnpm check-types` clean (all 16 packages).
- `pnpm --filter @invana/graph build` produces `.d.ts` containing the new types.
- No `*.stories.ts` or behaviour file imports the new types yet.

**Notes:** legacy types (`NodeRenderHints`, `EdgeRenderHints`, `Resolvable*RenderHints`, `Resolved*Defaults`) remain — both export sets coexist.

### Phase 2 — GraphStore field extension

**Goal:** the store accepts and round-trips `style`, `state`, `states`, `combo`, `children`, `type`. No layer-side reading yet.

**Files:**
- `packages/graph/src/store/types.ts` — extend `GraphNode<D>` / `GraphEdge<D>` with new optional fields (`style?: NodeStyle`, `state?: Record<string, NodeStyle>`, `states?: readonly string[]`, `combo?: string`, `children?: readonly string[]`). `edge.type: string` remains unchanged (predicate). Existing `state: readonly string[]` field aliased to `states` during a deprecation window: keep both readable, write-through both on update.
- `packages/graph/src/store/GraphStore.ts` — `installNode` / `installEdge` / `updateNode` / `updateEdge` copy the new fields into the cold map.

**Exit criterion:**
- All 34 existing store tests still pass (no regression).
- `pnpm check-types` clean.
- Manual smoke: insert a node via `addNode({ id, style: { bgFill: 0xFF0000 }, state: { hover: { bgFill: 0x00FF00 } }, states: ['hover'], combo: 'g1', children: ['n2'] })` and read it back via `getNode(id)` — all new fields round-trip.

> **No new tests written this phase per direction.** Existing tests guard against regression.

### Phase 3 — Resolver evaluation at insert — ⚠️ **diverged: resolves at render, see D-C**

**Goal:** `GraphLayer.setData(opts: GraphDataOptions)` accepts `NodeInput[]`, resolves per-input fields at insert, stores concrete `NodeData`.

**Files:**
- `packages/graph/src/layer/GraphLayer.ts` — new `setData` overload accepting `GraphDataOptions`. Helper `resolveNodeInput(input, dataNodeIdResolver?) → NodeData` collapses Resolvable fields to concrete. The legacy `setData({ nodes: GraphNode[], edges: GraphEdge[] })` overload remains for direct stored-shape input.
- New helper `resolveStyleFields(style: ResolvableNodeStyle<D>, data: D): NodeStyle` — walks fields, replaces functions with their evaluation.

**Exit criterion:**
- `pnpm check-types` clean.
- Manual smoke: call `graph.setData({ nodes: [{ id: (d) => d.uid, data: { uid: 'a', name: 'Alice' }, style: { bgFill: (d) => 0xff0000, labelText: (d) => d.name } }], edges: [] })` → `getNode('a').style.bgFill === 0xff0000` and `getNode('a').style.labelText === 'Alice'`.

> **No new tests written this phase per direction.** Resolver smoke-check is the Decorations / States storybook story working end-to-end.

**Notes:** behaviour code that reads `node.data` for legacy render hints still works — the new input path writes to `node.style`, not `node.data`.

### Phase 4 — Render path reads new style + NodeOption (incl. decorations)

**Goal:** the renderer reads `node.style` / `node.state` / `NodeOption.state` and merges with the legacy `node.data`-hint path. Both inputs render correctly; legacy stories untouched. Decoration / effect slots in `node.style.decorations` / `node.style.effects` project to `renderer.setDecoration(id, slot, spec)` and the effect registry.

**Files:**
- `packages/graph/src/layer/GraphLayer.ts` — `resolveNodeHints` extended:
  - After legacy hint resolution, merge `node.style` (concrete).
  - Apply state overlays per §2: layer `node.state[name]` (resolved) then per-instance `node.state[name]` (concrete) for each active state in `node.states[]` (or legacy `node.state[]`).
  - After merge, diff the resolved `decorations` slot dict against the previously-applied slot dict for this id. For each changed slot:
    - Spec present → `renderer.setDecoration(id, slot, { kind: <slot>, style })`.
    - Spec cleared (`null` / `undefined`) → `renderer.setDecoration(id, slot, null)`.
  - Same for `effects` via the effect registry.
  - Carry `palette` from NodeOption forward as a forward-compat hook (no wiring yet).
- Adapter helpers:
  - `adaptNodeStyle(style: NodeStyle) → legacy NodeRenderHints fields` for paint + label (reuses the v2 adapter; retargets to read `node.style.bg*` / `node.style.shape`).
  - `applyDecorations(layerId, nodeId, decorations: NodeStyle['decorations'])` — new helper, drives `renderer.setDecoration` from the resolved slot dict. Used by both the data-driven render path AND the existing imperative sugar (`graphLayer.haloNode` writes through this helper so the two entry points share one runtime mechanism).
  - `applyEffects(layerId, nodeId, effects: NodeStyle['effects'])` — mirror for effects.

**Exit criterion:**
- All existing storybook stories render byte-identical (legacy path preserved).
- A unit test or one-off snippet renders a node with only the new `NodeInput` shape (no `data` hints) and produces the same spec the legacy shape would have produced for the same visuals.

### Phase 5 — Migrate the six State stories

**Goal:** the six `apps/storybook/stories/graph/Etc/*` stories (already shipped) move to the new `NodeData` / `NodeOption` shape. Existing State stories under `graph/Nodes/State.stories.ts` and `graph/Edges/State.stories.ts` (legacy `node.data` shape) stay until Phase 7.

**Files:**
- `apps/storybook/stories/graph/Etc/BuiltinHover.stories.ts`
- `apps/storybook/stories/graph/Etc/PerNodeOverride.stories.ts`
- `apps/storybook/stories/graph/Etc/Custom.stories.ts`
- `apps/storybook/stories/graph/Etc/Stacking.stories.ts`
- `apps/storybook/stories/graph/Etc/LayerResolver.stories.ts`
- `apps/storybook/stories/graph/Etc/EdgeTransitions.stories.ts`
- `apps/storybook/stories/graph/Etc/Decorations.stories.ts` (NEW — exercises `style.decorations` slot dict via state overlays)

**Pattern (with a decoration on a state):**

```typescript
const nodes: NodeData[] = [
  {
    id: 'a',
    position: { x: 0, y: 0 },
    style: {
      shape: { kind: 'circle', radius: 36 },
      bgFill: 0x3b82f6,
      labelText: 'A',
    },
    state: {
      hover: {
        bgStrokeColor: 0xffaa00,
        bgStrokeWidth: 4,
      },
      selected: {
        bgStrokeColor: 0xfacc15,
        bgStrokeWidth: 3,
        decorations: { halo: { color: 0xfacc15, width: 4, alpha: 0.6 } },
      },
    },
    states: ['hover'],
  },
];

new GraphLayer({
  id: 'graph',
  options: {
    node: {
      style: { bgStrokeWidth: 1 },
      state: {
        selected: { bgStrokeWidth: 3, bgStrokeColor: 0xfacc15 },
        error:    { decorations: { border: { kind: 'marching-ants', color: 0xff0000 } } },
      },
    },
  },
});

graph.setData({ nodes, edges: [] });
```

`Decorations.stories.ts` is added as a seventh State-folder story specifically exercising the decoration slot dict (halo, glow, pulse, border) toggling via state overlays.

**Exit criterion:**
- All six stories render in Storybook (visual confirmation by user).
- `pnpm check-types` clean.

### Phase 6 — Migrate behaviours

**Goal:** behaviours that read `node.data` for visual hints now read `node.style`. State-toggling behaviours write to `node.states` (plural) via the store's `setNodeState` / `updateNode`.

**Files:**
- `packages/graph/src/behaviours/HoverActivateBehaviour.ts`
- `packages/graph/src/behaviours/ClickSelectBehaviour.ts`
- `packages/graph/src/behaviours/LassoSelectBehaviour.ts`
- `packages/graph/src/behaviours/BrushSelectBehaviour.ts`
- `packages/graph/src/behaviours/DragNodeBehaviour.ts`
- `packages/graph/src/behaviours/NodeSizeLODBehaviour.ts`
- `packages/graph/src/behaviours/EdgeSizeLODBehaviour.ts`
- `packages/graph/src/behaviours/LabelCollisionBehaviour.ts`
- `packages/graph/src/behaviours/LabelResolutionLODBehaviour.ts`

**Pattern (LOD behaviours):**

```typescript
// BEFORE — read from node.data render hints
const baseSize = (node.data as NodeRenderHints | undefined)?.size ?? defaults.size;

// AFTER — read from node.style.shape (new path) with legacy fallback
const shape = node.style?.shape;
const baseSize =
  shape?.kind === 'circle' ? shape.radius * 2 :
  shape?.kind === 'rect'   ? Math.min(shape.width, shape.height) :
  (node.data as NodeRenderHints | undefined)?.size ?? defaults.size;
```

**Exit criterion:**
- Behaviour-specific stories (HoverActivate, DragNode, LOD, etc.) still work with both legacy (`node.data` hint) and new (`node.style`) nodes side-by-side.

> **No new tests written this phase per direction.** Existing behaviour stories are the regression bed.

### Phase 7 — Migrate datasets + remaining stories

**Goal:** `packages/graph-datasets` and the rest of the storybook (graph/Layer/, graph/Nodes/, graph/Edges/, graph-layouts/*) migrate to the new shape.

**Files:**
- `packages/graph-datasets/src/**/*.ts` — sample data outputs `NodeData` / `EdgeData` instead of legacy `GraphNode` with `data` hint mixing.
- `apps/storybook/stories/graph/Nodes/State.stories.ts`, `graph/Edges/State.stories.ts` — migrate to new shape; merge with the six new State stories if redundancy exists.
- `apps/storybook/stories/graph/Nodes/NodeLabels.stories.ts`, `graph/Edges/EdgeLabels.stories.ts`.
- `apps/storybook/stories/graph/Layer/*` — graph-level demos.
- `apps/storybook/stories/graph-layouts/**/*.stories.ts` — every layout demo.

**Exit criterion:**
- All storybook stories use the new shape exclusively.
- `pnpm check-types` clean.
- `pnpm --filter @canvas/storybook build` succeeds.

### Phase 8 — Remove legacy types

**Goal:** drop the legacy hint path now that nothing reads it.

**Files:**
- `packages/graph/src/layer/types.ts` — remove `NodeRenderHints`, `EdgeRenderHints`, `Resolvable*RenderHints`, `NodeStateConfig`, `EdgeStateConfig`, `DEFAULT_NODE_STATE_CONFIGS`, `DEFAULT_EDGE_STATE_CONFIGS` (or rewrite the defaults onto the new `NodeOption` path).
- `packages/graph/src/layer/GraphLayer.ts` — remove legacy resolver-walks; `resolveNodeHints` reads only the new path.
- `packages/graph/src/store/types.ts` — drop the deprecated `state` (singular) alias on `GraphNode` / `GraphEdge` if the parallel-name window has been closed.
- Top-level exports prune.

**Exit criterion:**
- Grepping the repo for any remaining legacy identifier (`NodeRenderHints`, `EdgeRenderHints`, `ResolvedNodeDefaults`, `ResolvedEdgeDefaults`, `nodeDefaults`, `edgeDefaults`) returns zero matches.
- All tests green; all stories render.

---

## 5. Verification matrix

| Phase | Typecheck | Tests | Stories | Build |
|---|---|---|---|---|
| 1 — Types | ✓ | existing only (no new) | (untouched) | `@invana/graph` |
| 2 — Store | ✓ | existing only (34 must still pass) | (untouched) | `@invana/graph` |
| 3 — Resolver eval | ✓ | existing only | (untouched) | `@invana/graph` |
| 4 — Render path | ✓ | existing only | all existing render identical | `@invana/graph` |
| 5 — State stories | ✓ | existing only | 7 stories render (incl. Decorations) | storybook |
| 6 — Behaviours | ✓ | existing only | behaviour stories work | storybook |
| 7 — Datasets + stories | ✓ | existing only | all stories on new shape | storybook |
| 8 — Remove legacy | ✓ | all green | all render | full repo |

> Test-writing is intentionally **skipped** for this rollout per direction. The existing test suite (34 store tests + 165 canvas tests) guards regression; new stories serve as the functional bed.

Visual confirmation by user at the end of phases 4, 5, 6, 7.

---

## 6. Risks + rollback strategy

**Risk: state-name collisions** — legacy `state: string[]` (active list) coexists with new `states: string[]` during the deprecation window (Phase 2 onward). The store keeps both readable; writes go to both. Phase 8 drops the legacy alias.

**Risk: resolver evaluation cost** — per-instance resolvers fire once at insert; layer resolvers fire every frame. If profiling shows the per-frame resolver cost is non-trivial, we add memoisation keyed on `(GraphNode.version, fieldKey)`. Out of scope for this rollout.

**Risk: behaviour-side adapter bugs (Phase 6)** — every behaviour gets a focused test for "reads from both legacy `node.data` hints AND new `node.style`". A behaviour that misses either path silently regresses. Mitigation: bundle a small "legacy node + new node + mixed node" mini-fixture used across all behaviour tests.

**Rollback:** every phase is independently revertable since each leaves the legacy path intact until Phase 8. If Phase 5 ships and the new stories regress, revert just that PR; the type definitions stay, no other code depends on them yet.

---

## 7. Open decisions (still pending — flag during review)

These are judgment calls; flag any you'd flip before Phase 1 ships.

1. **Per-instance overlay catalogue lives at `NodeData.state`** (sibling of `style`, not nested inside it). G6-aligned. Removes the recursive type from `data-types-instances.md` §4.
2. **Plural `states` (active list) wins over singular `state` (active list).** Renames existing `node.state: readonly string[]` → `node.states: readonly string[]` over a deprecation window. Updates [[feedback_data_driven_state_field]] semantics.
3. **NodeOption template is registered as `GraphLayerOptions.node`** (one global template at the layer level — G6's `node` field). If we later need *per-type* templates (G6's "type" tag dispatches into different templates), upgrade to `GraphLayerOptions.nodes: Record<string, NodeOption>` keyed by type name.
4. **`palette` on NodeOption is reserved** — typed as `unknown` / opaque in Phase 1, wired in a later phase. (G6 has it; we don't yet.)
4b. **No `animation` field on NodeOption.** Per [[feedback_decoration_vs_animation]], "animation" is the per-frame engine, not a node-level config. The G6 `animation` slot is replaced by `NodeStyle.decorations` and `NodeStyle.effects` (§1.5). Both flow through the standard `style` / `state` precedence.
5. **`combo` and `children` are cold-map metadata** carried through but not yet rendered / queried. Wiring comes when compound-layout or hierarchy-traversal features ship.
6. **Resolver evaluation timing** — per-instance: at insert; layer (NodeOption): at render. Already locked in `data-types-instances.md` §1.
7. **`shape` lives inside `NodeStyle`** (per the earlier discussion thread). State overlays cannot mutate `shape` (runtime guard, not compile-time).

---

## 8. Critical files to modify (full inventory)

| Phase | File | Change |
|---|---|---|
| 1 | `packages/graph/src/layer/types.ts` | Add new types alongside legacy. |
| 1 | `packages/graph/src/layer/index.ts` | Re-export new types. |
| 1 | `packages/graph/src/index.ts` | Re-export new types from root. |
| 2 | `packages/graph/src/store/types.ts` | Extend `GraphNode<D>` / `GraphEdge<D>`. |
| 2 | `packages/graph/src/store/GraphStore.ts` | Copy new fields in install/update. |
| 2 | `packages/graph/tests/store/NodeData.test.ts` | NEW — store round-trip. |
| 3 | `packages/graph/src/layer/GraphLayer.ts` | `setData` overload + resolver eval. |
| 3 | `packages/graph/tests/layer/NodeInput.test.ts` | NEW — resolver semantics. |
| 4 | `packages/graph/src/layer/GraphLayer.ts` | `resolveNodeHints` reads new path. |
| 5 | `apps/storybook/stories/graph/Etc/*.stories.ts` | Six stories migrate. |
| 6 | `packages/graph/src/behaviours/*.ts` | Read-path adapter per behaviour. |
| 7 | `packages/graph-datasets/src/**/*.ts` | Sample data on new shape. |
| 7 | `apps/storybook/stories/**/*.stories.ts` | Remaining stories migrate. |
| 8 | `packages/graph/src/layer/types.ts` | Drop legacy types. |
| 8 | `packages/graph/src/layer/GraphLayer.ts` | Drop legacy resolver-walks. |
| 8 | `packages/graph/src/store/types.ts` | Drop deprecated `state` alias. |

---

## 9. Verification (run before each PR)

```bash
pnpm check-types                                # all packages typecheck
pnpm --filter @invana/graph --filter @invana/canvas test
pnpm --filter @invana/graph build               # ESM + d.ts emit clean
pnpm --filter @canvas/storybook dev             # visual confirmation, port 6006
```

Phases 4 / 5 / 6 / 7 also require manual visual confirmation by the user — pause on each phase boundary, share storybook URLs, get sign-off before moving on.

---

## Status

Pending review. No code changes shipped from this plan yet. Once approved, Phase 1 (types) is mechanical and small — single PR, no behaviour change.
