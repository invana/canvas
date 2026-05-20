# Badges plan — edges + node parity upgrade

Status: draft for review. Engine code not started.

## Why this plan exists

The canvas-level badge system (`packages/canvas/src/primitives/badges/`, `PrimitivesRenderer.setBadge`) is rich:

- `shape: BadgeShapeSpec` — any registered shape kind (circle / rect / polygon / regular-polygon / arc / star) with any fill (solid / glyph / svg / image).
- `placement: BadgePlacement` — eight named points around the host AABB.
- `origin: BadgePlacement | 'center'` — which point of the badge AABB lands on the host anchor.
- `decorations: Record<slot, DecorationSpec>` — every registered decoration kind (glow, ring, marching-ants, pulse-ring) can attach to a badge.

The graph-level wrapper (`NodeStyle.badges: NodeBadge[]`) flattens that down to a much smaller surface:

- `shape: 'circle' | 'rect' | 'pill'` — three sugar choices, not the full shape union.
- No `decorations`.
- No `effects`.
- Edge badges don't exist.

So there are two gaps to close:

1. **Edge badges** (net new) — a connector-side placement model + `EdgeStyle.badges`.
2. **Node-badge parity** — bring `NodeBadge` up to the canvas-level expressiveness so "badges are shapes that can host decorations and effects" holds in the graph API too.

---

## Edge badges — placement model

Connector-side placements differ from node-side because a connector has no corners; it has an arc-length parameter `t ∈ [0, 1]` along the routed path.

The canvas already defines `ConnectorLabelPlacement` (`packages/canvas/src/primitives/types.ts:1293`):

```ts
type ConnectorLabelPlacement = 'start' | 'center' | 'end' | number;
```

`number` is a `t` value in `[0, 1]`. `'start'` / `'center'` / `'end'` are sugar for `0` / `0.5` / `1`.

**Proposed `EdgeBadgePlacement` (new):**

```ts
type EdgeBadgePlacement = 'start' | 'middle' | 'end' | number;
```

Spelling note — `'middle'` instead of `'center'`. Edge badges sit *along* the path; `'center'` would collide with the node-badge `origin: 'center'` ("centre the badge on its anchor"), which is a different concept. `'middle'` reads naturally as "midpoint of the path" and avoids the term clash.

### Endpoint resolution

`'start'` and `'end'` resolve to the **visible path endpoints** (after the anchor resolver picks a silhouette point and after marker insets shorten the line). This matches how `LabelConnectorDecoration` already positions edge labels — same `samplePathAt(host.path, t)` call, same parametric walk. Loop edges naturally get a sensible `'middle'` (apex of the loop) because their path passes through it at `t ≈ 0.5`.

### Per-badge fields

```ts
interface EdgeBadge {
  readonly id?: string;                            // diff identity
  readonly placement: EdgeBadgePlacement;          // 'start' | 'middle' | 'end' | number
  readonly shape: NodeShapeOptions;                // same discriminated union nodes use
  readonly size?: number;                          // optional sugar — auto-fills the shape's primary dim
  readonly fill?: number;                          // sugar over shape.fill solid colour
  readonly alpha?: number;
  readonly strokeColor?: number;
  readonly strokeWidth?: number;
  readonly icon?: NodeIcon;                        // reuse the existing NodeIcon union
  readonly labelText?: string;                     // single-char or short text
  readonly labelColor?: number;
  readonly labelFontSize?: number;

  // placement controls
  readonly pathOffset?: number;                    // px shift along the tangent at `placement`
  readonly offsetX?: number;                       // post-resolution screen-space offset
  readonly offsetY?: number;
  readonly autoRotate?: boolean;                   // rotate to follow path tangent (default false)
  readonly keepUpright?: boolean;                  // flip 180° on underside when autoRotate is true (default true)

  // origin — which point of the badge AABB lands at the path point
  readonly origin?: BadgePlacement | 'center';     // default 'center' for edges (badges centre on the path)

  // composition
  readonly decorations?: readonly EdgeBadgeDecorationSpec[];
  readonly effects?: BadgeEffects;

  readonly zIndex?: number;
}
```

