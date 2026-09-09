---
id: fix-2026-09-10-nested-app-shells-collide-on-panel-group-ids
type: fix
title: Two AppLayoutV2 shells alive at once collide on hardcoded panel-group ids, so GraphCanvasApp cannot be embedded in an app shell
status: accepted
opened: 2026-09-10
decided: 2026-09-10
landed: null
packages: [pkg:@invana/themes, pkg:@invana/canvas-ui, pkg:@canvas/storybook]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:design-kit/packages/themes/src/app-v2/layout.tsx#L148 }
  - { predicate: manifests-in, object: file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L578 }
  - { predicate: verified-by, object: story:canvas-ui/view-panels/CanvasPagesViewPanel/FooterTabs }
---

**Summary:** `sym:AppLayoutV2` gives every `ResizablePanelGroup` it creates a **fixed**
id (`main-layout`, `editor-horizontal`, `left-main-vertical`, …). `react-resizable-panels`
keeps its live groups in one module-global registry and resolves a group by scanning for
the **first** entry whose id matches, so two shells alive at once read each other's
layout. `sym:GraphCanvasApp` *is* an `sym:AppLayoutV2`, so embedding a canvas app inside
any app shell — the thing every Studio screen will do — throws
`Invalid 2 panel layout: 100%` at mount.

> **Cross-repo.** The defect and rows F1–F3 live in the **design-kit** repo
> (`~/Projects/invana/design-kit`), which has no `docs/rfcs/`. The record is kept here,
> where the consumer and the failing story live; `file:design-kit/…` paths are relative to
> that repo's root.

| | |
|---|---|
| **What breaks** | Any `sym:GraphCanvasApp` rendered inside an `sym:AppLayoutV2` whose left panel or inspector is open. The shell's 2-panel group reads the board's 1-panel layout and throws before first paint |
| **Root cause** | `file:design-kit/packages/themes/src/app-v2/layout.tsx#L148,L169,L186,L202,L227,L246` pass literal group ids; `react-resizable-panels` documents ids as *"Uniquely identifies this group within an application. Falls back to `useId` when not provided"* and looks groups up by first-id-match |
| **Defect rows** | F1, F2, F3, F4 |
| **Dressing rows** | F6 (rejected — kept as the record of the workaround we did not take) |
| **Open decisions** | None — D3 settled: `v0.0.23` cut and published 2026-09-10 |

Row status: proposed 0 · accepted 0 · implemented 1 · landed 3 · deferred 1 · rejected 1 · superseded 0

---

## 1. Symptom

| ID | Observation | Where | Evidence |
|----|-------------|-------|----------|
| S1 | A story mounting `sym:CanvasPagesViewPanel` pages inside an `sym:AppLayoutV2` shell crashes before first paint: `Error: Invalid 2 panel layout: 100%` | `story:canvas-ui/view-panels/CanvasPagesViewPanel/FooterTabs` | Stack: `K3` → `Bt` → `commitHookEffectListMount`, i.e. a group's mount layout-effect |
| S2 | The same shell renders completely — header, rail, left panel, inspector, footer tab strip — when the page bodies are plain `<div>`s | same story, T1 | Screenshot: every region correct, tabs left, readout right |
| S3 | The throw names **2** panels and a **single** `100%` entry, i.e. a group whose layout came from somewhere with one panel | `file:node_modules/react-resizable-panels/dist/react-resizable-panels.js#L845` | `Invalid ${t.length} panel layout: ${o.map(…).join(", ")}` where `t` is *this* group's constraints and `o` the layout it was handed |
| S4 | Not story-specific: it fires for any `sym:GraphCanvasApp` inside a shell with a left panel or inspector open, because that is what makes a shell group hold 2 panels | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L578` | `sym:GraphCanvasApp` renders `sym:AppLayoutV2` unconditionally |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|----|------------|---------|----------|
| R1 | The story's footer split is at fault — one view instance with `headerClassName="hidden"` in main, a tabs-only twin in the footer | **No** — with the same split and placeholder bodies the shell renders (T1); the crash tracks the *bodies*, not the strip | S2 |
| R2 | A stale Vite dep prebundle (the earlier `does not provide an export named 'PropertyList'`) | **No** — that was a separate, unrelated staleness from the `0.0.22` design-kit bump; it cleared on a dev-server restart and this error replaced it | Prebundle dated Aug 13 vs `@invana/ui@0.0.22` |
| R3 | Duplicate ids are always fatal, so the existing multi-app stories must be broken too | **No** — sibling `sym:GraphCanvasApp`s all produce **identical 1-panel** layouts, so the cross-talk is a no-op. Only a *differently shaped* second group throws | `story:canvas-ui/apps/GraphCanvasApp/MultipleApps` · `story:canvas-ui/view-panels/CanvasPagesViewPanel/Basic` both render today |
| R4 | `sym:PanelStack` has the same defect (it also builds resizable panels) | **No** — its group carries **no** id, so `useId` makes it unique; its `section.id`s are panel ids, which the library scopes *within* a group | `file:design-kit/packages/ui/src/components/ui-extended/panel-stack.tsx#L220-L247` |

