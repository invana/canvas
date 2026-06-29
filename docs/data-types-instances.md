# Data Types — Input vs Stored Instances

> **File location:** the user wants this committed as `data-types-instances.md` at the repo root per [[feedback_plans_in_repo]]. Written here only because plan mode restricts edits to the harness plan path; move on exit.

> **Status:** discussion / pre-design. No code changes proposed yet — this is a design doc to align before committing. Supersedes the v2 `node-edge-options-plan.md` (container pattern) for the data-model layer; render-shape decisions (NodeStyle field naming, shape kinds, badges, icons, etc.) still hold from that doc.

---

## Context

The redesign so far focused on what `style` *contains* (flat `bg*` keys, badges, icons, label fields) and how state overlays attach to a node. It hasn't addressed a deeper structural question: **the shape we accept from the user is not the shape we store**.

G6, Cytoscape, and similar graph libraries make this distinction explicit:

- **Input** — what the consumer hands to the library when adding nodes. Loose, optional fields, accessors that derive values from raw data.
- **Stored** — what the library holds internally. Required fields, concrete values, optimised for queries and rendering.

The user proposed a G6-style input interface:

```typescript
interface NodeData {
  id: string;
  type?: string;
  data?: Record<string, any>;
  style?: Record<string, any>;
  states?: string[];
  combo?: string;
  children?: string[];
}
```

…with three sharpenings: (a) `style` typed as `NodeStyle` (not `any`); (b) state overlays nested inside `style` (`style.states.hover = { ... }`); (c) `id` resolvable from a function, just like style fields.

This doc models both layers — input and stored — in detail, including how resolvers traverse the boundary.

---

## 1. Two distinct types

```
┌─────────────────────────┐                    ┌──────────────────────────┐
│  NodeInput<D>           │  ──── insert ────▶ │  GraphNode<D>             │
│  (consumer-supplied)    │   resolve(data)    │  (GraphStore-held)        │
│  - id can be a function │   normalise        │  - id is always string   │
│  - style can be partial │   defaults applied │  - states active list    │
│  - many optional fields │                    │  - typed columns + cold  │
└─────────────────────────┘                    └──────────────────────────┘
                                                          │
                                                          │ read
                                                          ▼
                                                ┌──────────────────────────┐
                                                │  GraphLayer render       │
                                                │  - reads GraphNode       │
                                                │  - resolves layer-wide   │
                                                │    defaults per frame    │
                                                └──────────────────────────┘
```

**Per-node resolvers fire ONCE at insert** — the store always holds concrete values. Layer-wide defaults stay resolver-aware and re-evaluate every frame. This matches G6's "mapper at register-time" pattern and keeps `getNode(id).style.bgFill` predictable (always a value, never a function).

The asymmetry is intentional:

| | Per-node (input) | Layer-wide (defaults) |
|---|---|---|
| Resolver fires | Once at insert | Every render |
| Resolver argument | The raw input (esp. `data`) | The stored `GraphNode` |
| Storage form | Concrete value | Resolver kept on the layer |
| Use case | Derive id from data, derive style from data | Time-varying values, group-based theming, LOD-based sizing |

---

## 2. NodeInput<D> — what the consumer passes