### Why `origin: 'center'` is the edge default

For node badges, the default origin is `mirrorPlacement(placement)` — that makes a `placement: 'top-right'` badge sit *fully outside* the corner. That convention only makes sense for the eight-corner anchor scheme.

For edge badges, every anchor lies *on* the path. The natural default is `'center'` — the badge sits centred on the path point, overlapping the line. Callers who want the badge offset perpendicular to the path use `pathOffset` (along-path) or pick a different `origin` (e.g. `origin: 'top'` to place the badge *above* the path with its bottom edge touching the line).

This is a different default than node badges but the same `origin` field — the surface is consistent even though the defaults differ. The default is documented in the TSDoc.

### Edge cases

- **Self-loops (`pathType: 'loop-*'`)** — covered by parametric `t`. `'middle'` at `t=0.5` lands on the loop's apex (furthest point from the node).
- **Very short edges** — when the visible path is shorter than the badge's own extent, the badge still anchors correctly; visual overlap with the markers / endpoints is the user's problem to dodge via `pathOffset`.
- **Multiple badges at the same `t`** — allowed. They draw in array order; later entries paint on top. Z-fighting is the user's call (use `offsetY` or different placements to separate them).

---

## Node-badge parity upgrade

Two ways to bring `NodeBadge` up to canvas-level power:

### Option A — additive (keep flat schema, add new fields)

```ts
interface NodeBadge {
  // existing fields unchanged
  readonly id?: string;
  readonly placement: BadgePlacement;
  readonly shape?: 'circle' | 'rect' | 'pill';     // stays a 3-choice sugar
  readonly size?: number;
  // ... all existing flat fields

  // new — opt in
  readonly decorations?: readonly NodeBadgeDecorationSpec[];
  readonly effects?: BadgeEffects;
  readonly origin?: BadgePlacement | 'center';     // already supported at canvas level; expose it
}
```

- **Pro:** strictly additive. No breaking change. Existing storybook stories keep working.
- **Con:** the `shape` field stays restricted to `'circle' | 'rect' | 'pill'`. Users who want a star-shaped badge or a polygon-shaped badge can't.

### Option B — structural (replace flat schema with `shape: NodeShapeOptions`)

```ts
interface NodeBadge {
  readonly id?: string;
  readonly placement: BadgePlacement;
  readonly origin?: BadgePlacement | 'center';
  readonly shape: NodeShapeOptions;                // full discriminated union — circle | rect | polygon | regular-polygon | arc | star

  // sugar — still convenient for the common case
  readonly size?: number;
  readonly fill?: number;
  readonly icon?: NodeIcon;
  readonly labelText?: string;
  // ... rest of the flat sugar fields

  readonly decorations?: readonly NodeBadgeDecorationSpec[];
  readonly effects?: BadgeEffects;
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly zIndex?: number;
}
```

- **Pro:** badge gains full shape expressiveness. Same `shape` field shape as `NodeStyle.shape` and the eventual `EdgeBadge.shape` — one consistent type to learn.
- **Con:** breaking change for existing call sites using `shape: 'pill'` (only the storybook story today, per a quick grep). Easy to mechanically port.

**Recommendation:** Option B. Per the memory note "Prefer extending flat enum over orthogonal-field split" — but that's about *adding variants*, and here the choice is about *replacing a 3-element flat union with a richer discriminated union*. `'pill'` was already a rect with `cornerRadius` in disguise; making that explicit (`{ kind: 'rect', cornerRadius: H/2 }`) loses no expressiveness and gains everything.

The package status is "skeleton" — this is the moment to fix the type, not after stories pile up around it.

---

## Decoration + effect surfaces on a badge

Both node badges and edge badges expose:

- `decorations: readonly BadgeDecorationSpec[]` — discriminated union matching `NodeDecorationSpec` / `EdgeDecorationSpec` (`ring`, `glow`, `marching-ants`, `pulse-ring`, ...). The renderer compiles each entry into a `setDecoration(badgeId, slot, spec)` call on the canvas-level badge.
- `effects: BadgeEffects` — open key-value map (matches `NodeEffects` shape): `shake`, `breathing`, plus future kinds.

