# Group frames paint below edges — the backdrop band

> ## ⚠️ SUPERSEDED by [`render-planes-and-emphasis-plan.md`](./render-planes-and-emphasis-plan.md)
>
> The **diagnosis** in §1–§2 holds and is carried forward verbatim: `behindChildren` only
> sorts *within* `shapeLayer`, which sits above every connector, so an expanded group frame
> occludes every edge that crosses it.
>
> The **mechanism** does not. This plan enters the backdrop by *reparenting* into a fourth
> plain `Container`, which is why it needed a `raiseShape` home-band restore fix, a
> decoration-lifetime analysis, and careful destroy ordering. Pixi 8.18.1 ships
> `RenderLayer`, whose `attach()` changes render order **without** reparenting — every one
> of those hazards disappears, and the same primitive also solves the unrelated-looking
> hover/mute performance problem. `backdrop` survives as one `plane` out of five.
>
> Kept for the diagnosis and as the rejected-alternatives record. **Do not implement this.**

**Status:** ~~proposed, decisions locked (§0)~~ **superseded**. Contained change in `@invana/canvas` +
`@invana/graph` + one editor field in `@invana/canvas-ui`; no new package, no new
behaviour.

## 0. Decisions

| # | Decision | Consequence |
|---|---|---|
| D1 | **Backdrop is the default** for expanded `behindChildren` frames | fixes every group graph at once; visible change across the existing group/combo stories — phase 3 sweep is mandatory, not optional |
| D2 | **`NodeStyle.band` is public** — any node can declare itself a backdrop | new public styling concept: TSDoc, editor field, serialisation round-trip, and **band-aware hit resolution** (§4.3) |
| D3 | **Fixed enum** `'default' | 'backdrop'`, four hardcoded containers | paint order stays one readable constant in `PrimitivesRenderer`; no band registry, no runtime order state |
| D4 | **Shapes only** — no `BaseConnectorSpec.band` | field is shaped so connectors can mirror it later; nothing in scope needs it |

D2 supersedes the `group.behindEdges` escape hatch from the first draft — see §4.4.

---

## 1. Symptom

Any graph that uses **group frames** (`style.group`) loses edge content wherever an
edge crosses a frame. Labels vanish outright; paths disappear under the frame fill and
reappear on the far side.

`apps/storybook/stories/usecases/InvanaArchitecture.stories.tsx` is the reproduction —
eleven pastel stage frames, fifteen labelled edges. Without a workaround:

| Label | Fate |
|---|---|
| `4 · simulate` | gone (edge lives *inside* the Simulation frame) |
| `shapes` | gone (inside the Context frame) |
| `ranked strategies` | gone |
| `5 · approved action` | gone |
| `recall past episodes` | clipped to `recall past ep` at the Decision frame's left edge |
| `3 · grounded context` | bisected by the Observe frame's top edge |

The story currently works around it in `onReady` by walking every edge with a resolved
`labelText` and calling `renderer.raiseConnector(id, 1)` — plus re-asserting the raise on
`shape:pointerout` / `connector:pointerout`, because `HoverActivateBehaviour` resets the
z of anything it touched. That workaround is the thing this plan deletes.

## 2. Diagnosis — it's a band bug, not a label bug

`PrimitivesRenderer` builds three sub-containers, in this insertion (= paint) order
(`PrimitivesRenderer.ts:414-435`):

```
connectorLayer  →  shapeLayer  →  overlayLayer
```

`_container` is deliberately **not** `sortableChildren`, so the three bands are a hard
ordering: every connector paints under every shape. A raise reparents into
`overlayLayer`, which is the only way out.

A group frame is a **shape**. `behindChildren` is honoured like this
(`GraphLayer.ts:1438-1442`):

```ts
const baseZ = (style as { zIndex?: number }).zIndex;
let zIndex: number | undefined = baseZ;
if (group && !group.collapsed && group.behindChildren !== false) {
  zIndex = (baseZ ?? 0) - 1;
}
```

That `-1` sorts the frame **within `shapeLayer`**. So the frame is behind its own
children and in front of *every edge in the graph* — including edges that merely pass
through the region it occupies and have nothing to do with the group.

So the invariant `behindChildren` promises is only half-delivered. A frame is a
**backdrop**; it is being painted in the **node** band. Every symptom in §1 follows from
that one fact, and the label symptoms are downstream of it — an edge label is a
`LabelConnectorDecoration` mounted into `connector.gfx`
(`PrimitivesRenderer.ts:1220`), so it inherits the connector's band and dies with it.

