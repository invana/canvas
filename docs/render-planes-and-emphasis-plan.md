# planes + emphasis — the render model for `@invana/canvas`

**Status:** proposed, decisions locked (§2). Rewrites how `PrimitivesRenderer` organises
paint order and how transient visual states (hover / mute / select) reach the screen.
Touches `@invana/canvas` + `@invana/graph` + one editor surface in `@invana/canvas-ui`.
No new package, no new behaviour, no new `Layer`.

> ## ⚠️ The emphasis half of this plan is superseded
>
> **Planes (paint order) stand as written.** The emphasis-container design does not.
>
> Emphasis containers were specced to remove a per-element *write*. Profiling the design
> showed the write was never the cost — the **geometry rebuild behind each write** is, and a
> container removes the write while leaving the render work, because colour still propagates
> to every descendant. That is a large mechanism for the small half of the problem, plus a
> second source of visual truth living outside the store.
>
> Replaced by two smaller pieces, in `design.md` §7.2:
> 1. a renderer **colour fast path** — alpha/tint written straight to the display object, no
>    rebuild; sibling of the existing transform fast path;
> 2. **graph-layer sugar** (`focus` / `clearFocus`) beside `highlightNeighbourhood`, composing
>    store writes and setting the kernel's existing focus state.
>
> No `emphasis` axis, no `emphasisBase`/`emphasisFocus` containers, no `setEmphasis` API.
> Sections §4.0.x, §4.2, §4.4 and the D2/D6 decisions are historical — read them for the
> reasoning, not the instructions.

**Supersedes** [`group-frame-paint-band-plan.md`](./group-frame-paint-band-plan.md) —
"backdrop" becomes one plane out of five, and the reparenting mechanics that plan
depended on are replaced wholesale.

---

## 1. Why

Two symptoms that look unrelated share one root cause: **the renderer has exactly three
hardcoded paint containers, and membership in them is expressed by reparenting.**

```ts
// PrimitivesRenderer.ts:414-435
connectorLayer  →  shapeLayer  →  overlayLayer
```

`_container` is deliberately not `sortableChildren`, so those three are a hard ordering:
every connector paints under every shape, and the only way out is `raiseShape` /
`raiseConnector`, which *reparent* the display object into `overlayLayer`.

### 1.1 Symptom A — group frames swallow the graph

A group frame is a shape. `behindChildren` is honoured as a `zIndex` push-back
(`GraphLayer.ts:1438-1442`):

```ts
if (group && !group.collapsed && group.behindChildren !== false) {
  zIndex = (baseZ ?? 0) - 1;
}
```

That sorts the frame *within `shapeLayer`* — behind its own children, but still in front
of **every edge in the graph**, including edges that merely cross the region it occupies.
So `behindChildren` only half-delivers what it promises: a frame is a **backdrop** being
painted in the **node** band.

Measured on `Usecases/InvanaArchitecture` (eleven pastel stage frames, fifteen labelled
edges), with the story's workaround removed:

| Edge label | Result |
|---|---|
| `4 · simulate` | gone — edge lives inside the Simulation frame |
| `shapes` | gone — inside the Context frame |
| `ranked strategies` | gone |
| `5 · approved action` | gone |
| `recall past episodes` | clipped mid-word at the Decision frame's left edge |
| `3 · grounded context` | bisected by the Observe frame's top edge |

The story compensates in `onReady` by walking every edge with a resolved `labelText`,
calling `renderer.raiseConnector(id, 1)`, and re-asserting on `shape:pointerout` /
`connector:pointerout` because `HoverActivateBehaviour` resets the z of anything it
touched. That workaround is what this design deletes — and it is itself imperfect, since
`raiseConnector` lifts path *and* label together, leaving arrows floating over the frames.

Prior art agrees: group/parent nodes render below edges in yFiles (the background group of
`GraphModelManager`) and in G6 combos, for exactly this reason.

### 1.2 Symptom B — hovering one node restyles the whole graph

`HoverActivateBehaviour.applyInactive` (`:797-814`):

```ts
for (const node of layer.store.nodes()) { …setNodeState(node.id, inactive, true) }
for (const edge of layer.store.edges()) { …setEdgeState(edge.id, inactive, true) }
```

Every element is dirtied → `resolveNodeStyle` merge → spec rebuild → `shape.draw()`
Graphics rebuild on flush. On the 5k-node / 28.6k-edge graph from
[`large-graph-performance-plan.md`](./large-graph-performance-plan.md), **hovering one
node restyles and redraws ~34k elements — then does it all again on pointer-out.**
`ClickSelectBehaviour.applyUnselected` (`:682+`) carries the identical full-store walk.

Both symptoms are the same design gap: **paint order and visual emphasis are being
expressed by rewriting per-element state, because the renderer offers no other vocabulary.**

