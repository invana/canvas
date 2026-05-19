# NodeOptions / EdgeOptions Naming + Shape Redesign

## Context

Today's per-item render config lives flat in `node.data` (mixed with user payload), and the type story is fragmented:

- `NodeRenderHints` — per-item static, all optional (`packages/graph/src/layer/types.ts`)
- `ResolvableNodeRenderHints` — layer-wide / state configs, each field `T | (node => T)`
- `ResolvedNodeDefaults` — `Required<Pick<…>>` of mandatory fields after merge with `DEFAULT_NODE_HINTS` (`packages/graph/src/layer/GraphLayer.ts`)

Three issues:

1. **`Resolved*Defaults` is misnamed.** Resolution (firing the per-item resolvers) happens later in the renderer; this is a *merged* record, not a *resolved* one. "Resolved" + "Defaults" reads contradictory.
2. **"Hints" describes intent but blurs structure vs style.** Geometry (`shape`, `innerR`, `endAngle`) sits alongside visuals (`fill`, `alpha`) in one flat bag. State transitions that touch only style can't be cheaply diffed from those that change geometry.
3. **`node.data` is overloaded.** It's the user-payload bucket *and* the render config — there's no clean boundary for "what the consumer's app cares about" vs "what the renderer cares about".

This plan introduces `NodeOptions` / `EdgeOptions` as a container held under `node.options` / `edge.options`, with:

- `shape` — structural geometry (discriminated union of per-shape options)
- `style` — flat-prefixed visuals
- `state` — per-state style overlays (state name → full `NodeStyle`)

…and mirrors the same shape onto edges. Layer-wide defaults become `nodeOptionsDefaults: ResolvableNodeOptions` with field-level resolvers ([[feedback_field_level_resolvers]]).

**Single-shape model:** the node has one paint layer (`bg*`) plus orthogonal insets (`icon`, `image`), text (`label*`), and overlays (`badges`). There is no separate "background card" behind the body — if a multi-layer look is needed, stack fill layers in `bgFill` (`ShapeFill` already supports `ReadonlyArray<ShapeFillLayer>`).

**Container pattern, not flat:** `NodeOptions` is held under `node.options`, not flattened onto `GraphNode`. Two reasons:

1. The new `options.state` (overlay catalogue) doesn't collide with the existing `node.state` (data-driven *active* state list — [[feedback_data_driven_state_field]]). Both can naturally be called `state` because they're at different paths and carry different types (`Record<string, NodeStyle>` vs `readonly string[]`).
2. The existing `edge.type: string` (predicate / FK label) can stay where it is. No rename needed — the new `EdgeShapeOptions` lives at `edge.options.shape`, not `edge.type`.

Result: this change ships as **100% additive**. Existing code reads exactly as it did; only consumers who opt into `node.options` see new behaviour.

---

## NodeOptions

```typescript
type NodeOptions = {
  shape: NodeShapeOptions;
  style?: NodeStyle;
  state?: Record<string, NodeStyle>;
};
```

### NodeShapeOptions (per-shape option types; discriminated union)

One first-class type per shape kind, plus a union for the field:

```typescript
type RectShapeOption = {
  kind: 'rect';
  width: number;
  height: number;
  cornerRadius?: number;
};

type CircleShapeOption = {
  kind: 'circle';
  radius: number;
};

type ArcShapeOption = {
  kind: 'arc';
  innerR: number;
  outerR: number;
  startAngle: number;
  endAngle: number;
};

type NodeShapeOptions =
  | RectShapeOption
  | CircleShapeOption
  | ArcShapeOption;
```

TypeScript enforces "if `kind: 'arc'`, `innerR` is required" — flat fields never could. Each shape variant is independently importable for stories that want to compose shapes piecewise.

### NodeStyle (flat with `bg` / `icon` / `image` / `label` / `badges` prefixes)

**Design rule:** flat prefixed keys for orthogonal scalars; preserve discriminated unions for polymorphic values (fills, icons, images, badges).

