# Groups — minimal compound-container plan

## Context

`@invana/graph` previously shipped (then reverted) a single branch that bundled three distinct features: ER composites, compound groups, and lineage traversal. The scope was too wide and the data model drifted past what the project actually needed.

This document covers **only compound groups** — the visual frame around a set of nodes, with optional auto-fit, user-resize, and collapse / expand. ER composites and lineage are deferred to separate plans.

The goal: an "encapsulation of nodes + edges" that draws as a background frame around its descendants, is interaction-less when expanded, and collapses into a normal-looking node with a count badge and a `+` / `−` toggle.

## Design choices (locked)

1. **No new shape kinds.** A group node uses the existing `circle` / `rect` shape kinds. "Group-ness" is signalled by a new `style.group` field, not by a new `shape.kind`.
2. **`style.group` presence = node is a group.** The field carries `{ autoFit, userResizable, padding, collapsed, behindChildren, headerHeight, width, height, radius }`. Resolvable at layer level via `NodeOption.style.group`.
3. **Membership** uses the existing `parentId`. Nested groups fall out for free — a group node whose own `parentId` points at another group becomes a sub-group.
4. **Expanded group is interaction-less.** The frame renders behind its descendants. Domain behaviours (hover, select, drag) filter group nodes via `graphLayer.getGroupRole(id) !== 'expanded'`.
5. **Collapsed group is a normal node.** Descendants are hidden from the renderer; edges that pointed into a hidden descendant re-route to the nearest visible collapsed-group ancestor at render time (no mutation to `edge.source` / `edge.target`).
6. **`autoFit` and `userResizable` are independent flags.** Both `true` → user-dragged size acts as a *floor*; the frame still grows past it when children sprawl.

## Data model

In `packages/graph/src/layer/types.ts`:

```ts
export interface GroupOptions {
  readonly autoFit?: boolean;
  readonly userResizable?: boolean;
  readonly padding?: number;        // default 16
  readonly collapsed?: boolean;     // default false
  readonly behindChildren?: boolean; // default true
  readonly headerHeight?: number;   // default 0
  readonly width?: number;          // rect floor (autoFit) or fixed
  readonly height?: number;         // rect floor or fixed
  readonly radius?: number;         // circle floor or fixed
}

// NodeStyle extension:
group?: GroupOptions;
```

Presence of `style.group` is the only discriminator. `style.shape` stays as `{ kind: 'rect' | 'circle', ... }` — no new union variant.

## Engine wiring

### `GraphLayer` (`packages/graph/src/layer/GraphLayer.ts`)

- **`dirtyGroups: Set<string>`** populated on `node:add` of a group, `node:update` whose patch contains position / parentId on a child of a group, and `node:update` whose patch is the group itself. Drained on `flush` *before* `dirtyConnectors`.
- **`drainDirtyGroups()`** sorts current set by `ancestorsOf` depth (deepest first), `rerenderNode`s each group, then walks each group's parent chain to fan the recompute upward. Bounded by `MAX_PASSES = 32`.
- **`projectGroupShape(groupId, shape, group, pos)`** — applies auto-fit math inside `nodeSpec`:
  - rect: `width = max(declared, childrenAABB) + 2·padding`, `height = … + headerHeight`; reposition to `{ minX − padding, minY − padding − headerHeight }`.
  - circle: `radius = max(declared, sqrt(halfW² + halfH²)) + padding`; centre on AABB centroid.
  - Skipped when `collapsed === true` or when `autoFit !== true` and a declared size is present.
- **Visibility / z-order** are projected into the `BaseShapeSpec`:
  - `visible: false` for any node whose `collapsedAncestor()` walk returns truthy.
  - `zIndex = (style.zIndex ?? 0) − 1` for expanded groups with `behindChildren !== false`.
- **Edge re-routing** lives in `edgeSpec`: `effectiveEndpoint(id)` returns `collapsedAncestor(id) ?? id`. Source/target shape ids are rewritten before the connector spec is handed to the renderer.
- **Synthetic decorations** (`syncGroupSyntheticDecorations`):
  - `group-toggle` slot — `ToggleDecoration` painting `+` when collapsed, `−` when expanded.
  - `group-count` slot — `LabelDecoration` showing the descendant count, only when collapsed.
- **`lastCollapsedByGroup`** cache lets the `node:update` handler detect collapse → expand transitions and fan out a descendant refresh + incident-edge re-route.

### Public helpers on `GraphLayer`