Open question for the implementation: should `BadgeDecorationSpec` differ between node-attached and edge-attached badges? Since a badge is itself a *shape* regardless of what hosts it, shape decorations apply uniformly — so one union (`BadgeDecorationSpec`) covers both. That's the working assumption.

---

## Implementation outline

Order of work, each landable independently:

### Step 1 — node-badge upgrade (Option B + decorations + effects)

1. `packages/graph/src/layer/types.ts`
   - Update `NodeBadge` per Option B (replace `shape?: 'circle'|'rect'|'pill'` with `shape: NodeShapeOptions`).
   - Add `decorations?: readonly NodeBadgeDecorationSpec[]`.
   - Add `effects?: BadgeEffects`.
   - Add `origin?: BadgePlacement | 'center'`.
2. `packages/graph/src/layer/GraphLayer.ts` (or wherever node→renderer projection lives)
   - Translate `NodeBadge` to canvas-level `BadgeOptions` — including the new fields.
3. `apps/storybook/stories/Graph/Nodes/Badges.stories.ts` (new) — story showing node badges with decorations + effects (glow, pulse-ring, shake).
4. Port `Canvas/Shapes/Badges.stories.ts` to use the new `shape` shape (mechanical edit).

### Step 2 — edge badges

5. `packages/graph/src/layer/types.ts`
   - Add `EdgeBadgePlacement`, `EdgeBadge`, `EdgeBadgeDecorationSpec`, `BadgeEffects` types.
   - Add `EdgeStyle.badges?: readonly EdgeBadge[]`.
2. `packages/canvas/src/primitives/PrimitivesRenderer.ts`
   - Add `setEdgeBadge(connectorId, slot, options)` *or* generalise `setBadge` to accept a connector host (it already detects host kind via `addShape` / `addConnector`; the path is to extend it). Decision in step 6.
6. Decide: extend `setBadge(hostId, slot, options)` to dispatch by host kind (shape vs. connector) and accept either `BadgePlacement` or `EdgeBadgePlacement` based on host kind, or add a parallel `setConnectorBadge`. Engine-side detail — placement-level diff between the two host kinds is small.
7. Connector-host badge math — new file `packages/canvas/src/primitives/badges/connectorPlacement.ts`:
   - `resolveEdgeBadgePosition(visiblePath, badgeLocalBounds, options)` → uses `samplePathAt(visiblePath, t)` + `tangentAt` + `pathOffset` + `origin`. Returns `{x, y, rotation}` (rotation only when `autoRotate`).
8. `packages/graph/src/layer/GraphLayer.ts` — translate `EdgeBadge` → renderer call. Wire to the same projection pipeline `NodeBadge` uses.
9. `apps/storybook/stories/Graph/Edges/Badges.stories.ts` (new) — story per `architecture-proposal.md` storybook rule (every new engine primitive ships with a story).

### Step 3 — combo story

10. `apps/storybook/stories/Graph/Badges.stories.ts` (new) — full demo: real graph (e.g. les-misérables) with node *and* edge badges, each carrying a decoration (glow on one, marching-ants on another) and an effect (breathing on a third). Proves the composition.

---

## Open questions for sign-off

These are the calls I'd make if not told otherwise. Flag if any are wrong:

1. **Node-badge upgrade — Option A vs Option B.** Plan recommends B (breaking change at skeleton stage). Confirm or pick A.
2. **`'center'` vs `'middle'` for edge badge midpoint.** Plan picks `'middle'` to avoid clashing with `origin: 'center'`. Confirm.
3. **Default `origin` for edge badges.** Plan picks `'center'` (badge centres on the path point). Confirm.
4. **Engine API — extend `setBadge` vs new `setConnectorBadge`.** Engine-side implementation detail; defer to step 6 unless you have a preference now.
5. **Order of work.** Plan does node-badge upgrade first, edges second, combo story third. Confirm.

Once these are settled, I'll start with Step 1.