```typescript
type NodeStyle = {
  // ===== Background — the node's main shape paint =====
  // Geometry lives in NodeShapeOptions; these fields paint it.
  bgFill?: ShapeFill;            // number | ShapeFillLayer | ShapeFillLayer[]
                                 //   accepts all 6 layer kinds, stacked as array:
                                 //   solid | image | glyph | svg | svg-url | image-inset
  bgAlpha?: number;
  bgStrokeColor?: number;
  bgStrokeAlpha?: number;
  bgStrokeWidth?: number;
  bgStrokeAlignment?: 'inside' | 'center' | 'outside';
  bgStrokeDashArray?: readonly [number, number];
  bgStrokeDashOffset?: number;
  bgStrokeCap?: 'butt' | 'round' | 'square';
  bgStrokeJoin?: 'miter' | 'round' | 'bevel';

  // ===== Icon (vector inset — glyph / svg / svg-url) =====
  icon?: NodeIcon;

  // ===== Image (raster inset) =====
  image?: NodeImage;

  // ===== Label (all scalars, flat) =====
  labelText?: string;
  labelColor?: number;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelFontWeight?: number | string;
  labelFontStyle?: 'normal' | 'italic';
  labelPlacement?: ShapeLabelPlacement;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelAlpha?: number;
  labelMinFontSize?: number;
  labelRotation?: number;        // radians
  // Label background (flattened)
  labelBackgroundFill?: number;
  labelBackgroundAlpha?: number;
  labelBackgroundStrokeColor?: number;
  labelBackgroundStrokeWidth?: number;
  labelBackgroundPadding?: number;
  labelBackgroundCornerRadius?: number;

  // ===== Badges (multiple — kept as structured list) =====
  badges?: readonly NodeBadge[];
};
```

All fields are optional. The same `NodeStyle` type is used for both the base `style` and each entry in `state` — state overlays just supply the fields that change. There's no separate `Partial<NodeStyle>` type.

### Polymorphic value types (kept structured)

```typescript
// 3 vector inset kinds
type NodeIcon =
  | { kind: 'glyph';   char: string; fontFamily?: string; fontWeight?: number | string;
      fontStyle?: 'normal' | 'italic'; color?: number; alpha?: number;
      sizeRatio?: number; anchor?: InsetAnchor }
  | { kind: 'svg';     pathD: string; viewBox?: { width: number; height: number };
      strokeWidth?: number; color?: number; alpha?: number;
      sizeRatio?: number; anchor?: InsetAnchor }
  | { kind: 'svg-url'; url: string; viewBox?: { width: number; height: number };
      strokeWidth?: number; color?: number; alpha?: number;
      sizeRatio?: number; anchor?: InsetAnchor };

// raster inset
type NodeImage = {
  url: string;
  alpha?: number;
  sizeRatio?: number;
  anchor?: InsetAnchor;
  fit?: 'fill' | 'cover' | 'contain' | 'none' | 'tile';
};

// badges — list of structured items (can't flatten N items)
type NodeBadge = {
  id?: string;                                   // for keyed updates/animation
  placement: BadgePlacement;
  shape?: 'circle' | 'rect' | 'pill';            // default 'circle'
  size?: number;                                 // pixels, default 12
  fill?: number;
  alpha?: number;
  strokeColor?: number;
  strokeWidth?: number;
  icon?: NodeIcon;                               // optional inset in the badge
  labelText?: string;                            // e.g. "3" for a count badge
  labelColor?: number;
  labelFontSize?: number;
  offsetX?: number;
  offsetY?: number;
  zIndex?: number;
};

type BadgePlacement =
  | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  | 'top' | 'bottom' | 'left' | 'right'
  | { x: number; y: number };
```

### state (overlay catalogue)

```typescript
type NodeOptions = {
  // …
  state?: Record<string, NodeStyle>;
};
```

Each value is a full `NodeStyle`; supply only the fields that change for the overlay. Canonical names (`hover`, `selected`, `active`, `highlighted`, `dimmed`, `disabled`, `error`, `focused`) get default configs auto-registered on the layer; new names register on first use here.

**Style-only by design.** State overlays cannot change `shape` (the structural kind/params). State transitions become pure style diffs — the renderer can short-circuit geometry rebuild on hover / selected / etc.

Activation: when `GraphNode.state` (the data-driven active-state list) includes a name, the renderer applies that state's style overlay on top of the resolved base style. Multiple active states stack in the order listed; later wins per field.

---

## GraphNode shape change (container)

```typescript
// BEFORE
type GraphNode = {
  id: string;
  data?: {                            // mixed: render hints + user payload
    shape?: NodeShapeKind;
    fill?: number;
    /* …all 13 hint fields plus user keys… */
  };
  state?: readonly string[] | null;
};

// AFTER
type GraphNode<D = unknown> = {
  id: string;
  position?: { x: number; y: number };
  pinned?: boolean;
  parentId?: string;
  data?: D;                           // pure user payload (unchanged)
  state?: readonly string[] | null;   // active state names (unchanged)
  options?: NodeOptions;              // (new) render options container
};
```

