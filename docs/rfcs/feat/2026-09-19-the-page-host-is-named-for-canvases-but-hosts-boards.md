---
id: feat-2026-09-19-the-page-host-is-named-for-canvases-but-hosts-boards
type: feat
title: The page host is named for canvases but hosts boards
status: proposed
opened: 2026-09-19
decided: null
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: file:packages/canvas-ui/src/view-panels/canvas-pages/CanvasPagesViewPanel.tsx }
---

# The page host is named for canvases but hosts boards

| | |
|---|---|
| **What's missing** | A name for the tab strip that is true of everything it hosts. `sym:CanvasPagesViewPanel` hosts *pages*, and a page is no longer always a canvas — a consumer now mounts dashboards in it, which have no camera, no layers and no drawing. |
| **Approach** | Rename the panel and its four types to `Board*`, move the folder to `view-panels/board-pages`, and keep the old names as deprecated aliases so no consumer breaks on upgrade. |
| **Why now** | The panel's own module header already calls them *"independent pages (boards)"* (`file:packages/canvas-ui/src/index.ts#L851`). The word was chosen inside the file and never reached the export. |
| **Not in scope** | `pkg:@invana/canvas`, `pkg:@invana/graph` and every drawing surface keep the word **canvas**. This RFC renames one host, not the renderer. |
| **Open decisions** | `D-1` how long the aliases live |
| **Row status** | proposed 0 · accepted 0 · implemented 5 · landed 0 |

---

## 1. Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| M1 | The panel hosts pages that are not canvases | `file:packages/canvas-ui/src/view-panels/canvas-pages/CanvasPagesViewPanel.tsx` | It is presentational and engine-agnostic by design — it takes `content: ReactNode` and knows nothing about a canvas |
| M2 | The intended word is already in the file | `file:packages/canvas-ui/src/index.ts#L851` | *"A tab strip over independent 'pages' (boards)"* |
| M3 | A consumer now mounts non-canvas pages in it | Invana Studio | A run dashboard is a page in this strip: panels bound to one record, no camera, no layers |
| M4 | The name mis-sells the contract | `sym:CanvasPagesViewPanelProps` | A reader reasonably expects a canvas per page, and `keepMounted` reads as "keep the engine alive" rather than "keep the page mounted" |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | A second panel for declared pages | rejected | Two strips that draw the same tabs and differ only in what is inside them — the strip is the thing that is shared |
| R2 | Leave it; the name is historical | rejected | It is a public export; a consumer reads the name before the module header |

## 2. Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| D1 | Folder `canvas-pages` → `board-pages` | one move, index re-pointed | Import paths inside the package change; the public entry does not |
| D2 | `sym:CanvasPagesViewPanel` → `sym:BoardPagesViewPanel` | rename + re-export | The name matches what the component accepts |
| D3 | `CanvasPage` · `CanvasPageMenuItem` · `CanvasHeaderAction` · `CanvasPagesViewPanelProps` → `Board*` | rename + type aliases | A consumer's `CanvasPage[]` keeps compiling |
| D4 | Old names re-exported as `@deprecated` aliases | `export { BoardPagesViewPanel as CanvasPagesViewPanel }` | Upgrading is a no-op; adopting is a rename at the consumer's pace |

## 3. Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/rfcs/README.md` | relates-to | current | The RFC-first rule this document follows |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | dressing | implemented | `file:packages/canvas-ui/src/view-panels/canvas-pages` | Move to `board-pages`, rename the component file | Path matches the export | none — internal path | — |
| F2 | dressing | implemented | `sym:CanvasPagesViewPanel` | Rename to `sym:BoardPagesViewPanel` | The public name is true | breaking without F4 | F1 |
| F3 | dressing | implemented | The four exported types | Rename to `Board*` | ditto | breaking without F4 | F1 |
| F4 | dressing | implemented | `file:packages/canvas-ui/src/index.ts` | Re-export every old name as a deprecated alias | No consumer breaks on upgrade | alias drift if never removed — `D-1` | F2, F3 |
| F5 | dressing | implemented | Stories referencing the old names | Point at the new ones | The book shows the current API | none | F2, F3 |

## 5. Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `pkg:@invana/ui` | The strip composes its primitives | none — untouched |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| X1 | Invana Studio | app | Imports `CanvasPagesViewPanel` + `CanvasPage` in its graph-detail page host | None on upgrade (F4). Adopt the new names when it next touches the host |
| X2 | `app:storybook` | in-repo | Stories name the panel | F5 |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types` | repo | green — 19/19 tasks | F1, F2, F3 |
| V2 | pass | `pnpm --filter @invana/canvas-ui build` | `pkg:@invana/canvas-ui` | green — ESM + DTS | F1–F4 |
| V3 | pass | A file importing only the **old** names still typechecks | `pkg:@invana/canvas-ui` | green — this is the control. Run as a scratch module, then removed | F4 |
| V4 | pass | `pnpm check-boundaries` + `pnpm check-api-surface` | repo | unchanged | F1 |

## 7. Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | How long do the aliases live? | (a) until the next minor, (b) until every known consumer has moved, (c) forever | **(b)** — there is one external consumer and it is in the same hands; drop them once Studio has adopted the new names, in a release that says so | open |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-19 | Opened | proposed | Raised while renaming the saved record from *canvas* to *board* in Invana Studio; the host was the one canvas-ui export the rename genuinely reached |
| 2026-09-19 | F1–F5 written, V1–V4 green | implemented | Not committed and not released. Studio keeps compiling on the published package through the F4 aliases; it adopts the new names once a release carries them |
