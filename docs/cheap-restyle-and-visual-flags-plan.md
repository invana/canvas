# Cheap restyle — `tint` / `opacity` styling, and `disabled` / `muted` as element flags

**Status:** proposed. Additive in phases 1–2, **breaking** in phase 3.
Touches `@invana/canvas` (renderer + specs), `@invana/graph` (style vocabulary, store
flags, behaviours), and the canonical state catalogues.

**Builds on what already landed:** the renderer colour fast path
(`setShapeAlpha` / `setConnectorAlpha`) and focus projected from
`view.interaction.focus`. This plan generalises both — tint alongside alpha, and a routing
rule so *any* colour-only change takes the cheap path rather than only focus dimming.

---

## 1. Why

Every visual state change rebuilds geometry, whatever it actually changed:

```
store.setNodeState(id, name, on)
  → dirty → rerenderNode(id)
  → nodeSpec(node)          full resolveNodeStyle merge over base + all active states
  → renderer.updateShape()
  → shape.draw()            Graphics.clear() + full retrace
```

Toggling a state that only shifts opacity costs the same as changing the shape kind. On the
reference 5k-node / 28.6k-edge graph that is ~34k clear-and-retrace operations for a hover,
and again on release — to change nothing but colour.

The state system is not the problem. **The absence of a cheap path is.**

Two secondary problems fall out of the same gap:

- **No multiplicative tint.** The only colour lever is `bgFill`, which *replaces* a colour.
  Recede-without-recolour has no vocabulary, so effects like "mute this" are expressed by
  substituting a grey — which loses the element's identity and forces a rebuild.
- **`disabled` is documented as data but implemented as a transient state.** `types.ts`
  calls it *"Data flag: 'not interactive'. Sticky; owned by the data feed. Visually similar
  to `dimmed` but semantically distinct (data, not interaction)."* It behaves like a state
  name anyone can toggle.

---

## 2. Decisions

| # | Decision | Rationale |
|---|---|---|
| **D1** | `tint` and `opacity` become **first-class style fields** | Multiplicative colour and element-wide opacity are distinct from the existing `bgFill` (replaces) and `bgAlpha` (fill only). Both map to a single display-object property, so both can be written without a rebuild. |
| **D2** | A **routing rule**, not a new concept: colour-only changes take the fast path | Implemented as a diff against the cached spec, so it covers state toggles, undo, import and direct updates alike — not just one caller. |
| **D3** | `disabled` **and** `muted` become authored element flags | Both are legitimate things a dataset can assert about an element. Flags sit beside the existing `hidden` / `pinned` bits and get the same index sets and O(1) counts. |
| **D4** | Authored flags **compose with** derived conditions, they do not replace them | Precedent already in the codebase: `culled = hiddenByGroup \|\| node.hidden === true` (`GraphLayer.ts:1454`). Muting works the same way — authored `muted`, OR outside the active focus set. |
| **D5** | **No `blur` style option** | In a renderer, blur is a Gaussian filter: a render-texture pass per element, and (verified) filters do not apply across `RenderLayer` attachment. Offering it invites blurring 30k edges. `tint` + `opacity` deliver the same recede for free. |

---

## 3. Design

### 3.1 The style vocabulary gap

| Field | Meaning | Cost today |
|---|---|---|
| `bgFill` | **replaces** the fill colour | rebuild |
| `bgAlpha` | opacity of the **fill only** | rebuild |
| `strokeAlpha` | opacity of the **stroke only** | rebuild |
| **`tint`** 🔧 | **multiplies** the whole element's colour | one property |
| **`opacity`** 🔧 | opacity of the **whole element** | one property |

`tint` and `opacity` are the two channels that describe *the same element, de-emphasised*.
Everything else describes *a different-looking element*. That distinction is the whole
routing rule.

### 3.2 The routing rule

> Resolve the style as normal. Diff it against the cached spec. If only `tint` and/or
> `opacity` changed, write those properties directly. Otherwise rebuild as today.

Diffing the *result* rather than classifying the *cause* means one implementation covers
every route into the renderer — a behaviour toggling a state, an undo, an imported
snapshot, a direct update from the UI.

This is where the user-supplied-styling rule lands naturally: if a consumer's `dimmed`
overlay is `{ opacity: 0.25 }` it takes the cheap path; if it also sets `bgFill` or a
decoration, it rebuilds — and the cost is an explicit consequence of what they asked for,
not a hidden default.

### 3.3 Flags vs derivation — both, composed

`disabled` and `muted` become authored flags on the element, stored as bits beside
`hidden` and `pinned`, with the same index sets.

They do **not** replace derived state. Effective values compose:

```
effectiveDisabled = node.disabled
effectiveMuted    = node.muted  OR  (focus is active AND node is outside the focal set)
```

exactly mirroring the existing visibility rule. So a dataset can ship an element already
muted, a focus interaction can mute it transiently, and neither knows about the other.

**Why `muted` still must not be *written* per element by interactions.** The flag is for
authored intent. A hover that mutes the complement must keep setting
`view.interaction.focus` — one write — and let the layer derive. Writing the flag across
34k elements would reintroduce the exact cost this plan removes. The flag is an input to
the derivation, never its output.