---

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| **D1** | The concept is named **`plane`** | `band` (the first draft's word) is already the *third* meaning of that token in this repo — 134 uses across contour bands, ring bands, LOD zoom bands, **and 12 inside `PrimitivesRenderer` itself** ("zIndex band" for `OVERLAY_SHAPE_Z`). `slot` (429 uses) is decoration slots; `tier` (77) is LOD. `plane` has **0** uses, is geometric (satisfies the Domain-Free Primitives Rule), and pairs with the existing `zIndex`: **`plane` picks the stripe, `zIndex` orders within it.** `zLayer` was carried for one revision to keep the word "layer", then dropped — having "layer" mean two things made every `layerId` ambiguous, and renaming the *engine* `Layer` instead would cost 12 exported classes / 72 files / ~1,490 occurrences and break published APIs. |
| **D2** ⚠️ **revised** | **Two independent fast paths, not one classifier** | *Superseded by D6 — see §4.4.* The original D2 routed `opacity`/`tint`-only state overlays to container membership. D6 makes that both unnecessary and wrong: an emphasis container carries **one** alpha, so `{opacity: 0.5}` on one node and `{opacity: 0.3}` on another could never both be containers. Replaced by: **(a)** per-element `alpha`/`tint` written straight to the gfx (no rebuild, arbitrary values), **(b)** `setFocus` for the binary complement (§4.4). They multiply naturally — `localAlpha × parent.groupAlpha`. |
| **D3** | Both axes ship **together** | planes alone fix Symptom A; emphasis alone fixes Symptom B. They are designed against each other (see §3), so splitting them means designing the seam twice. |
| **D4** | planes are owned **per `Layer`** | Every `WorldLayer` / `ScreenLayer` already creates its own container (`WorldLayer.ts:103`, `ScreenLayer.ts:59`) and hands it to `PrimitivesRenderer` (`GraphLayer.ts:327-328`). Keep that scoping — canvas-global stripes would let one layer's nodes paint over another's and break layer ordering, isolation and visibility. |
| **D5** | Pixi's `RenderLayer` is **never re-exported** | It stays an implementation detail inside `packages/canvas`, per the existing "PixiJS is internal" rule. Our vocabulary is `plane`, not `RenderLayer`. |
| **D6** | **First-class focus set** — `setFocus(ids)` / `clearFocus()` | The complement is expressed as *"focus = these ids"*, not *"these 34,000 are dimmed"*. Genuinely O(\|active\|): one store write, one alpha write, ~20 container moves. Costs a new interaction-state field and migrating the five behaviours that write `dimmed`. **Eliminates Symptom B rather than reducing it.** |
| **D7** | **LOD is in scope** | Phase 1 verifies the 🔬 stripe-detach trick (§4.1.2); if it holds, the zoom-threshold LOD behaviours migrate onto O(1) plane toggles. Selective LOD (`LabelCollisionBehaviour`) stays per-element regardless. |
| **D8** | **`toSVG` does *not* reflect emphasis** | An export is the **styled source of truth**, reproducible regardless of what happened to be hovered. Retires risk 8 as a deliberate choice rather than an oversight. `toSVG` still needs the `pickZ` sort fix (§5.2.5). |
| **D9** | Editor fields go in the **advanced section only** | `plane` / `opacity` / `tint` are power-user controls. Matches the precedent that `NodeStyle.zIndex` and `group.behindChildren` have **no** editor coverage today. No new "paint order" group. |

> **Why this matters.** `Layer` (`GraphLayer`, `WorldLayer`, `MiniMapLayer`, `canvas.layers`,
> `layerId`, `targetLayerId`) keeps exactly one meaning across the whole API. A plane is
> never called a layer, and a `Layer` is never called a plane.

---

## 3. The enabling primitive — Pixi 8.18.1 `RenderLayer`

We are on pixi **8.18.1**, which ships `RenderLayer`: render order decoupled from the
scene graph.

```js
container.addChild(gfx);   // logical parent — transform, colour, lifetime
plane.attach(gfx);        // render order only — does NOT reparent
```

This is the whole reason the design is small. Every hazard in the superseded
reparenting plan — decoration lifetime, restore-to-home-container, ownership on destroy —
existed because membership *was* reparenting. `attach()` isn't.

### 3.1 What was verified, and how

Two facts load-bearing enough to check in Pixi's source rather than trust:

**(a) Membership is flat and exclusive.** `Container.parentRenderLayer` is a single
reference, and `attach` steals it from the previous owner (`RenderLayer.mjs:86-91`):

```js
if (child.parentRenderLayer) {
  if (child.parentRenderLayer === this) continue;
  child.parentRenderLayer.detach(child);
}
```

`RenderLayer` itself declares `parentRenderLayer: null`. **planes do not nest** — depth
comes from having more stripes in a row, never stripes inside stripes.

**(b) Alpha and tint still inherit from the logical parent.**
`updateRenderGroupTransforms.mjs:91-99`:

```js
container.groupColor = multiplyColors(container.localColor, parent.groupColor);
container.groupAlpha = container.localAlpha * parent.groupAlpha;
```

That runs in the **scene-graph** update pass driven by the **logical parent**, and
`RenderLayer.collectRenderables` (`RenderLayer.mjs:190-205`) merely delegates to each
child's own `collectRenderables`, which emits the already-resolved `groupColorAlpha`.

⇒ **A child attached to a plane still inherits alpha and tint from its logical parent.**
This is what makes §4.2 possible.

### 3.2 Constraints inherited from Pixi

- **Filters do not cross the seam.** Pixi documents: *"Filters on ancestor containers do
  not apply to children attached to a RenderLayer"* — they're a push/pop texture capture,
  unlike alpha/tint which are baked into a resolved per-container value. **Muting must be
  alpha/tint, never a `ColorMatrixFilter`.** True desaturation would need a different
  mechanism entirely.
- **One `renderGroup`.** A `RenderLayer` and its children must belong to the same
  `renderGroup`. Unvalidated under our `pixi-viewport` camera — see §8.1.
- **`addChild` throws on a `RenderLayer`.** It holds no children; `attach` / `detach` /
  `detachAll` are the only vocabulary. So a decoration's `host.surface` must be an
  emphasis *container*, never a plane.
- **Flagged experimental** by Pixi. Pin the version; keep the seam narrow (§7).

### 3.3 The caveat that doesn't apply to us

Pixi's headline warning is *"hit testing does not account for the visual render order
created by layers."* That's the main reason people avoid this API — and it is a non-issue
here. The engine already bypasses Pixi picking entirely: `shape.gfx.eventMode = 'none'`
(`PrimitivesRenderer.ts:597`) with a global pointer router resolving against an rbush
index. We own hit resolution, so we can keep it consistent by construction (§4.3).

---

## 4. Design

Two **orthogonal** axes, each mapped to the Pixi mechanism that genuinely implements it:

| Axis | Question it answers | Mechanism | Cost to change |
|---|---|---|---|
| **`plane`** | which stripe do I paint in? | `RenderLayer.attach()` | O(1), no reparent |
| **`emphasis`** | am I muted or normal? | logical parent `Container` carrying `alpha` + `tint` | O(1) per element — or **one property write** for the entire complement |

Because the axes are independent, an element can be **muted *and* raised simultaneously**.
A single-container model cannot express that, and it is precisely the collision that made
the superseded plan awkward.

Scene graph, **inside each `Layer`'s own container** (D4):

```
layer.container
├── emphasisBase    Container   alpha 1 → 0.25 when a focus is active   ← colour
├── emphasisFocus   Container   alpha 1 always (the exception set)
├── RenderLayer  'backdrop'                                   ← planes (paint order)
├── RenderLayer  'background'
├── RenderLayer  'content'
├── RenderLayer  'foreground'
└── RenderLayer  'overlay'
```

Every element is `addChild`-ed into exactly one emphasis container **and** `attach`-ed to
exactly one plane. Two independent writes, neither aware of the other.

### 4.0 The two axes are different Pixi objects — don't conflate them

| | `plane` | `emphasis` |
|---|---|---|
| **Pixi type** | `RenderLayer` | plain `Container` |
| **Holds children?** | **no** — `addChild` *throws* | yes |
| **Has alpha / tint?** | **no** — it is ordering metadata, nothing else | yes, and it inherits to children |
| **How you join** | `attach()` — does **not** reparent | `addChild()` — *is* the reparent |
| **Count** | 5, named | 2 (`base`, `focus`) |
| **Answers** | *where do I paint?* | *what colour am I?* |

**Muting is not a plane operation.** A `RenderLayer` cannot tint anything — it has no
colour properties at all. Dimming happens on the emphasis `Container`, and the two axes
are set independently on the same element.

#### Stripe names are domain-free — and must stay that way

```ts
'backdrop' | 'background' | 'content' | 'foreground' | 'overlay'
```

**Not** `'edges'` / `'nodes'` / `'labels'`. `PlaneName` lives in
`packages/canvas/src/primitives/types.ts`, and the Domain-Free Primitives Rule
(`packages/canvas/CLAUDE.md:52-60`) explicitly forbids `node` and `edge` there: *"The
primitives layer only knows about geometric concepts."* The engine ships five ordered,
meaningless stripes; the **domain** assigns meaning:

| Stripe | `@invana/graph` puts here | A future `@invana/swimlane` would put |
|---|---|---|
| `backdrop` | expanded group frames | lane bodies |
| `background` | connectors (edges) | flow arrows |
| `content` | shapes (nodes) | tasks |
| `foreground` | labels | lane headers |
| `overlay` | raised: hovered / selected | same |

That mapping is a graph-package decision, not an engine one — which is exactly why the
engine must not name the stripes after it.

### 4.0.1 What routes where — the whole visual-state map

**planes are not a general mechanism for visual state.** They carry paint order and
nothing else. Four mechanisms exist and stay deliberately separate:

| Concept | What it actually means | Mechanism | Status |
|---|---|---|---|
| **hidden** | not rendered, not clickable | `spec.visible = false` — `hidden` flag bit in `GraphStore` (`:35`, `:107-108`) → `culled` → `visible: !culled` (`GraphLayer.ts:1372`, `:1475`); culls from draw **and** hit index (`PrimitivesRenderer.ts:585`) | **unchanged** |
| **hover — raise** | float above neighbours | **`plane` → `'overlay'`** | port from `raiseShape` |
| **hover — style** | thicker stroke, ring decoration (`hovered: { strokeWidth: 3 }`) | per-element **spec rebuild** | **unchanged** |
| **selected** | ring + glow decorations | spec rebuild **+** `plane` raise | style unchanged, raise ported |
| **highlighted** | ring decoration | spec rebuild | **unchanged** |
| **dimmed / inactive / mute** | uniformly dull everything else | **`emphasis` container** (alpha + tint) | **new fast path** |
| **disabled** | grey fill + alpha (`{ bgFill: 0x9ca3af, bgAlpha: 0.6 }`) | spec rebuild — `bgFill` *replaces* a colour, which a tint cannot express | **unchanged** |

The dividing line: **a tint multiplies, a fill replaces.** Only uniform multiplicative
dulling can move to a container. Anything that changes geometry, stroke, decorations, or
substitutes a colour stays a spec rebuild — which is correct, not a limitation.

**`hidden` must never become an emphasis or a plane.** Hidden means *absent* (culled from
picking too); muted means *present but dull*. Collapsing them would make hidden elements
clickable — the exact "invisible but clickable" bug
[`per-element-visibility-plan.md`](./per-element-visibility-plan.md) was written to kill.

#### Where the routing decision lives

Not in the behaviours, and not as named zIndexes in `GraphLayer`:

```
Behaviour        store.setNodeState(id, 'dimmed', true)      ← unchanged; kernel contract
   ↓
GraphLayer       state compiler classifies the overlay       ← the ONLY new decision point
   ↓                    ├─ opacity/tint only ─▶ renderer.setEmphasis()
   ↓                    └─ anything else ─────▶ spec rebuild + draw
Renderer         setPlane() · setEmphasis() · addShape/updateShape
```

State still lives in the store as `node.states = ['dimmed']`. Only the **projection
strategy** changes. Behaviours that merely set states (`ContextMenuBehaviour`,
`LassoSelectBehaviour`, `BrushSelectBehaviour` — §5.1) need no changes at all and inherit
the fast path for free.

### 4.1 Axis 1 — `plane`

```ts
/** Ordered paint stripes. Earlier entries paint below later ones. */
export type PlaneName =
  | 'backdrop' | 'background' | 'content' | 'foreground' | 'overlay';

// BaseShapeSpec / BaseConnectorSpec
/**
 * Which paint stripe this element renders into. Elements in an earlier stripe
 * always paint below elements in a later one, regardless of `zIndex` — `zIndex`
 * orders *within* a stripe.
 *
 * Defaults: shapes → `'content'`, connectors → `'background'`.
 *
 * Visual only. Picking stays consistent because the hit index is keyed on a
 * composite of stripe order and `zIndex` (see `pickZ`).
 */
readonly plane?: PlaneName;
```

**Invariant:** every renderable is attached to exactly one plane. An unattached child
renders at its logical position instead — which is *below all stripes*, since the emphasis
containers come first in the scene graph. Enforce on add.

#### 4.1.1 Low-level API — moving elements between planes

The imperative seam, following the existing house style (`setShapeTextVisible`,
`setConnectorStroke`, `hasShape`, `cull`):

```ts
// ── per element ────────────────────────────────────────────────────────────
setShapePlane(id: string, plane: PlaneName, owner?: string): void;
setConnectorPlane(id: string, plane: PlaneName, owner?: string): void;

clearShapePlane(id: string, owner?: string): void;      // drop THIS owner's claim
clearConnectorPlane(id: string, owner?: string): void;

getShapePlane(id: string): PlaneName;                  // EFFECTIVE, not declared
getConnectorPlane(id: string): PlaneName;

// ── bulk — one attach pass + one sort, not N ───────────────────────────────
setShapesPlane(ids: Iterable<string>, plane: PlaneName, owner?: string): void;
setConnectorsPlane(ids: Iterable<string>, plane: PlaneName, owner?: string): void;

// ── release everything one owner claimed, no per-id bookkeeping ────────────
clearPlaneClaims(owner: string): void;
```

**Declared home vs transient claim.** These do *not* mutate the spec:

```
effective plane = highest-ordinal live claim  ??  spec.plane  ??  kind default
                   ('overlay' beats 'backdrop')     declarative     shape→'content'
                                                                    connector→'background'
```

`spec.plane` stays the **declared home** — the serialisable, store-owned truth. A claim is
a **transient override** keyed by `owner`, so a spec update never wipes a live hover raise,
and a hover release never wipes a selection raise. That is the same owner-keyed registry
that fixes the `resetRaise` clobber (§5.2.4) — one mechanism, two problems.

Ties resolve by **plane ordinal, not by claim order**: if hover claims `'overlay'` and
something else claims `'backdrop'`, the topmost wins. Predictable regardless of call
sequence.

`raiseShape` / `raiseConnector` survive as thin deprecated wrappers —
`raiseShape(id, z !== 0 ? 'overlay' : clear)` — preserving the `OVERLAY_SHAPE_Z` /
`OVERLAY_CONNECTOR_Z` relationship *within* the `overlay` stripe so a raised node still
sorts above a raised edge.

**Why bulk variants earn their place:** `RenderLayer.attach` is O(1), but a
`sortableChildren` stripe re-sorts on render. Attaching N elements one at a time through
the per-element call is correct but re-dirties the sort N times; the bulk form attaches all
then sorts once. `ClickSelectBehaviour` raising a 500-node selection is the motivating
case.

#### 4.1.2 planes and LOD — what stripes do and don't buy

**planes do not nest.** Verified in §3.1a: `parentRenderLayer` is a single reference,
`attach` steals membership from the previous owner, and `RenderLayer` declares
`parentRenderLayer: null`. There is no "nodes / edges / labels as child stripes of a parent
stripe". Depth comes from **more flat stripes in a row**, never stripes inside stripes —
and the flat list is trivially extensible if five is not enough.

That is not a loss, because the flat stripes already *are* the split:
`background` = connectors, `content` = shapes, `foreground` = labels. Siblings, not
children.

**Labels can join `foreground` without breaking their positioning** — and this is only
possible because `attach()` doesn't reparent. A label decoration stays a transform-child of
its host's `gfx` (`PrimitivesRenderer.ts:1197`, `:1220`), so it keeps following the node it
belongs to, while painting in a different stripe. Reparenting could never do this: the
label would need absolute world coordinates re-synced on every host move.

##### Toggling a whole stripe — `.visible` does *not* work

From `collectRenderablesMixin.mjs`:

```js
if (this.parentRenderLayer && this.parentRenderLayer !== currentLayer
    || this.globalDisplayStatus < 7 || !this.includeInBuild) return;
```

- Clause 1 **is** the attach mechanism — a child attached to a stripe is skipped by its
  logical parent's traversal, and renders only when its own stripe collects it.
- `globalDisplayStatus` is inherited from the **logical parent** (`= localDisplayStatus &
  parent.globalDisplayStatus`), *not* from the stripe.
- `RenderLayer.collectRenderables` **overrides** this mixin and carries **no**
  display-status guard on itself (`RenderLayer.mjs:190-205`).

⇒ **`stripe.visible = false` does nothing.** Visibility flows through the logical parent
chain only.

##### The O(1) route that *does* exist — 🔬 phase-1 gate (D7)

Detach the stripe from the scene graph. Its children are skipped by their logical parent
(clause 1) *and* their stripe is never traversed, so they render nowhere:

```ts
layer.container.removeChild(planes.foreground);   // every label off, O(1)
layer.container.addChildAt(planes.foreground, i); // back on, order restored
```

Derived from source reading, **not yet run**. The re-add must restore the stripe's original
index or paint order silently changes. Verify alongside the `renderGroup` spike.

**Per D7 this is a gate, not a curiosity:** if it holds, the zoom-threshold LOD behaviours
(`TextLODBehaviour`, `IconLODBehaviour`, `ContentLODBehaviour`, `EdgeLODBehaviour`) migrate
from O(n) per-element flag loops onto O(1) plane toggles. If it does not hold, LOD drops
out of scope and those behaviours stay exactly as they are — they are already repaint-free,
so nothing regresses.

##### Honest expectation: LOD has far less headroom than mute

The LOD behaviours already avoid redrawing. `setShapeTextVisible` / `setShapeIconVisible`
are documented *"Pure `.visible` flip — no repaint"*, and the behaviours iterate the store
flipping booleans (`TextLODBehaviour:89`, `ContentLODBehaviour:208`,
`EdgeLODBehaviour:234,242`). That is O(n) **cheap flag writes**.

Contrast with hover-mute, which rebuilds a spec and re-runs `shape.draw()` per element.
That is where the ~100× sits. **So stripes make LOD tidier — and only dramatically faster if the detach gate passes:**

| | Today | With stripes |
|---|---|---|
| **Win** | walk the store, ask each element what kind it is | iterate one ready-made list of exactly the right elements |
| **Cost** | O(n) `.visible` flips, no repaint | same — unless the detach trick above holds, then O(1) |

Selective LOD stays per-element regardless: `LabelCollisionBehaviour` hides *some* labels by
collision and priority, which no stripe-level switch can express. Same
uniform-vs-selective line as emphasis (§4.0.1).

#### 4.1.3 `plane` vs `zIndex` — the dividing line, and what migrates

Adding `plane` does **not** deprecate `zIndex`. They are the coarse and fine halves of one
ordering:

> **`plane` picks the stripe (5, fixed, coarse). `zIndex` orders within it (per element,
> fine).** Planes deliberately provide no within-stripe ordering, so removing `zIndex`
> would leave a hole.

##### Four unrelated things are called "zIndex" today

A census of all 166 uses (`packages/*/src`, TS/TSX). Most have nothing to do with this
plan:

| Category | Where | Relationship to planes |
|---|---|---|
| **CSS z-index on DOM chrome** | `GraphContextMenuBase.tsx`, `HoverElementPreviewBehaviour.tsx`, `DevInfoLayer.tsx` (canvas-ui / canvas-react) | none — HTML overlays |
| **`Layer.zIndex`** — orders `Layer`s in the canvas | `Layer.ts:46,105,151`, `WorldLayer`, `ScreenLayer`, `LayersPanelLayer`, `MapLayer` | **orthogonal axis** — untouched |
| **`zOrderCache`** | `LayerRegistry.ts:41-128` | a **cache of the row above** (`canvas.layers.byZOrder()`, walked by `exportSVG`) — not a z-concept of its own; untouched |
| **`spec.zIndex`** — orders primitives | `PrimitivesRenderer` (36), `HitIndex` (14), `GraphLayer` (9) | **the only category planes interact with** |

##### Two current `zIndex` uses are planes in disguise

The tell is a **magic number**:

1. **Group-frame push-back** — `zIndex = (baseZ ?? 0) - 1` (`GraphLayer.ts:1438-1442`).
   A ±1 meaning *"behind that entire category"* is a plane's job. **Partially migrates:**
   `plane: 'backdrop'` takes the coarse role; the depth-aware push-back survives *inside*
   the backdrop plane to order nested frames (§4.5).

2. **`OVERLAY_SHAPE_Z = 1_000_000` / `OVERLAY_CONNECTOR_Z = 0`**
   (`PrimitivesRenderer.ts:356-362`) — literally **stripes hand-rolled as `zIndex` bands**
   inside `overlayLayer`. The million-stride is the giveaway: a separator, not an ordering.
   It is the same construction as `pickZ` (§4.3) — one is a degenerate hand-rolled case of
   the other.

   **Recommendation: keep it, reframed.** "Raised shapes above raised connectors" genuinely
   *is* within-stripe ordering, and planes do not nest (§3.1a), so a sub-stripe is not
   available. Retain the two constants as `zIndex` bands **inside the `overlay` plane**,
   document them as such rather than as pseudo-stripes, and share **one** stride constant
   with `pickZ` instead of maintaining two.

##### The litmus test — write this into the TSDoc

> If the number is a **large magic stride**, or a **±1 meaning "behind that whole
> category"** — it wanted to be a `plane`.
> If it is genuine **fine-grained per-element ordering** — badge stacking
> (`GraphLayer.ts:2609,2684`), nested frame depth — it is `zIndex`.

Without this stated, the next person needing "draw X under Y" reaches for another magic
`zIndex` offset and re-creates the problem this plan exists to remove.

#### 4.1.4 Symmetric emphasis API

```ts
setShapeEmphasis(id: string, emphasis: 'base' | 'focus'): void;
setConnectorEmphasis(id: string, emphasis: 'base' | 'focus'): void;
setShapesEmphasis(ids: Iterable<string>, emphasis: 'base' | 'focus'): void;
setConnectorsEmphasis(ids: Iterable<string>, emphasis: 'base' | 'focus'): void;

configureEmphasis(recipe: { alpha?: number; tint?: number }): void;  // the dim recipe
setEmphasisActive(active: boolean): void;   // the ONE write that dims/undims the base
clearEmphasis(): void;                      // everything back to base, recipe reset
```

`setEmphasisActive(true)` is the single property write on `emphasisBase` described in §4.2 —
separated from the per-element moves so the caller controls the order (dim the base *after*
lifting the focus set, or the focus flickers).

### 4.2 Axis 2 — `emphasis`

#### 4.2.0 What an emphasis container *is*, from first principles

It is not a new engine concept. It is a plain Pixi `Container` used as a **colour-inheritance
group**, renting propagation the scene graph already does (§3.1b):

```js
container.groupAlpha = container.localAlpha * parent.groupAlpha;
container.groupColor = multiplyColors(container.localColor, parent.groupColor);
```

Alpha and tint **multiply down the logical parent chain**. So:

> Put 34,000 objects under one `Container`, set that container's `alpha = 0.25`, and all
> 34,000 render at 25% — from **one property write**. No per-element loop, no spec rebuild,
> no `draw()`.

That is the whole idea. An emphasis container is a handle for "dim this entire set at once".

**Why two containers, and why *this* direction:**

```
emphasisBase    every element's default home.   ← its alpha is what changes
emphasisFocus   the small exception set.        ← always full strength
```

The muted set is the *large* one, so you never move it. You dim the base and lift the few
active elements out. Moving the muted set instead would be the O(|V|+|E|) walk this design
exists to delete (§4.2).

**Why a plane can't do this:** a `RenderLayer` has no `alpha`, no `tint`, and holds no
children (`addChild` throws). It is ordering metadata. The two axes need two different Pixi
objects — that is the point of §4.0.

**What emphasis deliberately cannot do:** express *per-element* values. One container = one
alpha. `{opacity: 0.5}` here and `{opacity: 0.3}` there is fast path 1's job
(`setShapeAlpha` / `setShapeTint`, §4.4). Group dimming and per-element alpha multiply
cleanly, so both can apply to the same element at once.

Two containers per renderer. **The direction matters, and it is counter-intuitive:**

```ts
emphasisBase    // the DEFAULT home for every element. Its alpha/tint is what moves.
emphasisFocus   // the EXCEPTION container. Always full strength. Holds the small active set.
```

> ⚠️ **Do not name these `normal` / `muted`.** If every element's default home is a
> "normal" container and muting means moving elements into a "muted" one, then dimming the
> complement moves **34,000 elements** — reproducing exactly the O(|V|+|E|) walk this
> design exists to remove. The win only exists when the *base* dims and a *small
> exception set* is lifted out of it.

Focus on:  `emphasisBase.alpha = 0.25` (**one property write**, dims everything) + move the
~20 active elements into `emphasisFocus`.
Focus off: `emphasisBase.alpha = 1` + move them back.

**O(|active|) in both directions**, regardless of graph size.

```ts
renderer.configureEmphasis({ alpha: 0.25, tint: 0x94a3b8 });   // the dim recipe, once
renderer.setEmphasis(id, 'focus' | 'base');                    // per-element primitive
```

`setEmphasis` *is* a reparent — and that's fine, because the logical parent is exactly
what carries colour (§3.1b). Decorations follow their host for free: they mount into
`host.gfx` (`PrimitivesRenderer.ts:1197`, `:1220`), which is the object being moved.

### 4.3 Keeping picking honest

Picking consults the spec `zIndex` recorded at insert
(`hit.insert(id, 'shape', bounds, spec.zIndex ?? 0)`, `:585`), independent of the display
tree. With an author-settable `plane` that diverges — a hittable backdrop element at
`zIndex: 0` would paint under every edge yet still tie with normal nodes for the click.

Derive both orders from one key:

```ts
const PLANE_STRIDE = 1_000_000;
const PLANE_ORDER: Record<PlaneName, number> =
  { backdrop: -2, background: -1, content: 0, foreground: 1, overlay: 2 };

const pickZ = PLANE_ORDER[spec.plane ?? dflt] * PLANE_STRIDE + (spec.zIndex ?? 0);
```

Insert `pickZ`; re-insert whenever `plane` changes. "What you see is what you click"
becomes true by construction rather than by convention.

### 4.4 Focus sets and the two fast paths (D6, revising D2)

D6 replaces the state-classifier idea with two mechanisms that do different jobs. They are
not alternatives — a real graph uses both, and they multiply correctly
(`localAlpha × parent.groupAlpha`, §3.1b).

#### Fast path 1 — per-element `alpha` / `tint`, no rebuild

`updateShape` **always** rebuilds geometry today:

```ts
// PrimitivesRenderer.ts — updateShape
inst.spec = { ...inst.spec, ...partial };
inst.shape.draw(inst.spec);          // ← Graphics.clear() + full retrace, every time
```

So changing nothing but an alpha currently costs a full retrace. The precedent for the fix
is already in the file — `scaleShape`, documented as *"writes the gfx transform directly
without touching the spec or rebuilding geometry"*, because `updateShape` *"dominates the
cost when something like `NodeScaleLODBehaviour` rewrites thousands of node sizes"*.

Add the same shape of fast path for colour:

```ts
setShapeAlpha(id, alpha): void;        // gfx.alpha — no draw()
setShapeTint(id, tint): void;          // gfx.tint  — no draw()
setConnectorAlpha(id, alpha): void;
setConnectorTint(id, tint): void;
```

Any state overlay carrying `opacity` / `tint` routes those two fields here; every other
field goes through `updateShape` as today. **This is a spec-diff optimisation, not a
semantic classifier** — no "is this state emphasis-shaped?" question, and it handles
**arbitrary per-element values**, which containers never could.

#### Fast path 2 — `setFocus`, the O(1) complement

```ts
layer.setFocus(activeIds: Iterable<string>): void;
layer.clearFocus(): void;
```

Renderer-side, per focus change:

```
emphasisBase.alpha = 0.25                    // 1 write — dims everything
setShapesEmphasis(activeIds, 'focus')        // ~20 container moves
```

`focusedIds` is **interaction state** and lives in the store beside selection and hover
(`view.interaction`, per [`canvas-state-plan.md`](./canvas-state-plan.md)) — so the kernel
contract holds and the renderer stays a projection.

#### Why the original D2 could not work

An emphasis container carries **one** alpha. `{opacity: 0.5}` on one node and
`{opacity: 0.3}` on another cannot both be container membership. The classifier would have
had to silently pick a winner or fall back per element. Fast path 1 has no such limit.

#### Canonical states after D6

`dimmed` stops being how hover expresses the complement — `setFocus` does. The catalogue
entry stays for **manual** use (an author marking specific elements dim), and changes to
the element-wide field so it means what it says:

```ts
DEFAULT_NODE_STATES.dimmed:  { bgAlpha: 0.25 }     →  { opacity: 0.25 }
DEFAULT_EDGE_STATES.dimmed:  { strokeAlpha: 0.2 }  →  { opacity: 0.2 }
// `disabled` keeps bgFill / strokeColor ⇒ correctly stays on the spec path.
```

Still a deliberate visual change: today a dimmed node keeps a fully-opaque label and icon
because only the background fill dims; under `opacity` the whole element dims. Reviewed,
not discovered (risk 2).

#### Behaviour migration (five writers)

| Behaviour | `setNodeState`/`setEdgeState` calls | Change |
|---|---|---|
| `HoverActivateBehaviour` | 22 | `applyInactive` → `setFocus`; `applyRaise`/`resetRaise` → plane claims |
| `ClickSelectBehaviour` | 8 | `applyUnselected` → `setFocus`; raise → plane claims |
| `ContextMenuBehaviour` | 4 | none — keeps writing states |
| `LassoSelectBehaviour` | 2 | none |
| `BrushSelectBehaviour` | 2 | none |

Only the two that dim the complement change. The other three keep writing per-element
states and pick up fast path 1 for free.

### 4.5 Graph-level API

```ts
// NodeStyle / EdgeStyle
readonly plane?: PlaneName;
readonly opacity?: number;   // element-wide; drives the emphasis fast path
readonly tint?: number;      // element-wide multiply

// Expanded behindChildren frames default to 'backdrop'; explicit always wins.
// `plane: 'content'` on a frame is how you ask a group to occlude crossing edges —
// which is why no separate `behindEdges` flag is needed.
```

`nodeSpec` (`GraphLayer.ts:1433-1442`) becomes:

```ts
const isBackdropFrame = group && !group.collapsed && group.behindChildren !== false;
const plane = style.plane ?? (isBackdropFrame ? 'backdrop' : 'content');

// Retained push-back: orders nested frames inside the stripe, and keeps
// frame-vs-child pick resolution bit-for-bit unchanged.
if (plane === 'backdrop' && isBackdropFrame) {
  zIndex = (baseZ ?? 0) - 1 - this.depthOf(node.id);   // depthOf already exists (:2365)
}
```

Three details:

- **Nesting** — `depthOf` (already used for group auto-fit ordering) puts outer frames
  below inner ones inside the stripe. No new traversal.
- **Collapsed groups** fall through to `'content'`. A collapsed group is an interactive node
  again and *should* occlude edges like any node. The existing `!group.collapsed` guard
  already draws that line; collapse ⇄ expand becomes a re-`attach`.
- **Emit `plane` unconditionally**, like `alpha` / `visible` / `fill` already are
  (`:1456-1476`). The renderer partial-merges patches onto the cached spec, so omitting it
  on the "now nodes" pass after expand → collapse would leave a stale `'backdrop'` and the
  frame would stay under the edges.

### 4.6 Cross-layer targeting

> **Speculative — no work in this plan.** Recorded because the capability falls out of the
> design, not because anything needs it. Per §5.1, no `graph-layer-*` package uses
> `PrimitivesRenderer` today, so nothing is blocked on it.

`attach()` not reparenting unlocks something per-layer stripes never could: a layer could
place its graphics into **another** layer's stripe while keeping its own container for
lifetime and visibility — i.e. "bubble-sets paint above the graph's edges but below its
nodes", which per-layer scoping (D4) genuinely cannot express since a whole layer sits
entirely above or below another.

If it is ever built, gate it behind the existing convention (root rule 8 — explicit
cross-layer wiring), never ambiently:

```ts
new BubbleSetsLayer({ targetLayerId: 'graph', targetPlane: 'backdrop' });
```

---

## 5. Architecture — before / after

### 5.0.1 Today

```
Canvas
└── viewport  (pixi-viewport, camera)
    ├── BackgroundLayer.container         ScreenLayer, own Graphics
    ├── GraphLayer.container ─────────────┐  the ONLY owner of a PrimitivesRenderer
    │   └── PrimitivesRenderer            │
    │       ├── connectorLayer  Container │  hard 3-stripe order, `_container`
    │       ├── shapeLayer      Container │  NOT sortable → connectors always
    │       └── overlayLayer    Container │  under shapes; escape = reparent
    ├── BubbleSetsLayer.container            own Graphics — no renderer
    └── MiniMapLayer.container               own Graphics — no renderer
```

Visual state reaches the screen **one way only**: `store.setNodeState` → dirty →
`resolveNodeStyle` → spec rebuild → `shape.draw()`. Paint order reaches the screen one way
only: reparent into `overlayLayer`.

### 5.0.2 After

```
Canvas
└── viewport
    ├── BackgroundLayer.container                     unchanged
    ├── GraphLayer.container ─────────────────────┐
    │   └── PrimitivesRenderer                    │
    │       ├── emphasisBase    Container         │  ← logical parents: colour
    │       ├── emphasisFocus   Container         │    (alpha + tint, inherited)
    │       ├── RenderLayer 'backdrop'            │  ← planes: paint order
    │       ├── RenderLayer 'background'          │    (attach ≠ reparent)
    │       ├── RenderLayer 'content'             │
    │       ├── RenderLayer 'foreground'          │
    │       └── RenderLayer 'overlay'             │
    ├── BubbleSetsLayer.container                    unchanged
    └── MiniMapLayer.container                       unchanged
```

Each element now carries **two independent memberships**:

```
gfx ──addChild──▶ emphasisBase | emphasisFocus       (what colour am I?)
 └───attach─────▶ one of five RenderLayers            (where do I paint?)
```

…and visual state gains a second, cheap route to the screen:

```
                     ┌─ payload is only opacity/tint ─▶ setEmphasis()   O(1), no redraw
store.setNodeState ──┤
                     └─ anything else ───────────────▶ spec rebuild + draw   (today's path)
```

## 5.1 Impact — measured, not estimated

Every figure below is a grep over `packages/*/src`, not an estimate.

| Surface | Finding | Impact |
|---|---|---|
| **Owners of a `PrimitivesRenderer`** | **exactly one** — `GraphLayer.ts:327` | The whole container redesign is behind a single construction site. |
| **`raiseShape` / `raiseConnector` callers** | **8 call sites in 2 files** — `HoverActivateBehaviour` (`:649,651,686,694,714,715`), `ClickSelectBehaviour` (`:663,664,675,676`) | Small, well-understood port. Both files are being edited anyway for the fast path. |
| **Other renderer-mutation consumers** | `ElkLayout`, `DrawEdgeBehaviour`, `NodeScaleLODBehaviour`, `EdgeScaleLODBehaviour`, `GraphLayer` | All pass **specs**, never touch containers. `plane` is optional ⇒ source-compatible; no change needed. |
| **External code reaching into the display tree** | **none.** `LassoSelectBehaviour:160` / `BrushSelectBehaviour:201` create their *own* `Container` — unrelated to the renderer's internal `overlayLayer` despite the shared word | Renderer internals are sealed. No external breakage path. |
| **`MiniMapLayer`** | draws with its **own** `Graphics` (`:237-239`); owns no renderer, only *reads* `graph.getRenderer()` (`:448`) for routed polylines | **Structurally unaffected — it already flattens.** Emphasis simply won't appear in the minimap unless we choose to add it. A product call, not required work. |
| **`graph-layer-*` packages** (bubble-sets, d3-contour, maplibre) | **zero** uses of `PrimitivesRenderer` | Unaffected. §4.6 cross-layer targeting is therefore **speculative future capability**, not migration work — nothing needs it today. |
| **State writers** | 5 behaviours: Hover (22 calls), ClickSelect (8), ContextMenu (4), Lasso (2), Brush (2) | Only **Hover + ClickSelect** need the fast-path rewrite. The other three keep calling `setNodeState` and inherit routing from the compiler for free. |
| **SVG export** | `exportSVG` (`svgExport.ts:485-493`) delegates per-`Layer`; ordering lives in `PrimitivesRenderer.toSVG` (`:890-903`), which hardcodes *all connectors then all shapes* and **ignores `zIndex` entirely** | Already subtly wrong today (a raised connector exports below shapes). Becomes one sorted pass over `pickZ` — a small fix that also repairs an existing defect. |

**Files touched:** ~10 source files across 3 packages (`canvas`, `graph`, `canvas-ui`)
plus one story. The four largest are `PrimitivesRenderer.ts` (2,973 LOC),
`GraphLayer.ts` (2,888), `graph/layer/types.ts` (1,473), `primitives/types.ts` (1,394) —
edits are localised (container construction, add/update paths, `nodeSpec`), not rewrites.

**Backwards compatibility:** `plane`, `opacity` and `tint` are all **optional** additions.
Existing specs, stories and consumer code compile unchanged. The only intentional
behavioural changes are the three in §8 (risks 2, 3, 5).

## 5.1.1 Which layers get planes — and why most get none

**Planes and emphasis containers belong to `PrimitivesRenderer`, not to `Layer`.** A layer
only has them if it owns a renderer — and exactly one does. Every other layer draws its own
pixi objects or HTML, and is untouched by this plan:

| Layer | Draws via | Planes / emphasis? |
|---|---|---|
| `GraphLayer` | **`PrimitivesRenderer`** (`:327`) — the only owner | **5 planes + 2 emphasis containers** |
| `MiniMapLayer` | its own 3 `Graphics` (`:237-239`); only *reads* the graph's renderer (`:448`) for routed polylines | none |
| `BackgroundLayer` | its own `Graphics` | none |
| `DevInfoLayer` | **HTML DOM overlay** — `document.createElement('div')` (`:189`), `innerHTML` (`:363`) | none — not a pixi surface at all |
| `LayersPanelLayer` | **HTML DOM overlay** (`:180`, `:271`, `:313`) | none |
| `BubbleSetsLayer` | its own `Graphics` (`:380`) | none |
| `graph-layer-d3-contour`, `graph-layer-maplibre` | own drawing | none |

So the answer to *"does the minimap need background / foreground planes?"* is that the
minimap has **no planes at all** — it never touches `PrimitivesRenderer`. Nothing about it
changes.

### Fixed set of five, always constructed

If a future layer adopts `PrimitivesRenderer` and needs only one stripe, it still gets all
five. That is deliberate:

- **Cost is nil.** An unused plane is one empty `RenderLayer` whose `collectRenderables`
  iterates zero children.
- **`PlaneName` stays a closed union** — exhaustive switches, no registry, no runtime
  order state. This is the same reasoning that rejected a configurable band registry
  earlier in the design.
- **Uniformity beats tailoring.** Per-renderer plane sets would make paint order depend on
  which layer you are looking at, which is exactly the confusion planes exist to remove.

Same for the two emphasis containers: a renderer that never dims still constructs both, and
they cost two empty `Container`s.

## 5.2 Implementation

### 5.2.1 `@invana/canvas` — planes

- `primitives/types.ts` — `PlaneName`; `plane?` on `BaseShapeSpec` +
  `BaseConnectorSpec`; `opacity` / `tint` pass-through.
- `PrimitivesRenderer.ts`
  - Replace the three containers (`:414-435`) with five `RenderLayer`s + two emphasis
    containers. `sortableChildren: true` per stripe so `zIndex` still orders within it.
  - `addShape` (`:573-581`) / `addConnector` (`:935-939`) —
    `emphasisNormal.addChild(gfx)`, then `planes[spec.plane ?? dflt].attach(gfx)`.
    `host.surface` must be the **emphasis container** (a `RenderLayer` throws on
    `addChild`).
  - `updateShape` / `updateConnector` — re-`attach` when a patch changes `plane`.
  - The low-level API of §4.1.1 — per-element, bulk, and `clearPlaneClaims(owner)` —
    plus the claim map (`Map<id, Map<owner, PlaneName>>`) that backs it.
  - `raiseShape` (`:779-790`) / `raiseConnector` (`:800-811`) — reimplement as deprecated
    wrappers over `setShapePlane` / `clearShapePlane`; restore reads the declared home
    from `inst.spec`, never a hardcoded container.
  - `removeShape` (`:905`) needs no change — it destroys via `inst.shape.destroy()`, and
    Pixi auto-detaches on removal from the logical parent.

### 5.2.2 `@invana/canvas` — emphasis

`emphasisNormal` / `emphasisMuted` containers, `configureEmphasis`, `setEmphasis`. Both go
on the renderer **interface**, not the pixi class (§7).

### 5.2.3 `@invana/graph`

- `layer/types.ts` — `NodeStyle` / `EdgeStyle` `plane` + `opacity` + `tint`; canonical
  `dimmed` payloads (§4.4); update the group-semantics TSDoc (`:760-790`) to name the
  stripe and state the explicit-wins precedence.
- `layer/GraphLayer.ts` — `nodeSpec` per §4.5; `edgeSpec` (`:1489+`) defaults to `'background'`;
  the state compiler, classifying each catalogue entry once per change.

### 5.2.4 `@invana/graph` — behaviours

- `HoverActivateBehaviour.applyInactive` (`:797-814`) and
  `ClickSelectBehaviour.applyUnselected` (`:682+`) — emphasis writes instead of full-store
  walks.

> **The compiler alone does not reach O(1) — be honest about this.** If these behaviours
> keep writing a per-element `dimmed` state, they still walk every node and edge to
> *write* it: 34k `setNodeState` calls + 34k dirty marks. The compiler removes the
> **spec rebuild + Graphics redraw** behind each one (the expensive part, easily 100×),
> but the walk itself remains O(|V|+|E|).
>
> True O(1) needs the behaviour to express **"focus = these ids"** instead of
> **"these 34,000 are dimmed"** — a set-complement concept, matching how `emphasisBase` /
> `emphasisFocus` actually work:
>
> ```ts
> layer.setFocus(activeIds);   // one write: base dims, the active set is lifted out
> layer.clearFocus();
> ```
>
> The focus set is interaction state and belongs in the store next to selection / hover
> (`view.interaction`, per `canvas-state-plan.md`), so the kernel contract still holds.
> **Decision required** — see open question 6. Shipping the compiler without it is a valid
> intermediate: correct, much faster, not yet constant-time.
- `applyRaise` / `resetRaise` in both (`Hover :631-696, :708-718`;
  `Click :653-667, :669-679`) — port to `setPlane`.
- **Fold in the pre-existing clobber bug.** Both `resetRaise`s write an absolute reset with
  no knowledge of other claimants, so hovering a *selected* node and moving away drops it
  out of the overlay while it is still selected. Replace with an owner-keyed claim
  registry: `raise(id, z, owner)` / `release(id, owner)`, effective z = max of live claims.
  Worth folding in because these exact lines are being rewritten anyway.

### 5.2.5 Integration surfaces

| File | Change |
|---|---|
| `canvas/src/primitives/PrimitivesRenderer.ts` `toSVG` (`:890-903`) | replace the connectors-then-shapes loop pair with one pass sorted by `pickZ`; also fixes the existing raised-connector export defect. **Per D8, emphasis is deliberately NOT applied** — an export is the styled source of truth, not a screenshot |
| `canvas/src/export/stateExport.ts` | confirm new fields round-trip (plain optional scalars — expected free) |
| `canvas-ui/src/editor-panels/node-style/**/{fields,mapping}.ts` | `plane` select + `opacity` / `tint` controls, **advanced section only** (D9) |
| `apps/storybook/stories/usecases/InvanaArchitecture.stories.tsx` | delete the `onReady` raise block (`:684-707`) + the now-unused `graph` / `renderer` locals; trim the doc-comment paragraph |

**Not touched, per §5.1:** `MiniMapLayer` (own `Graphics`, already flat) and every
`graph-layer-*` package (no renderer). `svgExport.ts` itself needs no change — the
ordering it delegates to lives in the renderer.

**On the editor field:** root rule 12's obligation is per Behaviour / Layer / Layout, and
this adds none. But `plane` / `opacity` / `tint` are public styling, so they belong in the
node-style editor. Note the precedent — `NodeStyle.zIndex` and `group.behindChildren` have
**no** editor coverage today, so `plane` is the first paint-order control in the kit. A
combined "paint order" group covering all three is a reasonable follow-up, out of scope
here.

---

## 6. Phasing

1. **Container swap** — five planes + two emphasis containers; `addShape` / `addConnector`
   wired. Doubles as the §8.1 spike: if the `renderGroup` constraint bites under
   `pixi-viewport`, the first screenshot shows it immediately.
2. **`setPlane` + raise port + `pickZ`.**
3. **`setEmphasis` + `configureEmphasis`.**
4. **Graph wiring** — style fields, `nodeSpec` / `edgeSpec`, state compiler.
5. **Behaviour fast paths** — `setFocus` / `clearFocus` + the `focusedIds` interaction-state
   field; migrate `HoverActivateBehaviour` and `ClickSelectBehaviour`; claim registry.
6. **LOD migration** — *only if the phase-1 detach gate passed* (D7).
7. **Integration surfaces** + story cleanup.
8. **Verification sweep** (§9).

---

## 6.1 What does *not* get a base class

There is no `BaseRenderLayer` in this repo — the `*Base` classes are `PrimitiveBase`,
`ShapeBase`, `ConnectorBase`, `ShapeDecorationBase`, `ConnectorDecorationBase`,
`EffectBase`, `ConnectorEffectBase`. This plan does not add one. Two things it might be
confused with, and what happens to each:

**Pixi's `RenderLayer` — instantiated, never subclassed.** The renderer holds
`planes: Record<PlaneName, RenderLayer>` and calls `attach` / `detach`. No wrapper class,
no `PlaneBase`. A subclass would only be justified if planes needed behaviour of their own;
they need none — the claim registry (§4.1.1) lives on the renderer, where it can see all
five at once. And per D5 the type never leaves `packages/canvas`.

**The `Layer` base class — unchanged.** `Layer` / `WorldLayer` / `ScreenLayer` gain nothing:
no `plane` field, no plane-aware lifecycle. Planes are a property of the *renderer* a layer
may own, not of layers themselves (§5.1.1). A layer that draws its own `Graphics` or HTML
neither knows nor cares that planes exist.

The one thing that *would* push plane awareness up into `Layer` is cross-layer targeting
(§4.6) — a layer placing its graphics into another layer's plane. That is explicitly
speculative and out of scope, so `Layer` stays untouched.

## 7. Architectural fit

`setPlane` / `setEmphasis` are renderer-agnostic concepts and belong on
`IPrimitivesRenderer`, not the pixi class — so this composes with, rather than fights, the
`@invana/renderer-pixijs` extraction
([`renderer-pixijs-extraction-plan.md`](./renderer-pixijs-extraction-plan.md), P2). Pixi's
`RenderLayer` stays behind that seam and is never re-exported (D5).

**The kernel contract is intact.** State still lives in `canvas-store` as
`node.states = ['dimmed']`; only the *projection strategy* changes — from "rewrite the
spec" to "move the container". Say so in TSDoc, or it will read as a violation of
"the renderer is a pure projection of state".

---

## 8. Risks

1. **§3.2 `renderGroup` constraint is unvalidated** under the real `pixi-viewport` camera.
   The only open assumption; phase 1 validates it cheaply.
2. **`dimmed` changes meaning** — whole-element vs fill-only (§4.4). Needs visual review,
   not just a perf check.
3. **Group compositing ≠ per-element alpha.** A muted container composites as a unit, so
   overlapping muted elements stop double-darkening. Usually better-looking; still a change.
4. **Filters permanently excluded** for stripe-attached elements (§3.2).
5. **Every existing group/combo story changes appearance** — edges now cross over frames
   instead of hiding under them. Intended, but a suite-wide visual break; §9.6 is a gate.
6. **`resolveNodeStyle` stops being the whole visual truth** — emphasis lives in container
   membership. Export and debugging tooling must account for it. (Per §5.1 the minimap does
   not: it never rendered emphasis anyway.)
7. **`RenderLayer` is experimental.** Our immunity to its main caveat (§3.3) is real, but
   pin the pixi version and keep the seam narrow.
8. ~~**Emphasis is invisible to `toSVG` unless wired.**~~ **Retired by D8** — this is now
   the intended behaviour, not a defect. An export is the styled source of truth and
   deliberately ignores transient interaction state, so it reproduces identically whatever
   the user happened to be hovering. Document it on `toSVG` so it reads as a choice.

---

## 9. Verification

Storybook on :6006. The Chrome extension isn't connected in this environment; headless
Chrome with swiftshader renders the WebGL canvas fine:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --use-gl=angle --use-angle=swiftshader \
  --enable-unsafe-swiftshader --hide-scrollbars --window-size=1600,1000 \
  --virtual-time-budget=15000 --screenshot=after.png \
  "http://localhost:6006/iframe.html?id=usecases-invanaarchitecture--invana-architecture&viewMode=story"
```

1. **Occlusion fixed** — `Usecases/InvanaArchitecture` with **no** `onReady` logic: all six
   labels from §1.1 render in full. Should be *better* than the workaround, which lifts
   path + label together and leaves arrows over the frames.
2. **Collapse ⇄ expand** — toggling a stage re-`attach`es the frame between `backdrop` and
   `nodes` (occludes edges collapsed, not expanded).
3. **Hover + select compose** — hover a *selected* node and move away: it stays raised
   (claim registry). With `inactiveState: 'dimmed'`, the muted set dims as whole elements,
   the active set stays crisp, and a muted+raised element renders as both.
4. **Perf** — on the 5k/28.6k dataset hover no longer produces a full-graph restyle;
   measure via existing telemetry, not eyeballed frame rate.
5. **Hit-test parity** — click the topmost element in overlapping stacks, including a
   backdrop element under an edge; picking matches painting (§4.3).
6. **Suite sweep** — every group/combo story and usecase demo (risk 5 makes this a gate).
7. `pnpm check-types` + `pnpm build`; rebuild edited packages so Storybook picks them up
   (it reads `dist/`, not `src/`).

---

## 10. Rejected alternatives

- **`EdgeStyle.labelOnTop` + a topmost label stripe.** Treats the symptom: needs a per-edge
  opt-in, leaves the *paths* occluded, and creates a decoration-lifetime problem (a label
  reparented out of `connector.gfx` no longer dies with its host).
- **A `GroupFrameBehaviour`.** Nothing owns frame paint order today — `GraphLayer` renders
  frames from `style.group`, `CollapseExpandBehaviour` only toggles `collapsed`. Paint order
  isn't interaction state; a behaviour would re-declare what the style already says and,
  having no render hook, would have to re-assert on every add / relayout / `pointerout` —
  rebuilding the workaround with a lifecycle around it. Root rule 7 (behaviours never
  auto-enable) would also leave groups rendering wrong by default.
- **Reparenting into a fourth plain `Container`** (the superseded plan). Works, but every
  reparent is an ownership question: decoration lifetime, restoring to the right home,
  destroy ordering. `RenderLayer.attach` sidesteps all of it.
- **Making `_container` sortable.** Collapses the stripe model into one flat z-space and
  breaks the "connector decorations are clipped by shapes" contract the sub-layer TSDoc
  depends on.
- **Muting via `ColorMatrixFilter` on a container.** Impossible across the seam (§3.2), and
  a full-container filter pass per frame besides.

## 11. Open questions

1. ~~Field vs imperative call as the entry point?~~ **Resolved by §4.1.1** — both, with
   distinct roles: `spec.plane` is the *declared home* (serialisable, store-owned) and
   `setShapePlane(…)` is a *transient owner-keyed claim*. Effective = claim ?? spec ??
   kind default.
2. ~~Simple or advanced editor placement?~~ **Resolved by D9** — advanced section only.
3. ~~Should `MiniMapLayer` mirror stripes or flatten?~~ **Resolved by §5.1** — it draws its
   own `Graphics` and owns no renderer, so it already flattens. Adding emphasis to the
   minimap would be new work, not migration.
4. Do **connectors** eventually need `emphasis` groups of their own, or is one pair per
   renderer enough? One pair is assumed here.
5. ~~Should `toSVG` reflect emphasis?~~ **Resolved by D8** — no. Styled source of truth.
6. **Per-element `dimmed` states, or a first-class focus set?** (§5.2.4) Per-element keeps
   the state model untouched and is much faster than today, but stays O(|V|+|E|) in store
   writes. A `setFocus(ids)` / `clearFocus()` pair on the layer — backed by an interaction-
   state field in the store — is genuinely constant-time and mirrors how the emphasis
   containers work, at the cost of a new state concept and a migration for the five
   behaviours that currently write `dimmed`. **This is the one decision that determines
   whether Symptom B is *reduced* or *eliminated*.**
7. **Is LOD in scope?** §4.1.2 found the headroom is small — LOD already avoids repaints
   (`setShapeTextVisible` is a pure `.visible` flip), so planes make it *tidier*, not
   dramatically faster, unless the 🔬 O(1) stripe-detach trick holds. Options: leave the
   LOD behaviours untouched (planes still give them a cleaner list to iterate), or verify
   the detach trick and migrate the zoom-threshold LOD behaviours onto it.
8. ~~`OVERLAY_SHAPE_Z` — keep as `zIndex`, or promote to a sixth plane?~~ **Recommended
   resolved in §4.1.3** — keep as `zIndex` bands inside the `overlay` plane (planes don't
   nest; "raised shapes above raised connectors" is genuinely within-stripe ordering),
   but reframe the TSDoc and share one stride constant with `pickZ`.