---

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|------|-----------|----------|-------------|
| D-1 | `react-resizable-panels` stores every live group in one module-global map and resolves one by scanning for the first entry whose `id` matches | `file:node_modules/react-resizable-panels/dist/react-resizable-panels.js#L449-L465` (`F`, `Oe`, `H`) | Group ids are an **application-global namespace**, not a local name |
| D-2 | The library says so in its own contract, and generates a unique id when none is given | `file:node_modules/react-resizable-panels/dist/react-resizable-panels.d.ts#L97-L102,L322-L329` | *"Uniquely identifies this group within an application. Falls back to `useId` when not provided"* — the safe default was available and opted out of |
| D-3 | `sym:AppLayoutV2` passes literal ids for all four of its group shapes | `file:design-kit/packages/themes/src/app-v2/layout.tsx#L148` (`editor-horizontal`), `#L169` (`left-main-vertical` / `main-center-vertical` / `main-right-vertical`), `#L186,L202,L227,L246` (`main-layout`) | Every instance of the shell claims the same four names |
| D-4 | `sym:GraphCanvasApp` is itself built on `sym:AppLayoutV2` | `file:packages/canvas-ui/src/apps/GraphCanvasApp.tsx#L52,L578` | A canvas app inside an app shell means **two** live shells, i.e. two groups named `editor-horizontal` |
| D-5 | The two groups have different shapes: the shell's `editor-horizontal` holds `sidebar-panel` + `editor-panel` (2 panels) whenever a left panel exists; the board's holds `editor-panel` only (1 panel, layout `{editor-panel: 100}`) | `file:design-kit/packages/themes/src/app-v2/layout.tsx#L143-L162` | The registry entry the shell finds does not describe the shell |
| D-6 | React commits **child** layout effects before parent ones, so the board registers first and the shell's group is the one that reads a foreign layout | React commit order; stack in S1 is a mount effect | Shell group: 2 constraints, 1 layout entry → the validator throws `Invalid 2 panel layout: 100%` |

**Why this and not something else:** the chain predicts a failure that is (a) a *throw at
mount*, not a mis-layout, (b) naming exactly **2** panels and exactly **one** `100%` entry,
(c) present only when the outer shell has a second panel in a group — so it appears the
moment a left panel or inspector is open and would vanish if the shell were single-panel,
(d) independent of what the page bodies draw, as long as they are `sym:GraphCanvasApp`s,
and (e) invisible to `pnpm check-types`, since ids are plain strings. S1–S4 match on all
five.

### Confirming test

| Test | Action | Result | Inference |
|------|--------|--------|-----------|
| T1 | Replace each page's `<GraphCanvasApp>` with a plain `<div>`; reload the story | Whole shell renders correctly | The shell, the footer split and the view panel are all sound — D-4 is the trigger |
| T2 | Restore `<GraphCanvasApp>`; reload | `Invalid 2 panel layout: 100%` returns immediately | The nested shell is necessary *and* sufficient for the crash |
| T3 | `grep -n "id=" file:design-kit/packages/themes/src/app-v2/layout.tsx` | 14 hits, all literal strings; 6 of them are group ids | D-3 confirmed by construction |
| T4 | `grep -rn "sidebar-panel\|auxiliary-panel\|terminal-panel\|main-layout\|editor-horizontal"` over both repos, excluding the layout itself | No hits | Nothing reads these ids — renaming them breaks no consumer (see §5) |