```typescript
/** Loose per-node shape accepted by GraphLayer.setData / GraphDataOptions. */
interface NodeInput<D = unknown> {
  /**
   * Stable identity. Required, but may be supplied as a function over
   * `data` — resolved at insert and stored as a concrete string.
   *
   * Common pattern:
   *   { data: { userId: 'u-42', name: 'Ada' }, id: (d) => d.userId }
   */
  id: ResolvableId<D>;

  /** Domain type tag — free-form string. Same as today's `edge.type` predicate. */
  type?: string;

  /** Arbitrary user payload — opaque to the store. */
  data?: D;

  /**
   * Visual style — typed as `ResolvableNodeStyle<D>` so individual fields
   * may be either concrete values or `(data) => value` resolvers. All
   * resolvers fire at insert; the store holds the resolved `NodeStyle`.
   *
   * `style.states` (nested) carries the state-overlay catalogue.
   */
  style?: ResolvableNodeStyle<D>;

  /** Initial active states. Names match keys in `style.states`. */
  states?: readonly string[];

  /** Combo (group) membership — single combo id per node. */
  combo?: string;

  /** Denormalised child ids — kept alongside `parentId` for fast traversal. */
  children?: readonly string[];

  // Graph-store concerns (carry over from current GraphNode):
  parentId?: string;
  position?: { x: number; y: number };
  pinned?: boolean;
}

/** Edge equivalent — mirror with source/target instead of position/parent. */
interface EdgeInput<D = unknown> {
  id: ResolvableId<D>;
  source: string;          // node id (literal — edges reference resolved node ids)
  target: string;
  type?: string;           // predicate (preserves current `edge.type`)
  data?: D;
  style?: ResolvableEdgeStyle<D>;
  states?: readonly string[];
}

/** A value that's either concrete or a function over the raw input data. */
type Resolvable<T, D = unknown> = T | ((data: D) => T);

/** Specifically for id — function form takes the raw data field. */
type ResolvableId<D> = string | ((data: D) => string);

/**
 * Field-by-field resolvable mirror of NodeStyle. Each key is either a static
 * value (T) or a resolver `(data: D) => T`. Resolvers fire at insert.
 *
 * Note: `states` (the nested overlay catalogue) is NOT resolvable per-field
 * at the input level — overlay maps stay static. Layer-wide overlays use
 * `Resolvable<T, GraphNode>` (live, render-time).
 */
type ResolvableNodeStyle<D> = {
  [K in keyof Omit<NodeStyle, 'states'>]?: Resolvable<NodeStyle[K], D>;
} & {
  states?: { readonly [stateName: string]: ResolvableNodeStyle<D> };
};
```

### Example — input

```typescript
const nodes: NodeInput<{ userId: string; name: string; group: 0 | 1 | 2 }>[] = [
  {
    id: (d) => d.userId,                          // resolved at insert
    data: { userId: 'u-42', name: 'Ada', group: 1 },
    type: 'person',
    style: {
      bgFill: (d) => groupColors[d.group],        // resolved at insert
      bgStrokeColor: 0x1f2937,
      labelText: (d) => d.name,                   // resolved at insert
      states: {
        hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
        selected: { bgStrokeColor: 0xfacc15, bgStrokeWidth: 4 },
      },
    },
    states: ['hover'],                            // active immediately
    position: { x: 100, y: 50 },
  },
];
```

After insert, the store holds the concrete form (next section).

---

## 3. GraphNode<D> — what the GraphStore holds

```typescript
/** Stored node — concrete values only, no resolvers. */
interface GraphNode<D = unknown> {
  /** Resolved id. */
  id: string;

  /** Domain type tag. */
  type?: string;

  /** User payload. */
  data?: D;

  /**
   * Resolved style. All per-node resolvers have fired; values are concrete.
   * `style.states` is the static overlay catalogue.
   */
  style?: NodeStyle;

  /** Active state names. */
  states?: readonly string[] | null;

  /** Combo membership. */
  combo?: string;

  /** Children — denormalised, store maintains in sync with `parentId`. */
  children?: readonly string[];

  parentId?: string;
  position?: { x: number; y: number };
  pinned?: boolean;
}

interface GraphEdge<D = unknown> {
  id: string;
  source: string;
  target: string;
  type?: string;          // (UNCHANGED) predicate label
  data?: D;
  style?: EdgeStyle;
  states?: readonly string[] | null;
}
```

### Example — what the store holds for the input above

```typescript
{
  id: 'u-42',                                      // resolved from data.userId
  data: { userId: 'u-42', name: 'Ada', group: 1 },
  type: 'person',
  style: {
    bgFill: 0xef4444,                              // resolved from data.group
    bgStrokeColor: 0x1f2937,
    labelText: 'Ada',                              // resolved from data.name
    states: {
      hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
      selected: { bgStrokeColor: 0xfacc15, bgStrokeWidth: 4 },
    },
  },
  states: ['hover'],
  position: { x: 100, y: 50 },
}
```

### Storage internals

The GraphStore today uses a column store for hot fields (`x`, `y`, `pinned` flags) and a cold map for the rest. The new fields slot in as follows:

| Field | Storage |
|---|---|
| `id` | Map key + slot index |
| `position.x` / `position.y` | Column (Float32) |
| `pinned` flag | Column (bit flag) |
| `data` | Cold map |
| `type` | Cold map |
| `style` | Cold map (single object reference; engine reads on render) |
| `states` | Cold map (small readonly array) |
| `combo` | Cold map (string) |
| `children` | Cold map (readonly string array) |
| `parentId` | Cold map |

No new column types needed. `style`, `combo`, `children` are all cold-map additions.

---

## 4. NodeStyle with nested states

State overlays nest inside `style` (per your message — "style will have states as well, as states as stylings too"). The catalogue is a one-level-deep map of `stateName → Partial<NodeStyle>` — recursion past one level is prevented by the type.

```typescript
interface NodeStyle {
  // ===== Background — the node's main shape paint =====
  bgFill?: ShapeFill;
  bgAlpha?: number;
  bgStrokeColor?: number;
  bgStrokeAlpha?: number;
  bgStrokeWidth?: number;
  bgStrokeAlignment?: 'inside' | 'center' | 'outside';
  bgStrokeDashArray?: readonly [number, number];
  bgStrokeDashOffset?: number;
  bgStrokeCap?: 'butt' | 'round' | 'square';
  bgStrokeJoin?: 'miter' | 'round' | 'bevel';

  // ===== Shape (structural geometry) =====
  shape?: NodeShapeOptions;        // discriminated union: rect | circle | arc

  // ===== Icon / image insets =====
  icon?: NodeIcon;
  image?: NodeImage;

  // ===== Label (flat scalars) =====
  labelText?: string;
  labelColor?: number;
  labelFontSize?: number;
  /* ... see node-edge-options-plan.md for the full label / labelBackground field list ... */

  // ===== Badges (structured list) =====
  badges?: readonly NodeBadge[];

  // ===== State overlays (nested, one level deep) =====
  /**
   * Map of state-name → partial NodeStyle. When a state name appears in
   * `node.states`, this overlay is merged on top of the base `style`.
   * Multiple active states stack in `node.states` order; later wins per
   * field. Style-only by design — overlays cannot change `shape`.
   */
  states?: {
    readonly [stateName: string]: Omit<NodeStyle, 'states'>;
  };
}
```

Key design points:

1. **`Omit<NodeStyle, 'states'>`** in the recursive position prevents `style.states.hover.states.foo` from typechecking. One level only.
2. **`shape` is inside `style`** in the proposed model (per the earlier "should shape go into style?" discussion). State overlays therefore *technically* could touch `shape`, but the runtime enforces "state overlays cannot mutate `shape`" — overlay's `shape` field is ignored. Worth a note in TSDoc; could be tightened to `Omit<NodeStyle, 'states' | 'shape'>` if we want compile-time enforcement.
3. **Badges in overlays** — overlay's `badges` field replaces (not merges) the base `badges` array, because patching arrays by index is rarely what you want.

### `EdgeStyle` mirrors with nested `states`

Same shape, edge-flavoured fields (`strokeColor`, `arrowTargetShape`, label*). No `shape` field on EdgeStyle — edge structure lives in EdgeStyle's path-related fields (`pathType`, `sourceAnchor`, `pathStyleOpts`, etc., per [[feedback_connector_pipeline]]) or as a sibling on EdgeInput.

---

## 5. GraphDataOptions — top-level input

```typescript
interface GraphDataOptions<DN = unknown, DE = unknown> {
  nodes: readonly NodeInput<DN>[];
  edges: readonly EdgeInput<DE>[];

  /**
   * Optional layer-wide id resolvers — applied to nodes/edges that lack an
   * explicit `id`. Cheaper than writing `id: (d) => d.uid` on every node.
   * Per-node `id` (when set) wins.
   */
  nodeIdResolver?: (data: DN) => string;
  edgeIdResolver?: (data: DE) => string;
}
```

`GraphLayer.setData(opts: GraphDataOptions)` walks `opts.nodes`, applies resolvers in order:

1. If the node has `id` set:
   - String → use as-is.
   - Function → call with `node.data`, store result.
2. Else if `opts.nodeIdResolver` is set → call with `node.data`, store result.
3. Else → throw at insert (id is required).

Same logic for style fields: each `ResolvableNodeStyle<D>` field is collapsed via `(typeof v === 'function' ? v(data) : v)` at insert. The store holds the concrete `NodeStyle`.

---

## 6. GraphLayerOptions — layer-wide defaults (resolved at render)

The current `nodeDefaults: ResolvableNodeRenderHints` becomes `nodeDefaults: ResolvableNodeStyle<GraphNode>` — same Resolvable pattern, but the resolver argument is the stored `GraphNode` (not raw input data). Resolvers fire every frame, as today.

```typescript
interface GraphLayerOptions {
  /**
   * Layer-wide style fallback. Each field is either a static value or a
   * resolver `(node: GraphNode) => value`. Fires every render.
   *
   * Precedence (highest wins):
   *   per-node `style` field → layer `nodeDefaults` field → factory default
   */
  nodeDefaults?: ResolvableNodeStyle<GraphNode>;
  edgeDefaults?: ResolvableEdgeStyle<GraphEdge>;

  /**
   * Layer-wide state overlay catalogue. Same shape as per-node
   * `style.states` but resolver-aware. Precedence-wise, layer-state-overlay
   * is applied BETWEEN base style and per-node-state-overlay.
   */
  nodeStateDefaults?: { [stateName: string]: ResolvableNodeStyle<GraphNode> };
  edgeStateDefaults?: { [stateName: string]: ResolvableEdgeStyle<GraphEdge> };
}
```

`ResolvableNodeStyle<GraphNode>` is the same generic type used at the input level, just specialised to a different argument type (`GraphNode` vs. raw `D`). One type, two scopes.

---

## 7. The transformation pipeline

End-to-end, from user input to render:

```
User code
   │
   ▼
GraphDataOptions { nodes: NodeInput<D>[], edges: EdgeInput<D>[] }
   │
   ▼
GraphLayer.setData(opts)
   │
   │  for each node:
   │    1. resolve id   (per-node fn → string | opts.nodeIdResolver | error)
   │    2. resolve style fields (each per-node resolver → concrete value)
   │    3. write to GraphStore (typed columns + cold map)
   │
   ▼
GraphStore { nodeMap, nodeCols, edgeCols, ... }   ← always concrete values
   │
   ▼
GraphLayer render path (per frame):
   1. Read GraphNode from store
   2. Merge layer nodeDefaults (resolve each field against this GraphNode)
   3. Apply active states (in order):
        - layer nodeStateDefaults[name] (resolved against GraphNode)
        - per-node style.states[name] (static)
   4. Hand the merged style to the canvas renderer
```

Per-node resolvers run **once** at insert. Layer resolvers run **every frame**. State overlays are stacked in `node.states` array order — last-set wins per field.

---

## 8. Backward compat

Adoption strategy mirrors the v2 plan: **additive, opt-in per node**.

- New input fields (`style`, `states`, `combo`, `children`, `type`, `id-as-function`) are all optional. Existing code that writes `data` blobs and `state` activations continues to work via the legacy hint path.
- Legacy types (`NodeRenderHints`, `EdgeRenderHints`, `Resolvable*RenderHints`, `Resolved*Defaults`) remain exported. The layer's `resolveNodeHints` reads both legacy and new paths and merges.
- `edge.type: string` (predicate) stays where it is; no rename.
- The existing data-driven `state` field (now `states`) is the same activation mechanism — just renamed plural to match the new API. If keeping `state` (singular) is preferable for back-compat, both names can be supported during transition.

Once stories + behaviours + datasets migrate (a later turn), the legacy path can be removed.

---

## 9. Open decisions (deferred — flag during review)

These are judgment calls I made; flag any you'd flip:

1. **Per-node resolvers fire at insert, not at render.** Store always holds concrete values. Queries like `getNode(id).style.bgFill` return a number, never a function. Layer-wide resolvers stay live.
2. **`combo` and `children` are carried as cold-map metadata.** They're stored but not yet wired into render / hit-test / behaviour. Wiring comes when a feature needs them (compound layouts for combos, hierarchy queries for children).
3. **State overlays nest inside `style.states`**, not as a sibling field. One namespace; one level deep (enforced via `Omit<NodeStyle, 'states'>`).
4. **`states` (plural) on input and store.** Renames existing `node.state: string[]` → `node.states: string[]`. Breaks [[feedback_data_driven_state_field]] semantically but matches the G6-style shape the user proposed. Can support both names during transition if back-compat is needed.
5. **`shape` lives inside `NodeStyle`** (per earlier discussion thread). Could be lifted back out if compile-time prevention of state-morphs-shape becomes a requirement; today the runtime enforces it.
6. **`badges` in state overlays replace (not merge) the base array.** Documented; no per-index patching.
7. **`id`-as-function resolver receives `data` only**, not the whole NodeInput. Symmetric with style-field resolvers at input time.

---

## 10. Critical files to modify (when we commit)

- `packages/graph/src/store/types.ts` — `GraphNode` adds `style`, `states` (plural), `combo`, `children`, `type`. Legacy field aliases retained during transition.
- `packages/graph/src/store/GraphStore.ts` — `installNode` / `installEdge` / `updateNode` / `updateEdge` copy the new fields into the cold map.
- `packages/graph/src/layer/types.ts` — new types: `NodeInput<D>`, `EdgeInput<D>`, `NodeStyle` (with nested `states`), `EdgeStyle`, `Resolvable<T, D>`, `ResolvableId<D>`, `ResolvableNodeStyle<D>`, `ResolvableEdgeStyle<D>`, `GraphDataOptions<DN, DE>`. New layer options: `nodeDefaults: ResolvableNodeStyle<GraphNode>`, `nodeStateDefaults: { [name]: ResolvableNodeStyle<GraphNode> }`.
- `packages/graph/src/layer/GraphLayer.ts` — `setData(opts: GraphDataOptions)` resolves per-node resolvers at insert. `resolveNodeHints` adapts the new `node.style` into the render path. Adapter helpers from v2 plan carry over.
- `packages/graph/src/layer/index.ts`, `packages/graph/src/index.ts` — export new types.

---

## 11. Verification (when we commit)

1. `pnpm check-types` — all 16 packages typecheck.
2. `pnpm --filter @invana/graph test` — store tests verify per-node resolver behaviour (id resolves from data; style resolvers fire at insert).
3. **New unit tests** under `packages/graph/tests/store/`:
   - `NodeInput.test.ts` — `id: (d) => d.uid` resolves at insert.
   - `NodeInput.test.ts` — layer `nodeIdResolver` fallback when per-node `id` absent.
   - `NodeStyle.test.ts` — `style.states.hover` overlay applied when `states: ['hover']`.
   - `NodeStyle.test.ts` — multi-state stacking order (later wins).
4. **Storybook stories** updated to use new `NodeInput` shape:
   - `Graph/Etc/*` (six stories) updated.
   - One new story showing `nodeIdResolver` (layer-wide id resolver).
   - One new story showing `style: { bgFill: (d) => ..., states: { hover: { ... } } }` (per-node resolvers + nested overlays).
5. `pnpm --filter @canvas/storybook dev` — visual verification.

---

## 12. What this doc replaces / supersedes

- **Supersedes** the v2 `node-edge-options-plan.md` for the input/store boundary. Render-shape decisions (NodeStyle field names, shape kinds, badges, icons, label fields) still hold from that doc.
- **Defers** the broader behaviour + dataset migration to a follow-up turn. This doc only specifies the *types*; behaviour code that reads `node.data` for legacy hints continues to work via the adapter.

---

## Next actions (post-review)

1. Lock the seven open decisions in §9.
2. Implement the type definitions in `packages/graph/src/store/types.ts` + `packages/graph/src/layer/types.ts`.
3. Wire `GraphLayer.setData` to evaluate per-node resolvers at insert.
4. Migrate the six `Graph/Etc/*` stories to the new `NodeInput` shape.
5. Run typecheck + tests + storybook visual verification.

Pending review — no code changes yet.