`data` stays opaque user payload. `state` stays the active-list field (data-driven, per [[feedback_data_driven_state_field]]). The new `options` carries `shape`, `style`, and per-state `style` overlays.

---

## EdgeOptions (mirrored shape)

```typescript
type EdgeOptions = {
  shape: EdgeShapeOptions;
  style?: EdgeStyle;
  state?: Record<string, EdgeStyle>;
};
```

### EdgeShapeOptions

Per [[feedback_connector_pipeline]], edges have three stages: anchor → router → pathStyle. All three are structural (they affect geometry), so they live in `shape`. Edges don't have multiple discriminated shape kinds (unlike nodes' rect/circle/arc), so this is a single interface — not a union:

```typescript
type EdgeShapeOptions = {
  pathType?: EdgePathType;
  sourceAnchor?: EdgeAnchor;
  targetAnchor?: EdgeAnchor;
  sourceAnchorOpts?: Readonly<Record<string, unknown>>;
  targetAnchorOpts?: Readonly<Record<string, unknown>>;
  pathStyleOpts?: Readonly<Record<string, unknown>>;
  waypoints?: ReadonlyArray<{ x: number; y: number }>;
};
```

### EdgeStyle

Edges have a single stroke (the path), so stroke fields are unprefixed. Arrow ends and label keep their distinct prefixes.

```typescript
type EdgeStyle = {
  // Path stroke
  strokeColor?: number;
  strokeAlpha?: number;
  strokeWidth?: number;
  strokeAlignment?: 'inside' | 'center' | 'outside';
  strokeDashArray?: readonly [number, number];
  strokeDashOffset?: number;
  strokeCap?: 'butt' | 'round' | 'square';
  strokeJoin?: 'miter' | 'round' | 'bevel';

  // Arrows (two ends — flat prefix per end)
  arrowSourceShape?: ArrowShape;                  // 'triangle' | 'diamond' | 'circle' | 'none'
  arrowSourceSize?: number;
  arrowSourceColor?: number;
  arrowSourceAlpha?: number;
  arrowTargetShape?: ArrowShape;
  arrowTargetSize?: number;
  arrowTargetColor?: number;
  arrowTargetAlpha?: number;

  // Label (mirrors NodeStyle label fields where applicable)
  labelText?: string;
  labelColor?: number;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelFontWeight?: number | string;
  labelFontStyle?: 'normal' | 'italic';
  labelPlacement?: ConnectorLabelPlacement;
  labelPathOffset?: number;
  labelAutoRotate?: boolean;
  labelKeepUpright?: boolean;
  labelOffsetX?: number;
  labelOffsetY?: number;
  labelAlpha?: number;
  labelMinFontSize?: number;
  labelBackgroundFill?: number;
  labelBackgroundAlpha?: number;
  labelBackgroundStrokeColor?: number;
  labelBackgroundStrokeWidth?: number;
  labelBackgroundPadding?: number;
  labelBackgroundCornerRadius?: number;
};
```

### GraphEdge shape

```typescript
type GraphEdge<D = unknown> = {
  id: string;
  source: string;
  target: string;
  type?: string;                      // (UNCHANGED) predicate / FK label
  data?: D;
  state?: readonly string[] | null;
  options?: EdgeOptions;              // (new) render options container
};
```

`edge.type: string` stays as the predicate label — no rename, no breaking change. The new structural config lives at `edge.options.shape`.

---

## Layer-wide defaults — `ResolvableNodeOptions`

Per [[feedback_field_level_resolvers]], every style/shape field at the layer level is `T | ((node) => T)`. Per-node `node.options` stays static.

```typescript
type Resolvable<T, I> = T | ((item: I) => T);

type ResolvableNodeStyle = {
  [K in keyof NodeStyle]?: Resolvable<NonNullable<NodeStyle[K]>, GraphNode>;
};

type ResolvableNodeShapeOptions = Resolvable<NodeShapeOptions, GraphNode>;

type ResolvableNodeOptions = {
  shape?: ResolvableNodeShapeOptions;
  style?: ResolvableNodeStyle;
  state?: { [stateName: string]: ResolvableNodeStyle };
};

type GraphLayerOptions = {
  // … (legacy fields preserved) …
  nodeOptionsDefaults?: ResolvableNodeOptions;
  edgeOptionsDefaults?: ResolvableEdgeOptions;
};
```

State overlays live inside `nodeOptionsDefaults.state`, not in a separate `nodeStateStyleConfigs` option. One option, three fields, mirrors the per-node shape exactly.