- `isGroupNode(node)` / `isCollapsedGroup(node)` / `collapsedAncestor(id)` / `effectiveEndpoint(id)`.
- `getGroupRole(id): 'none' | 'expanded' | 'collapsed' | undefined` — discriminator behaviours use to filter groups out of hover / select / drag.
- `recomputeGroup(id)` — synchronous escape hatch for feeds that remove children individually (the `node:remove` event payload doesn't carry the parent id, so the layer can't mark the parent dirty automatically on remove).

### Canvas primitives

- **`ToggleDecoration`** (`packages/canvas/src/primitives/decorations/shape/ToggleDecoration.ts`) — small `+` / `−` button at a configurable anchor on the host AABB. Pure visual; exposes `getLocalHitGeometry(): { cx, cy, radius }` for domain behaviours to test pointer hits.
- **`ResizeHandleDecoration`** (`…/ResizeHandleDecoration.ts`) — small square handle at a configurable anchor. Same pure-visual contract; exposes a square hit geometry.
- Both register on `PrimitivesRenderer` under kinds `toggle` and `resize-handle`. `getDecoration(id, slot)` was added so behaviours can introspect the mounted decoration instance.

### Behaviours

- **`CollapseExpandBehaviour`** (`packages/graph/src/behaviours/CollapseExpandBehaviour.ts`) — opt-in. Subscribes to `shape:pointerdown` on the layer renderer; for a group target, reads the `group-toggle` decoration's local hit geometry, converts to world coords via `renderer.getShapePosition(id) + hit`, and toggles `style.group.collapsed` through `store.updateNode` (spread prior style + group per `feedback_updatenode_replaces_style`).
- **`GroupResizeBehaviour`** (`…/GroupResizeBehaviour.ts`) — opt-in. Mounts `resize-handle` decorations on every group with `userResizable: true`; re-mounts on `data:changed`. On pointerdown, checks each handle's AABB; on drag, writes `style.group.width` / `height` / `radius` (and, for non-auto-fit rect groups, the group's `position`).
- **`DragNodeBehaviour`** gains `groupAware: boolean` (default `true`). When dragging a node whose `getGroupRole === 'expanded'`, translates every descendant via `store.setPositionsBulk` inside a single `store.batch` so the subtree moves coherently.

## Storybook

- `apps/storybook/stories/Graph/Groups/RectGroup.stories.ts`
- `apps/storybook/stories/Graph/Groups/CircleGroup.stories.ts`
- `apps/storybook/stories/Graph/Groups/NestedGroups.stories.ts`
- `apps/storybook/stories/Graph/Behaviours/CollapseExpand.stories.ts`
- `apps/storybook/stories/Graph/Behaviours/GroupResize.stories.ts`
- `apps/storybook/stories/Canvas/Decorations/Shapes/Toggle.stories.ts`

All follow the literal-arrays-inside-`play` pattern with `onStoryTeardown` cleanup and `canvas.camera.fitContent(layer.getBounds(), 100)` for centring.

## Out of scope (deferred)

- `ElkLayout` compound emission and a clustering force for `D3ForceLayout` — group nodes are treated as `pinned` for now.
- ER composites (single shape with sub-region rows) and lineage (`LineageBehaviour` + `traceLineage`).
- Group rendering for non-rect / non-circle shapes (passes through `projectGroupShape` unchanged).
- Auto-shrink on individual child removal — `node:remove` doesn't carry parentId; consumers call `recomputeGroup(parentId)` explicitly.

## Verification

1. **Auto-fit rect** — `Graph/Groups/RectGroup` — toggle `autoFit` off and reach for the GUI's `padding` / `headerHeight` to see the frame stop tracking children.
2. **Auto-fit circle** — `Graph/Groups/CircleGroup` — drag children out of the circle; the radius re-fits on next flush.
3. **Nested groups** — `Graph/Groups/NestedGroups` — outer frame wraps both the inner frame and node3.
4. **Collapse / expand** — `Graph/Behaviours/CollapseExpand` — click the `−` → group node renders with count badge; cross-group edge re-routes to the group node. Click `+` → reverse.
5. **User resize** — `Graph/Behaviours/GroupResize` — corner handles drag, the opposite anchor stays fixed (autoFit off).
6. **Group drag carries descendants** — drag the group node; every descendant translates by the same delta.
7. **Toggle visual sanity** — `Canvas/Decorations/Shapes/Toggle` — placement / radius / colour knobs on a plain rect + circle.
8. **`pnpm check-types`** — passes across canvas, graph, behaviours, and storybook.
