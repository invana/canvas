---
id: feat-2026-09-22-a-group-frame-has-no-named-shapes-and-only-three-kinds-fit
type: feat
title: A group frame can be named (folder, hexagon, pill…) instead of hand-built, and more shape kinds auto-fit their children
status: proposed
opened: 2026-09-22
decided: null
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: relates-to, object: rfc:feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so }
  - { predicate: relates-to, object: doc:docs/group-aware-layouts-plan.md }
  - { predicate: relates-to, object: doc:docs/node-styling-unification-plan.md }
  - { predicate: manifests-in, object: story:graph/Groups/AllOptions }
  - { predicate: manifests-in, object: story:usecases/by-casestudies/invana-architecture/EndToEnd }
---

## Summary

| | |
|---|---|
| **What is asked** | Make `tabbed-rect` (the manila-folder silhouette) a first-class group frame, and say which **other** shape kinds already used in stories can become group frames too |
| **What exists** | The folder frame **already works end to end** — `sym:GraphLayer.projectGroupShape` has a dedicated `tabbed-rect` branch (`file:packages/graph/src/layer/GraphLayer.ts#L2754-L2826`) and `sym:GroupOptions` carries five tab fields. Nothing *presents* it: one story in the repo uses it, no picker offers it, no named preset exists |
| **The gap, precisely** | (a) a frame shape must be hand-written as a raw shape spec every time — there is no named vocabulary (`'folder'`, `'hexagon'`); (b) only `rect` / `tabbed-rect` / `circle` auto-fit — every other kind silently passes through un-fitted (`#L2846`); (c) `sym:NodeResizeBehaviour` drops the handles for any kind but `rect` / `circle`, so `userResizable` on a folder frame is silently dead (`file:packages/graph/src/behaviours/NodeResizeBehaviour.ts#L237` · `#L254-L258`) |
| **Which other kinds qualify** | `regular-polygon` (74 story uses) and `ellipse` (registered in the renderer, **missing from graph's node union**). `polygon` is deferred, `star` / `arc` / `composite` rejected — see `D2` |
| **Feature rows** | `F1` (named presets) · `F2` `F3` (two new fitting kinds) · `F4` (resize gate) · `F5` (stale contract prose) · `F6` `F7` (canvas-ui pickers) · `F8` `F9` (stories — rule 11, explicit ask required) |
| **Open decisions** | `D1`–`D7`, all with a recommendation |
| **Row status** | proposed 9 · accepted 0 · implemented 0 · landed 0 · deferred 0 · rejected 0 |

**Nothing here changes an existing frame's appearance.** Every row is additive; the one
behavioural change is `F4`, which turns handles *on* where they are currently absent.

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The folder frame is fully built — geometry, renderer, SVG export, hit test, headless, label routing, tab auto-fit to the title — and is used by **one** node in the whole repo | `file:packages/canvas-core/src/specs/shapeGeometry/tabbedRect.ts` · `file:packages/renderer-pixijs/src/primitives/shapes/TabbedRectShape.ts` · `file:apps/storybook/stories/usecases/by-casestudies/invana-architecture/EndToEnd.stories.tsx#L241` | `grep -c "kind: 'tabbed-rect'"` over `apps/storybook` = 1 |
| M2 | Its own TSDoc says the frame's natural use *is* a group ("the tab is where the group's title goes"), yet `story:graph/Groups/*` (9 stories) never draws one | `file:packages/graph/src/layer/types.ts#L237-L238` | The nine stories use `rect` and `circle` only |
| M3 | A frame is always hand-assembled: shape spec + `group` options + paint + label placement, re-typed per graph. There is no named starting point, so every graph re-derives "what a folder looks like" | `file:apps/storybook/stories/graph/Groups/RectGroup.stories.ts#L94` · `file:apps/storybook/stories/graph/Groups/HackerStyle.stories.ts#L56` | Six group stories repeat the same four-field shape literal |
| M4 | `sym:GraphLayer.projectGroupShape` fits three kinds and passes every other kind through untouched, with no diagnostic — a hexagon frame with `autoFit: true` simply never wraps its children | `file:packages/graph/src/layer/GraphLayer.ts#L2844-L2846` | *"Non-fit-aware shape kind — pass through"* |
| M5 | `sym:NodeResizeBehaviour` gates on `rect \| circle` twice, so `group.userResizable: true` on a folder frame mounts nothing and reports nothing | `file:packages/graph/src/behaviours/NodeResizeBehaviour.ts#L237` · `#L254-L258` | `kind !== 'rect' && kind !== 'circle'` → `clearFrameFor` |
| M6 | The contract prose has drifted: `width`/`height` are documented *"Rect frames only"*, but the `tabbed-rect` branch reads both; `radius` says *"Circle frames only"* and would read for `regular-polygon` under `F2` | `file:packages/graph/src/layer/types.ts#L1019-L1027` | Compare against `#L2755-L2757` |
| M7 | `ellipse` is registered by the renderer and handled by core's bounds / contains / SVG, but is **absent** from graph's `sym:BuiltInNodeShapeOptions`, so a node (or frame) can only reach it through a `sym:CustomShapeOption` cast | `file:packages/renderer-pixijs/src/renderer/PrimitivesRenderer.ts#L393` vs `file:packages/graph/src/layer/types.ts#L388-L395` | `grep -n Ellipse packages/graph/src` → no match |
| M8 | The canvas-ui shape picker offers four kinds — circle, rect, regular-polygon, star — so neither the folder nor any frame-specific option is reachable from the studio | `file:packages/canvas-ui/src/editor-panels/node-style/simple/fields.ts#L17-L25` | No `sym:GroupOptions` field appears anywhere in `pkg:@invana/canvas-ui` |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The folder frame is missing engine support and must be built | **No.** It is complete, including `ShapeCtor.fitToContent` tab-sizing from the measured title, `headerHeight` → tab mapping, and all five `tab*` options | `file:packages/graph/src/layer/GraphLayer.ts#L2754-L2826` |
| R2 | A group preset belongs in `pkg:@invana/canvas-core` next to the shape specs | **No** — `sym:GroupOptions` is a graph concept; core knows nothing about parents, members or frames. A preset that carries `group` cannot live below graph | root `CLAUDE.md` layering: core is the dependency-free floor |
| R3 | `polygon` (arbitrary vertices, 70 story uses) is a viable auto-fit frame | **Not now.** There is no meaningful fit: scaling vertices about the centroid distorts the silhouette, and a convex-hull offset is a new algorithm. It works today as a **fixed-size** frame | `D2` keeps it as a deferred row, not a rejection |
| R4 | `composite` should be a frame kind so a group can be a card | **No.** That is the card stack's job (root `CLAUDE.md` § three layers); a composite is content, not scenery | `doc:docs/node-styling-unification-plan.md` |
| R5 | This is blocked by the scenery default landing today | **No.** `rfc:feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so` touches hover/click input only; it reads `sym:GraphLayer.getGroupRole`, never the frame's shape kind | That RFC's `C4` |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D-1 | A frame is already fully described by a `sym:NodeStyle` fragment: `shape` + `group` (+ the label placement that suits it). Nothing new is needed to *express* a folder — only to *name* one | `file:apps/storybook/stories/usecases/by-casestudies/invana-architecture/EndToEnd.stories.tsx#L241` builds one by hand | A preset can be plain frozen **data**, not code — no registry, no lifecycle, no runtime |
| D-2 | `GROUP_FRAME_PRESETS` is a frozen record of `GroupFramePreset` fragments in `pkg:@invana/graph`, spread into a node's style by the consumer: `style: { ...groupFramePreset('folder'), labelText: 'Ingest' }` | mirrors `sym:LOOP_CURVE_PRESETS` (`file:packages/canvas-core/src/lib/geometry/connectors/pathStyles/loopCurve.ts#L97`), the in-repo precedent for named option bundles | One import, zero engine coupling; a preset is overridable field-by-field because it is just an object |
| D-3 | Fit for `regular-polygon` is the circle branch with one correction: children must fit the **inradius**, so `radius = (halfDiag + padding) / cos(π / sides)` | `file:packages/graph/src/layer/GraphLayer.ts#L2827-L2843` is the circle branch it clones | A hexagon frame wraps its members instead of clipping their corners |
| D-4 | Fit for `ellipse` is the rect branch with the ×√2 inflation an ellipse needs to contain its children's AABB: `rx = (childW/2 + padding)·√2`, `ry` likewise | core already exposes `ellipse` bounds + contains (`file:packages/canvas-core/src/specs/shapeGeometry/bounds.ts#L242`) | An oval frame is the soft counterpart to the rect frame, with no new geometry in core |
| D-5 | `ellipse` joins `sym:BuiltInNodeShapeOptions` and `normalizeShapeSize` (`rx = ry = size`), closing `M7` | `file:packages/graph/src/layer/GraphLayer.ts#L3201-L3220` | The graph union stops lagging the renderer registry; the cast at the boundary disappears |
| D-6 | The resize gate widens from a hardcoded pair to "kinds whose handle set we know": `RECT_HANDLES` for `rect` / `tabbed-rect` / `ellipse`-as-box, `CIRCLE_HANDLES` for `circle` / `regular-polygon` | `file:packages/graph/src/behaviours/NodeResizeBehaviour.ts#L271` | `userResizable` stops being silently dead on a folder frame (`M5`) |
| D-7 | The tab is **not** part of the resized box: a folder's `height` is its body alone, and `headerHeight` drives the tab, so dragging the bottom-right handle writes body height exactly as it does for a rect | `file:packages/graph/src/layer/GraphLayer.ts#L2756-L2758` | No special-casing in the drag math, only in the handle-set choice |

**Why presets, and not just "use `tabbed-rect`".** `M3` is the report that pointing at a
kind is not enough: a folder needs `headerHeight` (or the tab has no height), a label
placed `inside-top-left` (or the title misses the tab), and `tabSkew` (or it reads as a
box). Those four facts are what a preset carries; the kind alone reproduces none of them.

**Proposed preset set**, all built from kinds already used in stories:

| Key | Shape | Why it earns a name | Kind in stories |
|---|---|---|---|
| `rect` | `rect`, `cornerRadius: 10` | The default frame; today's six group stories, by hand | 189 uses |
| `folder` | `tabbed-rect` + `headerHeight: 26` + `tabSkew: 8` + `labelPlacement: 'inside-top-left'` | `M1`/`M2` — the whole request | 1 use |
| `pill` | `rect`, `cornerRadius: 999` | Same kind, no new fit path; the soft lane frame | — (rect) |
| `circle` | `circle` | `story:graph/Groups/CircleGroup`, by hand | 402 uses |
| `hexagon` | `regular-polygon`, `sides: 6`, `rotation: π/6` | Needs `F2`; the cluster / honeycomb frame | 74 uses |
| `ellipse` | `ellipse` | Needs `F3`; the soft blob frame, and the shape a density/bubble overlay implies | 4 uses (via cast) |

### Confirming test

| Test | Action | Result today | Inference |
|---|---|---|---|
| T1 | `story:graph/Groups/AllOptions` → Shape → `shapeKind` | Offers `rect` and `circle` only (`file:apps/storybook/stories/graph/Groups/AllOptions.stories.ts#L261-L262`) | The folder is unreachable from the one story built to exercise every group option — `M2` |
| T2 | Set a group's `shape` to `{ kind: 'regular-polygon', sides: 6, radius: 40 }` with `autoFit: true` | Frame stays at `radius: 40`; children spill out | `M4` — the pass-through is silent |
| T3 | Set `group.userResizable: true` on the `tabbed-rect` frame in `story:usecases/…/EndToEnd` | No handles appear, no warning | `M5` |
| T4 | **Control** — the same frame's `tabWidth` left unset | Tab sizes itself to the title | `R1`: the folder path is healthy where it is reachable |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/group-aware-layouts-plan.md` | relates-to | current | Container insets come from `padding` + `headerHeight`; `pkg:@invana/graph-layout-elkjs` already reads them and names the tab (`file:packages/graph-layout-elkjs/src/ElkLayout.ts#L246-L249`). A preset that sets `headerHeight` therefore feeds ELK correctly for free |
| `doc:docs/node-styling-unification-plan.md` | relates-to | planned | Its `NodeStyleSimple` carries a `shape?: string` picker (`#L67`). `F6`'s picker row is the same list; when that plan lands, `GROUP_FRAME_PRESETS` is what a *frame* picker resolves against |
| `rfc:feat-2026-09-22-a-group-frame-is-scenery-but-every-graph-must-say-so` | relates-to | accepted | Input-side only. Orthogonal, but it means a frame is *less* interactive by default, which raises the value of `F4` (resize is one of the few remaining frame interactions) |
| `doc:docs/group-frame-paint-band-plan.md` | relates-to | superseded | The `headerHeight` band as a painted region — the idea the `tabbed-rect` tab replaced. Read before touching `headerHeight` semantics |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/graph/src/layer/groupFrames.ts` (new) + graph barrel | `GroupFramePreset` type, frozen `GROUP_FRAME_PRESETS` (the six rows above), `groupFramePreset(name, overrides?)` returning a fresh `Partial<NodeStyle>` | A folder frame is one call; the four facts that make it read as a folder travel together | low — additive data, no engine call site | D1, D4, D5 |
| F2 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts#L2827` | Add a `regular-polygon` branch to `projectGroupShape` using the inradius correction (`D-3`) | `autoFit` works on a hexagon frame | low | D2 |
| F3 | defect | proposed | `file:packages/graph/src/layer/types.ts#L388` + `GraphLayer.ts#L3201` + `#L2809` | Add `EllipseShapeOption` to the built-in union, a `normalizeShapeSize` branch, and an `ellipse` fit branch (`D-4`) | `ellipse` becomes a first-class node **and** frame shape; `M7` closed | low — additive union member; `pkg:@invana/graph` has no `api/*.surface.txt` (`C7`) | D2, D3 |
| F4 | defect | proposed | `file:packages/graph/src/behaviours/NodeResizeBehaviour.ts#L237` · `#L254-L258` · `#L271` | Replace the two `rect \| circle` gates with a kind→handle-set map (`D-6`) | `group.userResizable` stops being silently dead on a folder / hexagon / ellipse frame | **not low** — turns handles on where none appeared; touches drag write paths | D7 |
| F5 | defect | proposed | `file:packages/graph/src/layer/types.ts#L1019-L1027` · `#L950` | Correct `width`/`height` ("Rect frames only" → rect **and** tabbed-rect) and `radius` (→ circle **and** regular-polygon); list the fitting kinds on `autoFit` | The contract stops contradicting `projectGroupShape` (`M6`) | low | F2, F3 |
| F6 | defect | proposed | `file:packages/canvas-ui/src/editor-panels/node-style/simple/fields.ts#L17-L25` | Add `tabbed-rect` ("Folder"), `ellipse` ("Ellipse"), `polygon` ("Polygon") to the `shapeKind` select | The kinds the engine renders are the kinds the studio can pick (`M8`) | low | F3 |
| F7 | defect | proposed | `file:packages/canvas-ui/src/editor-panels/node-style/group/` (new) | A **Group** section: frame-preset select (from `F1`) + `autoFit` / `padding` / `headerHeight` / `behindChildren` / `userResizable` / `tab*`, `fields.ts` + `mapping.ts` + `GroupStyleEditorPanel`, wired into the node-style panel | `sym:GroupOptions` becomes editable at all — today no editor touches it | **not low** — new UI surface, new panel section | F1, D6 |
| F8 | dressing | proposed | `file:apps/storybook/stories/graph/Groups/AllOptions.stories.ts#L74` · `#L261-L266` | Extend `shapeKind` to `['rect','circle','tabbed-rect','hexagon','ellipse']` and add the `tab*` controls | The "every group option" story stops omitting five of them (`T1`) | low — **rule 11: needs an explicit ask** | F1, F2, F3, D7 |
| F9 | dressing | proposed | `file:apps/storybook/stories/graph/Groups/FolderGroup.stories.ts` (new) | A `story:graph/Groups/FolderGroup` in the shape of `story:graph/Groups/RectGroup`, driven by `groupFramePreset('folder')` | The folder frame gets the demo the other two frame shapes have | low — **rule 11: needs an explicit ask** | F1, D7 |

**Why `F8`/`F9` are dressing.** They remove no cause and change no behaviour — they make
the capability discoverable. They are listed so they can be rejected without touching
`F1`–`F7`, and per root rule 11 they are written **only** on an explicit request.

## 5. Blast radius

### Upstream

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphLayer.projectGroupShape` | `F2`/`F3` add branches to the only place frame geometry is fitted | Low — new `if` blocks beside three existing ones, same shape of code |
| U2 | `sym:GraphLayer.fitShapeToLabel` → `ShapeCtor.fitToContent` | The folder's tab sizes itself from the measured title; a preset that pins `tabWidth` would disable that | Low — presets deliberately leave `tabWidth` unset |
| U3 | `pkg:@invana/canvas-core` bounds / contains / `sym:shapeSpecToSvg` | Every kind proposed is already handled: `ellipse` and `regular-polygon` appear in all three | **None** — no core change in this RFC |
| U4 | `sym:ElkLayout` container insets | Reads `padding` + `headerHeight`; a `folder` preset sets `headerHeight: 26` | Low, and correct: ELK then reserves the tab band |
| U5 | `sym:PrimitivesRenderer.registerShape` | `ellipse` is registered; `F3` only teaches graph's type union about it | None |

### Downstream

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| C1 | `story:graph/Groups/*` (9 stories) | story | **None** — presets are opt-in; existing hand-built frames keep their literals | None (`F8`/`F9` optional) |
| C2 | `story:usecases/by-casestudies/invana-architecture/EndToEnd` | story | None. Its hand-built `tabbed-rect` frames keep working; they could later adopt `F1` | None |
| C3 | `sym:NodeResizeBehaviour` | runtime | `F4` mounts handles on frames that previously showed none. A graph that set `userResizable: true` on a folder frame **gains** an interaction it never had | Verify `V5`; a graph wanting the old silence sets `userResizable: false` |
| C4 | `sym:GraphLayerOptions.node.style` / `sym:NodeShapeOptions` | published API | `F3` widens a public union by one member. Additive for consumers; a `switch` over `BuiltInNodeShapeOptions['kind']` with no `default` in **consumer** code would newly fail exhaustiveness | None in-repo — internal switches narrow via `sym:isBuiltInNodeShape` and carry a `default` |
| C5 | Serialised `sym:CanvasConfig` / node styles | state | Additive only. A preset is spread at author time, so nothing new is persisted; a saved style referencing `kind: 'ellipse'` now type-checks where it previously needed a cast | None |
| C6 | `sym:CanvasSettingsEditorPanel` / `sym:NodeStyleEditorPanel` | UI | `F6` adds three select rows; `F7` adds a whole Group section wherever the node-style panel is mounted (incl. `story:canvas-ui/*` panels and `sym:GraphCanvasApp`) | `F6`, `F7` |
| C7 | `api/*.surface.txt` | published API | `api/` pins `canvas-core`, `canvas-store`, `canvas` only — `pkg:@invana/graph` and `pkg:@invana/canvas-ui` have no snapshot, and no core/canvas surface changes here | None; `pnpm lint` still runs `check-api-surface` |
| C8 | `pkg:@invana/graph-layout-elkjs` | runtime | Reads the same `padding`/`headerHeight`; a preset only supplies values it already handles | None |
| C9 | `sym:CollapseExpandBehaviour` toggle placement | runtime | `togglePlacement` resolves against the frame's **bounds**, which `tabbed-rect` reports including the tab — a `top` toggle sits above the tab, not the body | None; note it in `F5` prose |
| C10 | `sym:MiniMapLayer` · `sym:BubbleSetsLayer` · `sym:DensityContour*Layer` | runtime | Consume node bounds, which every proposed kind already reports | None |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Build a group node from `groupFramePreset('folder')` with three children and `autoFit: true` | a scratch story or `story:graph/Groups/FolderGroup` | Frame wraps the children; tab sits above the body, sized to the title; title renders in the tab | F1 |
| V2 | pending | Same with `groupFramePreset('hexagon')` | same | Every child is **inside** the hexagon's edges, not merely inside its circumcircle | F2 |
| V3 | pending | Same with `groupFramePreset('ellipse')` | same | Children contained; `rx`/`ry` track the child AABB | F3 |
| V4 | pending | **Control** — `groupFramePreset('rect')` and `('circle')` against today's `story:graph/Groups/RectGroup` / `CircleGroup` | those stories | Pixel-identical framing to the hand-built literals they replace | F1 |
| V5 | pending | `userResizable: true` on folder / hexagon / ellipse frames; drag each handle | same | Handles appear; drag writes `group.width`/`height` (or `radius`) and the frame follows; the tab keeps its own height | F4 |
| V6 | pending | **Control** — `userResizable` on a `rect` and a `circle` frame | `story:graph/Behaviours/GroupResize` | Unchanged from today | F4 |
| V7 | pending | **Control** — collapse / expand a folder frame; check the `+`/`−` placement and the collapsed silhouette | `story:graph/Groups/AllOptions` | Toggle lands where `togglePlacement` says, measured against the tab-inclusive bounds (`C9`) | F4, F5 |
| V8 | pending | Node-style panel → Shape picker → Folder / Ellipse / Polygon; then the Group section's preset select | `story:canvas-ui/*` panel story | Each switches the live frame; `autoFit` and `padding` round-trip | F6, F7 |
| V9 | pending | `pnpm check-types` · `pnpm build` · `pnpm lint` (incl. `check-boundaries`, `check-api-surface`) | repo | pass, with no surface snapshot regeneration needed (`C7`) | F1–F9 |
| V10 | pending | **Control** — a graph with no group nodes | `story:graph/Nodes/AllShapes` | Unchanged; `ellipse` additionally selectable | F3, F6 |

`V1`–`V8` are visual checks against a WebGL canvas; there is no browser automation here,
so they are a manual pass in a **visible** Storybook tab.

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D1 | Named presets at all, or just document the kinds? | (a) `GROUP_FRAME_PRESETS` data map + helper · (b) prose only: "set `kind: 'tabbed-rect'` and these four fields" · (c) a class/registry with runtime registration | **(a)**. `M3` says the four co-travelling fields are the content; (b) is what exists and produced one use in the repo. (c) buys nothing — a preset has no lifecycle, and `sym:LOOP_CURVE_PRESETS` is the precedent for plain data | open |
| D2 | Which kinds join the auto-fit set? | (a) `regular-polygon` + `ellipse` · (b) also `polygon` (scale about centroid) · (c) also `star` / `arc` · (d) none — folder only | **(a)**. Both have exact, cheap containment math and real story usage. `polygon` has no honest fit (`R3`) and stays usable as a fixed frame; `star`/`arc` are content shapes, and a star frame's concave points make "inside" meaningless | open |
| D3 | Add `ellipse` to graph's `sym:BuiltInNodeShapeOptions`? | (a) yes · (b) no — keep it reachable only via `sym:CustomShapeOption` | **(a)**. The renderer registers it, core's bounds/contains/SVG handle it, and graph is the only layer that doesn't know (`M7`). It is also the one new union member `F3` needs | open |
| D4 | Preset key for the folder | (a) `'folder'` · (b) `'tabbed-rect'` (mirror the kind) · (c) `'tab'` | **(a)**. A preset names the *look*, not the primitive — and the preset set spans kinds (`pill` and `rect` share one), so mirroring kinds would misname half of them | open |
| D5 | Where do presets live? | (a) `pkg:@invana/graph`, `layer/groupFrames.ts` · (b) `pkg:@invana/canvas-core` next to the shape specs · (c) `pkg:@invana/canvas-ui` as editor data | **(a)**. A preset carries `sym:GroupOptions`, which is a graph concept core cannot see (`R2`); putting it in canvas-ui would keep it out of headless and story code | open |
| D6 | Does `sym:GroupOptions` get an editor (`F7`)? | (a) yes, a Group section in the node-style panel · (b) defer — presets only, no UI · (c) preset select only, no individual fields | **(a)**. Root rule 12's spirit: a frame's options are visualisation state, and today **nothing** edits them. (c) is the acceptable half-step if `F7`'s size is the objection | open |
| D7 | Story rows `F8`/`F9` | (a) approve both now · (b) `F8` only (extend the existing playground) · (c) neither — code only | **(b)** as the minimum: `AllOptions` claims to expose every group option and currently hides five. `F9` is the nicer demo but a new file; root rule 11 means both need this to be said explicitly | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-22 | Maintainer asks whether a folder-shaped group exists in the group presets, then asks for `tabbed-rect` to be added and for other story-proven kinds to be named | proposed | Investigation found the folder frame complete but unexposed (`M1`), no preset concept at all (`M3`), and two silent gaps — fit pass-through (`M4`) and the resize gate (`M5`) |