### Resolution order (per node, per frame)

1. **Built-in defaults** — engine factory values for required fields (legacy `DEFAULT_NODE_HINTS`)
2. **Layer `nodeDefaults`** (legacy ResolvableNodeRenderHints) — applied first
3. **Layer `nodeOptionsDefaults`** — `ResolvableNodeOptions`, resolvers fire with this node; adapted to legacy hints
4. **Per-node `node.data`** (legacy)
5. **Per-node `node.options.shape` + `node.options.style`** — static, wins over layer defaults
6. **Active state overlays** — for each name in `node.state[]`, in order:
   - Layer `nodeStateConfigs[name]` (legacy, resolved)
   - Layer `nodeOptionsDefaults.state[name]` (resolved + adapted)
   - Per-node `node.options.state[name]` (static, adapted)
7. **Final flat NodeRenderHints** → handed to renderer

State application stacks; later states override earlier states. Per-node overrides layer at every level.

---

## First deliverable: state-transition stories

**Stories ship before the rename hits the rest of the codebase.** They serve two purposes: (a) validate the new shape ergonomically before mass migration; (b) become the regression bed when we rewire the renderer.

Path: `apps/storybook/stories/Graph/States/` (per `apps/storybook/CLAUDE.md` namespacing).

### Stories

**1. `BuiltinHover.stories.ts`** — default hover behaviour with no per-node overrides

```typescript
const nodes: GraphNode[] = [
  {
    id: 'rest',
    position: { x: -90, y: 0 },
    options: {
      shape: { kind: 'circle', radius: 36 },
      style: { bgFill: 0x3b82f6, bgStrokeColor: 0x1d4ed8, bgStrokeWidth: 1,
               labelText: 'resting', labelColor: 0x1f2937 },
    },
  },
  {
    id: 'hovered',
    position: { x: 90, y: 0 },
    options: {
      shape: { kind: 'circle', radius: 36 },
      style: { bgFill: 0x3b82f6, bgStrokeColor: 0x1d4ed8, bgStrokeWidth: 1,
               labelText: 'state: [hover]', labelColor: 0x1f2937 },
    },
    state: ['hover'],  // built-in hover config wins (white stroke, width 3)
  },
];
```

**2. `PerNodeOverride.stories.ts`** — per-node `options.state.hover` overrides the built-in

```typescript
{
  id: 'orange',
  options: {
    shape: { kind: 'circle', radius: 36 },
    style: { bgFill: 0x3b82f6, bgStrokeColor: 0x1d4ed8, bgStrokeWidth: 1 },
    state: {
      hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
    },
  },
  state: ['hover'],
}
```

**3. `Custom.stories.ts`** — user-defined state name, activated via `state: ['criticalAlert']`

```typescript
{
  id: 'alert-1',
  options: {
    shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 8 },
    style: { bgFill: 0xffffff, bgStrokeColor: 0x4a90e2, bgStrokeWidth: 2 },
    state: {
      criticalAlert: { bgFill: 0xffaa00, bgStrokeColor: 0xff0000, bgStrokeWidth: 4 },
    },
  },
  state: ['criticalAlert'],
}
```

**4. `Stacking.stories.ts`** — multiple active states stack (`state: ['selected', 'pulse']`), later wins

```typescript
{
  id: 'sel-dim-pulse',
  options: {
    shape: { kind: 'circle', radius: 36 },
    style: { bgFill: 0x3b82f6, bgStrokeColor: 0x1d4ed8 },
    state: {
      pulse: { bgStrokeWidth: 8, bgStrokeColor: 0xfacc15 },
    },
  },
  state: ['selected', 'dimmed', 'pulse'],
}
```

**5. `LayerResolver.stories.ts`** — layer-wide `nodeOptionsDefaults` with resolvers + layer state overlays

```typescript
new GraphLayer({
  id: 'graph',
  options: {
    nodeOptionsDefaults: {
      shape: (n) => ({ kind: 'circle', radius: 16 * n.data.weight }),
      style: {
        bgFill: (n) => groupColors[n.data.group],
        bgStrokeColor: 0x1f2937,
      },
      state: {
        hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
      },
    },
  },
});
```

**6. `EdgeTransitions.stories.ts`** — edge state overlays, mirrors node story

```typescript
{
  id: 'e2',
  source: 'a2', target: 'b2',
  options: {
    shape: { pathType: 'straight' },
    style: { strokeColor: 0x6b7280, strokeWidth: 2, arrowTargetShape: 'triangle' },
    state: {
      hover: { strokeColor: 0xffaa00, strokeWidth: 5 },
    },
  },
  state: ['hover'],
}
```