---

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `file:design-kit/CLAUDE.md` | relates-to | current | `pkg:@invana/themes` owns the app shells and is released in lockstep via `release.sh`; a fix here needs a design-kit release before `pkg:@canvas/storybook` can consume it |
| `doc:docs/ui-consolidation-plan.md` | relates-to | current | The Studio shell hosting canvas surfaces is the target arrangement — this defect blocks exactly that composition, so it is not a story-only concern |

---

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|----|------|--------|-------------|--------|--------|------|------------|
| F1 | defect | landed | `file:design-kit/packages/themes/src/app-v2/layout.tsx` | Derive a per-instance prefix (`React.useId()`, colons stripped) and apply it to **every** `ResizablePanelGroup` id | Two shells can be alive at once; the registry namespace stops being global-by-accident | medium — public shell component, behaviour change for anything that read the old DOM ids (T4: nothing does) | — |
| F2 | defect | landed | same | Apply the same prefix to the **panel** ids (`sidebar-panel`, `editor-panel`, …) | Panel ids are group-scoped in the library, but they are also written to the DOM `id` attribute — prefixing keeps the document free of duplicate ids | low | F1 |
| F3 | defect | landed | same | Add `idPrefix?: string` to `sym:AppLayoutV2Props`, defaulting to the generated prefix, with TSDoc naming the library contract | An app that needs *stable* ids (persisted layouts, e2e selectors) can pin them, instead of the component choosing for everyone | low | F1 |
| F4 | defect | implemented | `file:apps/storybook/package.json`, `pkg:@invana/canvas-ui`, `pkg:@invana/canvas-react` | Bump the design-kit deps to the release carrying F1–F3 and re-verify the story | The failing composition works, and Studio-shaped screens become expressible | medium — lockstep bump of `@invana/ui` / `themes` / `styling` / `forms` across the repo | design-kit release (D3) |
| F5 | defect | deferred | `pkg:@invana/canvas-ui` | Expose a `layoutIdPrefix` pass-through on `sym:GraphCanvasApp` | Only needed if a consumer wants *stable* ids for an embedded app; F1 makes the common case work with no API | low | F3 |
| F6 | dressing | rejected | `file:apps/storybook/stories/canvas-ui/view-panels/CanvasPagesViewPanel/FooterTabs.stories.tsx` | Hand-compose the story's chrome from `NavHorizontal` + `NavVertical` + `ResizablePanelGroup` with story-unique ids, avoiding `sym:AppLayoutV2` | Would make *this story* render while leaving every other embedding broken | — | — |

Rejected F6 on 2026-09-10: it hides the symptom in one story and leaves `sym:GraphCanvasApp`
un-embeddable everywhere else, which is the actual product requirement.

---

## 5. Blast radius

**Upstream**

| ID | Dependency | Why it matters | Risk if it moves |
|----|------------|----------------|------------------|
| U1 | `react-resizable-panels@4.12.2` | The global-registry lookup (D-1) and the `useId` fallback (D-2) are the mechanism *and* the fix | A future major could scope groups by React context instead, at which point the prefix is harmless but redundant |
| U2 | design-kit release pipeline (`release.sh`, lockstep versions) | F1–F3 only reach this repo through a published version | A partial bump (themes only, `ui` left behind) crosses the kit's lockstep rule |

**Downstream**