### 3.4 What each flag projects to

| Flag | Visual | Interactive |
|---|---|---|
| `hidden` | not drawn | not hittable (already) |
| `disabled` | tint + opacity via the cheap path | **not hittable** — the "not interactive" half of its documented meaning |
| `muted` | tint + opacity via the cheap path | unchanged — muted elements stay clickable |

`disabled` finally delivers the non-interactivity its own documentation claims; today the
state name only changes appearance.

---

## 4. Implementation

### Phase 1 — style vocabulary *(additive)*

- `NodeStyle.tint` / `EdgeStyle.tint`, `NodeStyle.opacity` / `EdgeStyle.opacity`.
- `tint` on the shape and connector specs, as the **baseline** effects multiply onto —
  required so `resetHostToBaseline` restores the element's tint rather than hardcoding
  white, the same way `spec.alpha` already backstops opacity.
- Renderer: `setShapeTint` / `setConnectorTint`, beside the alpha pair already shipped.
- Editors: the two fields in the advanced section of the node-style panel.

### Phase 2 — the routing rule *(additive; the performance win)*

- Spec diff in `rerenderNode` and its edge counterpart; colour-only deltas route to the
  fast-path setters.
- Keep the diff shallow and cheap — it runs per changed element, and must stay far below
  the tessellation it avoids.
- Instrument it: count fast-path vs rebuild per frame in the existing frame meter, so the
  win is measurable rather than assumed.

### Phase 3 — authored flags *(breaking)*

- `GraphNode.disabled` / `GraphNode.muted`, plus the edge equivalents: flag bits in the
  `flags` column with index sets, mirroring `hidden`.
- Store API mirroring the visibility family: `setNodeDisabled` / `isNodeDisabled` /
  `disabledNodeCount` / bulk variants, and the same for `muted`.
- `nodeSpec` / `edgeSpec` compose authored flags with derived focus per §3.3.
- Remove `disabled` from `DEFAULT_NODE_STATES` / `DEFAULT_EDGE_STATES`.
- Hit index skips `disabled` elements.

### Phase 4 — behaviours pass styling, not commands

- `HoverActivateBehaviour.inactiveState` changes meaning: it no longer names a state to
  write across the complement, it supplies **the look for muted, if a custom one is
  wanted**. Absent → the derived focus path, zero rebuilds. Present with colour-only
  styling → still cheap. Present with structural styling → rebuild, by explicit request.
- `ClickSelectBehaviour.unselectedState` gets the same treatment.

---

## 5. Breaking changes and migration

| Change | Surface | Migration |
|---|---|---|
| `disabled` no longer a canonical state name | **62 references** across packages and stories | Store maps `states: ['disabled']` onto the flag for one release, warns once per session, then removed |
| `inactiveState` semantics | behaviour consumers | Absent behaves identically; a colour-only overlay behaves identically and gets faster; only structural overlays change cost |
| `DEFAULT_*_STATES.disabled` removed | catalogue consumers | Replaced by the flag; the overlay's visual result is reproduced by the flag's projection |

`muted` is purely additive — nothing uses that name today.

---

## 6. Risks

1. **Diff cost.** If the spec diff is not comfortably cheaper than the rebuild it avoids,
   the phase-2 win evaporates. Measure before trusting; the frame-meter counters in phase 2
   exist for this.
2. **Tint baseline coverage.** Effects reset tint to white today. Every reset path must
   learn the spec baseline or an effect ending will silently clear an element's tint.
3. **`disabled` becoming non-hittable is a behaviour change**, not just a visual one.
   Anything relying on clicking a disabled element breaks — intended, but it will surface
   in stories.
4. **Two ways to mute.** Authored flag and derived focus can both be active; the OR rule
   must be stated in TSDoc or someone will "fix" the redundancy.
5. **Migration window discipline.** The `disabled` shim must actually be removed, or the
   dual path becomes permanent.

---

## 7. Verification

- **Correctness** — toggle each flag and each colour-only state; confirm no rebuild via the
  phase-2 counters, and that appearance matches the pre-change render.
- **Composition** — an authored `muted` element inside a focal set, and a non-muted element
  outside it; both must resolve per §3.3.
- **Effects** — an element carrying `shake` or `breathing` while tinted; ending the effect
  must restore the element's tint, not white.
- **Interactivity** — `disabled` elements are not returned by hit-testing.
- **Perf** — hover on the reference graph: rebuilds per hover should go from ~34k to 0.
- **Suite** — the 62 `disabled` references, plus a screenshot sweep for the stories that
  use it.

---

## 8. Related

| Document | Relationship |
|---|---|
| `design.md` §7.2 | the defect this plan generalises; the colour fast path landed from it |
| `docs/render-planes-and-emphasis-plan.md` | paint order — independent axis, ships separately |
| `docs/per-element-visibility-plan.md` | the `hidden` flag whose machinery and composition rule this mirrors |
| `docs/large-graph-performance-plan.md` | the scale context; rebuild elimination is complementary to culling and batching |