This also matches prior art: group/parent nodes render below edges in yFiles (the
background group of `GraphModelManager`) and in G6 combos, for exactly this reason — a
large opaque rect in the node band swallows the graph.

## 3. Why this is not a behaviour

Worth stating, because "raise the labelled edges" reads like behaviour code:

- **Nothing owns it.** There is no group behaviour. Group frames are rendered by
  `GraphLayer` directly from `style.group`; `CollapseExpandBehaviour` only toggles the
  `collapsed` flag. `HoverActivateBehaviour` / `ClickSelectBehaviour` own *transient* z
  (hover, selection) — not paint order.
- **It isn't interaction state.** Paint band is a static consequence of "this node is a
  frame", declared once in `style.group`. A behaviour would re-declare what the style
  already says.
- **It would rebuild the workaround.** A behaviour has no render hook, so it would have
  to re-assert the z on every add / relayout / theme flip / `pointerout` — i.e. exactly
  the `raiseLabelledEdges()` + `pointerout` listener pattern being removed, with a
  lifecycle wrapped around it.
- **Rule 7 makes it worse.** Behaviours never auto-enable, so groups would render wrong
  by default until the consumer registers *and* enables a behaviour to make
  `behindChildren` mean what it says.

The fix belongs where the frame's z is already decided: `GraphLayer.nodeSpec`, plus one
new band in the renderer for it to point at.

## 4. Design

### 4.1 `@invana/canvas` — a fourth band

Add `backdropLayer` as the **first** child of `_container`, below `connectorLayer`:

```
backdropLayer  →  connectorLayer  →  shapeLayer  →  overlayLayer
```

Shapes opt in through a new field on `BaseShapeSpec` (`primitives/types.ts:385-408`):

```ts
/**
 * Which paint band this shape mounts into. `'default'` (the default) is the
 * shape band, above connectors. `'backdrop'` is below connectors — for
 * silhouettes that frame other content rather than sit among it.
 *
 * Visual only: hit-testing is driven by the spec `zIndex` recorded in the hit
 * index, not by the display tree, so the band does not change picking.
 */
readonly band?: 'default' | 'backdrop';
```

The name stays geometric — `primitives/` may not reference "group" (domain-free
primitives rule). `'backdrop'` also earns its keep beyond groups: swimlane bodies, map
plates, region shading.

Renderer changes, all mechanical:

- Construct + `addChild` `backdropLayer` first; `sortableChildren = true` (nested frames
  sort inside the band).
- `addShape` (`:573-581`) resolves the mount container from `spec.band` and uses it for
  **both** `host.surface` and `addChild`.
- `updateShape` re-parents when `band` changes in a patch (collapse ⇄ expand does this).
- `raiseShape(id, 0)` (`:783-786`) must restore to the shape's **home band**, not the
  hardcoded `shapeLayer` — see §4.3.
- `removeShape` needs no change: it goes through `inst.shape.destroy()`, which is
  parent-agnostic.

`connectorLayer`'s TSDoc (`:333-341`) currently explains that connector decorations are
naturally clipped by shapes on top; extend it to describe the four-band stack.

### 4.2 `@invana/graph` — a public `NodeStyle.band`, defaulted for frames

Per **D2** the band is authorable on any node, not just a group frame:

```ts
/**
 * Which paint band this node renders into. `'backdrop'` puts it **below every
 * edge** — for silhouettes that frame or shade other content (group frames,
 * region shading, legend plates) rather than sit among it. `'default'` is the
 * normal node band, above connectors.
 *
 * Defaults to `'backdrop'` for an **expanded** group frame with
 * `group.behindChildren !== false`, and `'default'` for everything else.
 * Setting it explicitly always wins — `band: 'default'` on a frame is how you
 * ask a group to occlude the edges crossing it.
 */
readonly band?: 'default' | 'backdrop';
```

In `GraphLayer.nodeSpec` (`:1433-1442`), where `behindChildren` is interpreted today:

```ts
const isBackdropFrame =
  group !== undefined && !group.collapsed && group.behindChildren !== false;
// Explicit author intent beats the group-derived default (D2).
const band = style.band ?? (isBackdropFrame ? 'backdrop' : 'default');

// Keep the zIndex push-back: inside the band it orders nested frames, and the
// hit index still consults it for frame-vs-child resolution.
let zIndex: number | undefined = baseZ;
if (band === 'backdrop' && isBackdropFrame) {
  zIndex = (baseZ ?? 0) - 1 - this.depthOf(node.id);
}
```

Three details:

- **Nesting.** Subtracting `depthOf(nodeId)` puts an outer frame below an inner one
  inside the band. `depthOf` already exists (`GraphLayer.ts:2365`, used for group
  auto-fit ordering) — no new traversal.
- **Collapsed groups keep today's path.** A collapsed group is a normal interactive node
  again; it *should* occlude edges like any node, so it falls through to `'default'`.
  The existing `!group.collapsed` guard already draws that line, and the collapse ⇄
  expand transition becomes a band change handled by `updateShape`.
- **Emit `band` unconditionally**, like `alpha` / `visible` / `fill` already are
  (`GraphLayer.ts:1456-1476`). The renderer partial-merges patches onto the cached spec,
  so omitting the field on the "now default" pass after an expand → collapse would leave
  the stale `'backdrop'` in place and the node would stay under the edges.

### 4.3 Band-aware hit resolution (new, forced by D2)

Picking consults the spec `zIndex` recorded at insert
(`hit.insert(id, 'shape', bounds, spec.zIndex ?? 0)`, `PrimitivesRenderer.ts:585`),
independent of the display tree. That was harmless while only group frames were
backdrops — the `-1` push-back kept pick order and paint order in agreement, and expanded
frames are skipped by hover/select anyway (`GraphLayer.ts:2105-2106`).

With an author-settable band that breaks: a hittable backdrop node at `zIndex: 0` paints
below every edge but still ties with normal nodes for the pick. Paint order and pick
order must be derived from the same key:

```ts
const BAND_STRIDE = 1_000_000;
const bandOrder = { backdrop: -1, default: 0 } as const;
const pickZ = bandOrder[spec.band ?? 'default'] * BAND_STRIDE + (spec.zIndex ?? 0);
```

Insert `pickZ` instead of the raw `zIndex`, and re-insert on any `updateShape` that
changes `band`. One expression, and it makes "what you see is what you click" true by
construction rather than by convention.

### 4.4 The escape hatch is `band: 'default'` — no `behindEdges`

The first draft proposed `group.behindEdges?: boolean` for "this frame *should* hide what
crosses it". **D2 makes it redundant**: `style.band: 'default'` on the frame node is the
same instruction, through the field that already exists, with explicit-wins precedence
doing the work. Dropped — one fewer field, one fewer interaction to document.

### 4.5 Fix `raiseShape`'s restore target

Today:

```ts
if (zIndex === 0) {
  gfx.zIndex = 0;
  if (gfx.parent !== this.shapeLayer) this.shapeLayer.addChild(gfx);   // ← hardcoded
}
```

Any backdrop frame that gets raised once — `ClickSelectBehaviour.applyRaise` will do it
the moment a frame is selectable — is permanently promoted into the node band on
release, silently reintroducing the bug for that node. The restore must read the
instance's home band (`inst.spec.band`). **This is required, not optional**, and is the
one part of the change with a real regression risk if missed.

## 5. Touch list

| File | Change |
|---|---|
| `packages/canvas/src/primitives/types.ts` | `BaseShapeSpec.band` + TSDoc |
| `packages/canvas/src/primitives/PrimitivesRenderer.ts` | `backdropLayer`; band-aware `addShape` / `updateShape` (re-parent + re-insert hit); band-aware `pickZ` (§4.3); `raiseShape` home-band restore; band TSDoc on the sub-layer block |
| `packages/graph/src/layer/types.ts` | public `NodeStyle.band` + TSDoc; update the `behindChildren` / group-semantics TSDoc (`:760-790`) to name the band |
| `packages/graph/src/layer/GraphLayer.ts` | resolve + emit `band` (explicit-wins) and the depth-aware push-back in `nodeSpec` |
| `packages/canvas-ui/src/editor-panels/node-style/simple/{fields,mapping}.ts` | `band` select in the advanced section (D2 — see note below) |
| `packages/canvas/src/export/svgExport.ts` | emit backdrop-band shapes first so exports match the screen |
| `packages/canvas/src/export/stateExport.ts` | confirm the new field round-trips (plain enum string — expected to be free) |
| `apps/storybook/stories/usecases/InvanaArchitecture.stories.tsx` | delete the `onReady` raise block + the now-unused `graph` / `renderer` locals; trim the doc-comment paragraph about it |