| ID | Consumer | Kind | Impact | Action required |
|----|----------|------|--------|-----------------|
| D1 | `sym:GraphCanvasApp` (`pkg:@invana/canvas-ui`) | published API | None to its surface; it stops crashing when embedded | Bump the dep (F4) |
| D2 | Every `canvas-ui` story (all mount `sym:GraphCanvasApp`) | stories | Ids change; nothing reads them (T4) | Smoke-test `Default`, `MultipleApps`, `CanvasBoards` (V2) |
| D3 | `story:Themes/AppV2` in the design-kit's own Storybook | story | Same — the Explorer shell keeps its layout, its panels keep resizing | V3 |
| D4 | Any Studio/app code selecting `#sidebar-panel` etc. in CSS or tests | DOM contract | Would break — **none found** in either repo | None; `idPrefix` (F3) is the escape hatch if one appears |
| D5 | Persisted panel layouts | state | The library keys layouts by group id; a generated id changes per mount, so nothing that was persisted survives — nothing persists today (no `autoSaveId` in use) | None |

---

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|----|--------|-------|--------|----------|--------|
| V1 | pass | Mount the story with real boards | `story:canvas-ui/view-panels/CanvasPagesViewPanel/FooterTabs` | Shell renders; footer tabs switch the canvas; `+ New canvas` adds a third board and every region follows it; no console error | F1, F2, F4 |
| V2 | pass | **Control** — stories that work today must keep working | `story:canvas-ui/apps/GraphCanvasApp/SideRegions` (right + bottom regions = multi-panel groups) · `…/MultipleApps` · `…/CanvasBoards` | Unchanged render; `SideRegions` still resizes both regions; `MultipleApps` matches its pre-change 0.0.22 build exactly, over-zoom included | F1, F2, F4 |
| V3 | pass | **Control** — the design-kit's own shell story | `story:Themes/AppV2` (design-kit Storybook, port 6009) | Unchanged render; left/right/bottom still drag-resize and collapse | F1, F2 |
| V4 | pass | Two `sym:AppLayoutV2`s nested, both with a left panel | design-kit Storybook | Both render; each resizes independently | F1 |
| V5 | pass | `pnpm check-types` | design-kit + canvas | Clean in both | F1, F2, F3, F4 |

---

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|----|----------|---------|----------------|--------|
| D1 | Auto-unique ids, or a required prop the caller must pass? | (a) `useId()` by default (b) required `idPrefix` (c) both | **(c)** — auto by default so no consumer has to know, `idPrefix` for anyone needing stable ids | accepted |
| D2 | Does `sym:GraphCanvasApp` need its own pass-through prop now? | (a) add it (b) defer until a consumer asks | **(b)** — F1 removes the need; adding a prop nobody sets is surface for nothing | accepted (F5 deferred) |
| D3 | Who cuts the design-kit release that unblocks F4? | (a) maintainer runs `./release.sh 0.0.23` (b) Claude proposes the release commit | **(a)** — the kit's own rule is that releases are cut deliberately, never as a side effect | accepted — maintainer cut and pushed `v0.0.23` on 2026-09-10 |

---

## 8. History

| Date | Event | Status | Note |
|------|-------|--------|------|
| 2026-09-10 | Opened after `story:…/FooterTabs` crashed at mount | proposed | Diagnosis reached via T1/T2 in the live Storybook |
| 2026-09-10 | Maintainer approved the upstream route in chat ("yes do an upstream fix"), F6 rejected in the same exchange | accepted | D1, D2 settled at the same time; D3 left open |
| 2026-09-10 | F1–F3 written in design-kit `fix/app-v2-nested-shell-panel-id-collision` (`commit:48c9096`), merged to `main` | implemented | V3, V4 passed against source-aliased design-kit Storybook |
| 2026-09-10 | Maintainer cut and pushed `v0.0.23`; all six `@invana/*` packages published to npm | landed | D3 closed; F1–F3 `landed` |
| 2026-09-10 | F4: bumped `@invana/{ui,themes,styling,forms}` to `^0.0.23` across canvas-react / canvas-ui / canvas-designer / storybook, `pnpm install` | implemented | V1, V2, V5 pass; not yet committed in this repo |
| 2026-09-10 | Noted while verifying V2: `story:canvas-ui/apps/GraphCanvasApp/MultipleApps` over-zooms each app on load. **Pre-existing** — identical in the 0.0.22 `storybook-static` build, so not caused by F1–F4. Out of scope here | — | Worth its own RFC if it matters |