These six stories cover: built-in defaults, per-node override, custom state, stacking, layer-resolved configs, and edge mirroring. If all six render and respond to state correctly, the design is validated and the wider rename can proceed.

---

## Backward compat

This redesign is **100% additive**:

- **Only new fields added** to `GraphNode` / `GraphEdge` (`options?: NodeOptions` / `options?: EdgeOptions`). Both optional. Existing code that doesn't set them sees the same behaviour.
- **No fields renamed** on `GraphNode` / `GraphEdge`. `edge.type: string` (predicate) stays exactly where it is.
- **All legacy types preserved**: `NodeRenderHints`, `EdgeRenderHints`, `Resolvable*`, `ResolvedNodeDefaults`, `ResolvedEdgeDefaults` continue to be exported and supported by the layer's render path.
- **Legacy state configs preserved**: `nodeStateConfigs` / `edgeStateConfigs` options still work alongside the new `nodeOptionsDefaults.state`.

Migration is opt-in per node: setting `node.options` activates the new path; omitting it keeps the legacy behaviour byte-for-byte.

---

## Migration

### Renames internal to the new path (don't touch legacy)

| Term in this plan | Type / field name |
|---|---|
| Structural variant (node) | `NodeShapeOptions` (was: `NodeType`) |
| Per-shape options | `RectShapeOption`, `CircleShapeOption`, `ArcShapeOption` |
| Field on container | `shape` (was: `type`) |
| State overlay catalogue | `state: Record<string, NodeStyle>` (was: `stateStyle: NodeStateStyles`) |
| Edge structural variant | `EdgeShapeOptions` (was: `EdgeType`) |
| Edge field on container | `shape` (was: `type`) |
| Container field on `GraphNode` | `options?: NodeOptions` (new) |
| Container field on `GraphEdge` | `options?: EdgeOptions` (new) |

### Critical files to modify

- `packages/graph/src/layer/types.ts` — new type definitions
- `packages/graph/src/layer/GraphLayer.ts` — adapter helpers, `resolveNodeHints` reads `node.options`
- `packages/graph/src/store/types.ts` — add `options?: unknown`; keep `edge.type` (predicate)
- `packages/graph/src/store/GraphStore.ts` — copy `options` in `installNode` / `installEdge` and on patch
- `packages/graph/src/layer/index.ts`, `packages/graph/src/index.ts` — export new types
- `apps/storybook/stories/Graph/States/*` — six stories using `node.options` shape

### Execution order

1. **Land design (this turn)** — types, adapter, stories, exports — all updated to container pattern.
2. **Wait for sign-off** — broader behaviours + dataset migration only after design lock.
3. **(Later)** Migrate `packages/graph-datasets` and existing stories to `node.options`.
4. **(Later)** Migrate behaviour implementations (HoverActivateBehaviour, ClickSelectBehaviour, drag, LOD, label collision, …) to read from `node.options` instead of `node.data` hints where applicable.
5. **(Later)** Once nothing reads the legacy path, remove `NodeRenderHints` / `EdgeRenderHints` / `ResolvableNodeRenderHints` / `Resolvable*EdgeRenderHints` / `Resolved*Defaults` / `DEFAULT_NODE_HINTS` / `DEFAULT_EDGE_HINTS`.

---

## Verification

After landing this design:

1. `pnpm check-types` — typechecks across all 16 packages
2. `pnpm --filter @invana/graph test` — 34 store tests still pass (revert of `predicate` → `type`)
3. `pnpm --filter @canvas/storybook dev` — open `Graph/States/*` and visually verify all six stories
4. **State perf check:** confirm hover on a node triggers a paint but not a geometry rebuild
5. **Field-level resolvers:** `LayerResolver` story should compute `bgFill` and `shape.radius` per node from `data`
6. **Per-node `options.state`** with a custom state name in `state: [...]` activates the overlay immediately on render

---

## Open decisions to lock before broader migration

1. **Badge sizing units** — `size` in pixels (recommended) or fraction of node bound?
2. **`ArrowShape` catalog** — start with `'triangle' | 'diamond' | 'circle' | 'none'`, or import from engine's existing arrow registry if one exists?
3. **Built-in defaults values** — carry over `0x4A90E2` / `0x2C3E50` etc. into the new path verbatim?

---

## Status

Design proposal (v2 — container pattern, 100% additive). Awaiting review before any code changes ship.