**On the editor field:** rule 12's obligation is per Behaviour / Layer / Layout, and this
plan adds none — but D2 makes `band` a *public styling* concept, so it should be
reachable from the node-style editor. Note the precedent: `NodeStyle.zIndex` and
`group.behindChildren` have **no** editor coverage today, so `band` is the first
paint-order field to get a control. Cheapest consistent option is a select in the
existing advanced section (`editors/_shared/AdvancedSection.tsx`); a broader
"paint order" group covering `zIndex` + `behindChildren` + `band` is a reasonable
follow-up but out of scope here.

Deliberately untouched: `LabelConnectorDecoration` (labels stop being a special case),
`HoverActivateBehaviour`, `ClickSelectBehaviour`, `LabelCollisionBehaviour`.

## 6. Risks & edge cases

- **Hit-testing changes shape** under D2 and is now a design item, not a
  verification-only item — see §4.3. For *group frames alone* the retained push-back keeps
  frame-vs-child resolution bit-for-bit unchanged; the `pickZ` work exists for
  author-declared backdrops on ordinary, hittable nodes.
- **`raiseShape` restore** — §4.5. The regression to watch.
- **Two ways to say the same thing.** `band: 'backdrop'` and `group.behindChildren` now
  overlap for frames. The precedence rule (explicit `band` wins) must be stated in both
  TSDoc blocks or it will be rediscovered as a bug.
- **Collapse ⇄ expand** must re-parent, not just re-sort. Covered by `updateShape`;
  needs a story pass on `CollapseExpandBehaviour`.
- **Every existing group/combo story changes appearance** — edges now cross over frames
  instead of hiding under them. That is the intended correction, but it is a visual
  break across the suite and should be eyeballed before merge.
- **Minimap** projects its own specs; confirm it either inherits the band or is
  explicitly band-agnostic.
- **`z` semantics for consumers** who set `style.zIndex` on a group node: their value is
  still honoured as the base, but it can no longer lift a frame above edges. Note it in
  the `behindEdges` TSDoc.

## 7. Phasing

1. **Engine band** — `band` field + `backdropLayer` + band-aware `addShape` /
   `updateShape` / `pickZ` / `raiseShape`. No consumer emits `'backdrop'` yet, so this
   ships inert and is independently revertible.
2. **Graph** — public `NodeStyle.band`, explicit-wins resolution, frame default (D1).
3. **Story cleanup + visual sweep** — delete the workaround; walk every group/combo
   story and usecase demo. D1 makes this a required gate, not a nicety.
4. **Editor field + export parity** — `band` control, SVG order, `stateExport` check.

**Acceptance:** re-render `Usecases/InvanaArchitecture` with no `onReady` logic and all
six labels from §1 render in full. Strictly better than the current workaround, which
lifts path + label together and leaves the arrows floating over the frames.

## 8. Rejected alternatives

- **`EdgeStyle.labelOnTop` + a topmost label band.** Treats the symptom. Needs a per-edge
  opt-in, leaves the *paths* occluded, and adds a decoration-lifetime problem (a label
  reparented out of `connector.gfx` no longer dies with its host).
- **A generic `plane` on the decoration spec.** Same objection, larger surface.
- **A `GroupFrameBehaviour`.** §3.
- **Making `_container` sortable.** Collapses the band model into one flat z space and
  breaks the "connector decorations are clipped by shapes" contract the sub-layer TSDoc
  depends on.

## 9. Open questions

Resolved by §0: default-on (D1), public `NodeStyle.band` (D2), fixed enum (D3), shapes
only (D4). `behindEdges` dropped (§4.4). Remaining:

1. `band` as a `BaseShapeSpec` field (proposed) vs a separate `renderer.setBand(id, …)`
   call. The field keeps the spec the single source of truth and survives patch-merge;
   the call avoids widening the spec type. Leaning field.
2. Does `band` belong in the **simple** node-style editor, or only the advanced/overview
   panel? It is a power-user field and the first paint-order control in the kit (§5).
3. Should `MiniMapLayer` mirror the band in its projection, or flatten every node into
   one plate? Flattening is likely right for a minimap, but it should be a decision, not
   an accident.

## 10. Related

- `z`-claim clobbering is a separate, pre-existing bug in the same family:
  `HoverActivateBehaviour.resetRaise` (`:708-718`) and
  `ClickSelectBehaviour.resetRaise` (`:669-679`) both write an **absolute**
  `raise*(id, 0)` with no knowledge of other claimants, so hovering a *selected* node and
  moving away drops it out of the overlay while it is still selected. Fix is an
  owner-keyed claim registry (`raise(id, z, owner)` / `release(id, owner)`, effective
  z = max of live claims). Independent of this plan; own PR.
- `docs/large-graph-performance-plan.md` — the other consumer of the sub-layer stack.
