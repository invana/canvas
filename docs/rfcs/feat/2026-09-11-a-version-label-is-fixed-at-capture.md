---
id: feat-2026-09-11-a-version-label-is-fixed-at-capture
type: feat
title: A captured version's label is fixed at capture — the timeline can show a name but never change one
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/canvas-ui]
design_of_record: null
relations:
  - { predicate: relates-to, object: doc:docs/ui-consolidation-plan.md }
  - { predicate: relates-to, object: rfc:feat-2026-09-11-nothing-lists-what-is-selected }
---

# A version label is fixed at capture

Add an **inline rename** to `sym:CanvasSnapshotsViewPanel`: click a row's title, it becomes a
text field in place; **Enter** or blur commits, **Escape** cancels. The panel stays
presentational — it emits `onRename(id, label)` and keeps rendering `version.label` from props,
so the host (Invana's `canvas_versions`) remains the owner of the value.

| | |
|---|---|
| Gap | `sym:CanvasSnapshot.label` is render-only. `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L160` reads `version.label \|\| untitledLabel` into a `<span>`; no prop on `sym:CanvasSnapshotsViewPanelProps` can change it |
| Consequence | A capture made by a host that names rows automatically ("Manual capture", "Canvas version") keeps that name forever. The one field that makes an old version findable is the one field the user cannot write |
| Shape | Opt-in, like `onCapture`: pass `onRename` and titles become editable; omit it and the panel is byte-for-byte what it is today |
| Ownership | Unchanged — the panel holds only the **edit draft** (the in-flight string) in local state. The committed value arrives back as a new `versions` prop, exactly as `onRestore` / `onCapture` already work |
| Non-goal | Editing `summary` / `by` / `capturedAt`, a rename dialog, optimistic display of an uncommitted name, version deletion, and a Storybook story (rule 11 — D-4) |
| Row status | rows: **implemented 6** (F1–F6) · **rejected 1** (F7) · **implemented 1** (F8) · verification: **pass 3** (V1, V7, V9) · **pending 5** (V2–V6 — browser checks the implementing session can't run) · **skipped 1** (V8) · decisions: **accepted 5** (D-1 … D-5, D-4 reversed) |

## 1 Motivation

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | The title is read-only markup | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L158-L166` | `const title = version.label \|\| untitledLabel;` → `<span className="min-w-0 flex-1 truncate">` — no handler, no control |
| S2 | The props expose every other version verb but naming | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L52-L84` | `onRestore` (required), `onCapture` (optional), `renderThumbnail` (slot) — the surface's own doc says "renders what it is given and calls back", and rename is the missing callback |
| S3 | Host-generated names are the common case, so most rows land with a name nobody chose | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L77` | `untitledLabel = 'Canvas version'` is the fallback; Invana's manual captures land as "Manual capture". Both are correct at capture time and useless a week later |
| S4 | The sibling panel solved the same verb with a **menu**, not inline editing | `file:packages/canvas-ui/src/view-panels/canvas-pages/CanvasPagesViewPanel.tsx#L3,L61` | `sym:CanvasPagesViewPanel` takes host-supplied `CanvasPageMenuItem`s ("rename / duplicate / remove") behind a caret — i.e. the package has a rename *affordance* precedent, but it delegates the whole interaction to the host |
| S5 | Rename is the cheapest thing a timeline can offer, and the row already reserves the space for it | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L168-L189` | The title row is `flex items-center gap-2` with a `flex-1` title, a badge and a time — a field can take the `flex-1` slot with no layout change |

| S6 | An opt-in gate with no opted-in host is indistinguishable from an unimplemented feature | `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L1038-L1044`, `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L215-L222` | Observed after F1–F6 landed: neither host passed `onRename`, so every title fell to the plain-`<span>` branch and no pencil appeared anywhere. Recorded because the same trap waits for the next opt-in prop |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Copy `sym:CanvasPagesViewPanel`'s pattern — let the host pass a "Rename…" menu item (S4) | **No** | That pushes the whole editing UI to every host, and each host invents a different prompt/dialog. The ask is an *inline* flow, and inline editing is presentation — which is what this package is for |
| R2 | Make the panel controlled on the label (`label` + `onLabelChange` per keystroke) | **No** | Every keystroke would round-trip through the host's persistence. The committed-value-on-Enter shape keeps the draft local and the host writes once (G3) |
| R3 | The panel can keep the renamed label itself and stop re-reading props | **No** | It would become the second owner of a host record; a failed save or a concurrent edit would leave the panel showing a name that does not exist. The panel re-renders `version.label` and the host decides (G4) |
| R4 | `@invana/ui` exports an `Input` to use | **No** | Its `.d.ts` export list has `CommandInput` / `SearchInput` / `SidebarInput` and no plain `Input`. `sym:PropertiesEditor` already hit this and documented it (`file:packages/canvas-ui/src/components/PropertiesEditor.tsx#L62-L66`) — a styled native `<input>` is the house answer (D-2) |
| R5 | A double-click is the safer trigger | **Partly — single-click is safe here** | The row has no other click target: `file:…/CanvasSnapshotsViewPanel.tsx#L146-L194` has no row-level `onClick`, only the restore `Button`. Single-click matches the ask ("click on the text"); D-1 records it |
| R6 | The **Current** row should not be renameable | **No** | `currentVersionId` only suppresses *restore* (restoring what you are looking at is a no-op). Naming the version you just captured is the single most likely rename |

## 2 Design

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| G1 | One new optional prop: `onRename?: (id: string, label: string) => void`, plus `isRenaming?: boolean` for the in-flight case | Mirrors the existing `onCapture` + `isCapturing` pair (`file:…/CanvasSnapshotsViewPanel.tsx#L62-L67`) | Omit `onRename` and nothing changes — the title renders as the plain `<span>` it is today |
| G2 | `sym:SnapshotRow` gains a local `draft: string \| null`. `null` = reading, a string = editing. Entering edit seeds it from `version.label ?? ''` (**not** from `untitledLabel` — the user edits the real value, not the placeholder) | `file:…/CanvasSnapshotsViewPanel.tsx#L160` | The field never opens pre-filled with "Canvas version", which would then be saved as a real label |
| G3 | Commit on **Enter** and on **blur**; cancel on **Escape**. Commit calls `onRename(id, trimmed)` only when `trimmed !== (version.label ?? '')`, then clears the draft | Standard inline-edit contract; the no-op guard keeps a click-away from writing | The host writes once per actual change, never per keystroke (R2) |
| G4 | The committed value is **not** held locally — the draft clears and the row falls back to `version.label` from props | R3 | A rejected save shows the old name (correct), a successful one shows the new name when the host's list updates |
| G5 | A **blank** commit means "clear the label": `onRename(id, '')`, and the row falls back to `untitledLabel` | Symmetry with `label?: string` being optional | A user can undo a bad name without inventing one. D-3 asks whether blank should instead cancel |
| G6 | The read-mode title becomes a `@invana/ui` `Button variant="ghost"` sized flat (`h-auto justify-start px-1 py-0 font-normal`) so it looks like text, is keyboard-reachable, and adds no raw `<button>` | root rule 13 + `file:packages/canvas-ui/CLAUDE.md#L105-L107` (no hand-rolled CSS, design-kit chrome) | Tab reaches it; Enter/Space opens the field. Hover gets the ghost tint, which is the discoverability cue |
| G7 | The edit-mode control is a styled native `<input>` with the `INPUT_CLASS` token string, `autoFocus`, `aria-label` = "Rename version" | R4, `file:packages/canvas-ui/src/components/PropertiesEditor.tsx#L47-L48` | Same look as the package's other text fields; no new dependency, no inline `style` |
| G8 | While `isRenaming` is true the field is `disabled` but stays mounted with its draft | Matches `isCapturing` disabling the capture button | A slow save cannot silently drop what was typed |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | `grep -n "onRename\|onLabel\|contentEditable" packages/canvas-ui/src` | no matches | No inline-rename precedent anywhere in the package — this is new surface, not a duplicate |
| T2 | `grep -E "declare const Input\b" @invana/ui/dist/index.d.ts` | no match; only `SearchInput` / `CommandInput` / `SidebarInput` | R4 confirmed against the resolved build (`@invana/ui@0.0.23`) |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `doc:docs/ui-consolidation-plan.md` | relates-to | active | `view-panels/` is the home for presentational dockable surfaces — this change adds no store coupling, so the panel stays in the presentational tier |
| `file:packages/canvas-ui/CLAUDE.md#L42-L50` | relates-to | active | `*ViewPanel` = "props in → JSX". The rename prop keeps that contract: callback out, value in |
| `sym:CanvasPagesViewPanel` | relates-to | shipped | The host-supplied-menu pattern for row verbs. Kept as-is for pages; not adopted here (R1) |
| `sym:PropertiesEditor` | relates-to | shipped | The styled-native-`<input>` decision and its written justification (R4/G7) |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx` | Add `onRename?: (id, label) => void` + `isRenaming?: boolean` to `sym:CanvasSnapshotsViewPanelProps`, with TSDoc stating the host owns the value | The verb exists on the public surface | low — additive optional props | — |
| F2 | defect | implemented | same, `sym:SnapshotRow` | Add `draft` state + `beginEdit` / `commit` / `cancel`, per G2–G5 | The inline flow | low | F1 |
| F3 | defect | implemented | same, `sym:SnapshotRow` read mode | Title renders as a flat ghost `Button` when `onRename` is given, `<span>` otherwise (G6) | Clickable + keyboard-reachable title, unchanged when the prop is absent | low | F2 |
| F4 | defect | implemented | same, `sym:SnapshotRow` edit mode | Styled native `<input>` (G7) with `onKeyDown` Enter/Escape, `onBlur` commit, `disabled={isRenaming}` | The field | low | F2 |
| F5 | dressing | implemented | same | A hover-only pencil affordance (`lucide-react` `Pencil`, `opacity-0 group-hover:opacity-100`) next to the title | Discoverability — clicking text is invisible without a cue | low — purely additive; **not** the fix, and droppable on its own (D-5) | F3 |
| F6 | defect | implemented | `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx#L1-L21` | Extend the file header: the panel now *emits* a rename and still owns no version value | The module doc keeps matching the module | low | F1 |
| F8 | defect | implemented | `file:apps/storybook/stories/canvas-ui/view-panels/CanvasSnapshotsViewPanel.stories.tsx#L215`, `file:apps/storybook/stories/canvas-ui/apps/AppLayoutV2.stories.tsx#L1038` | Both hosts pass `onRename`, mapping the committed string onto their own version list; `label \|\| undefined` so a blank commit clears it (G5) | The feature is reachable and demoable | low — story-only, additive | F1 |
| F7 | defect | **rejected** | `file:packages/canvas-ui/src/shared/` (new `field.ts`) | Move `INPUT_CLASS` out of `sym:PropertiesEditor` into `shared/`, import it in both | One token string for text fields instead of two copies | **not low** — touches a shipped component's rendering. **Rejected** (D-2): the only row touching shipped rendering, to dedupe one token string. `sym:RENAME_INPUT_CLASS` is local to the panel; extract when a third text field appears | F4 |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `@invana/ui` `Button` ghost variant | F3 relies on it accepting flat sizing via `className` | A future variant that hard-codes height would make the title read as a button, not text — visual only |
| U2 | `@invana/ui` still exporting no `Input` (R4) | If one appears, F4/F7 should switch to it | None today; recorded so the next reader re-checks |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Storybook host | Wired by F8 — titles are now editable there | Done |
| D6 | `story:canvas-ui/apps/AppLayoutV2` | Storybook host | Wired by F8, per board — the rename maps over `versions[activeBoard.id]` only, so one board's rename cannot touch another's rows | Done |
| D2 | Invana app (`canvas_versions`) — out of repo | Published API | Additive optional prop; today's call sites are unaffected. Gains the ability to persist a rename | Opt in when the host adds an update mutation |
| D3 | `pnpm check-api-surface` / `api/@invana/canvas-ui.surface.txt` | Build gate | The barrel's **export names** are unchanged (`CanvasVersionsViewPanel`, `CanvasVersionsViewPanelProps` already exported) — a new prop is a member, not an export | None expected; V7 proves it |
| D4 | `sym:PropertiesEditor` | Sibling component | Only if F7 lands — its `INPUT_CLASS` becomes an import | Re-check its four fields render unchanged (V6) |
| D5 | Serialised state | — | None. A version is a host record; nothing here touches `CanvasView` or any store | — |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | **pass** | `pnpm --filter @invana/canvas-ui check-types` | build | clean | F1–F6 |
| V2 | pending | **Control** — render the panel with no `onRename` | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Titles are plain text, not focusable, not clickable; rows, day headings, thumbnails and restore unchanged | F1, F3 |
| V3 | pending | Click a title with `onRename` supplied | browser | Field opens in place, pre-filled with the row's own label (not `untitledLabel`), row height unchanged | F2, F3, G2 |
| V4 | pending | Type a new name, press Enter | browser | `onRename(id, 'new name')` fires exactly once; field closes | F2, F4 |
| V5 | pending | Press Escape mid-edit, then click away mid-edit | browser | Escape fires nothing and restores the old title; blur with an unchanged value fires nothing (G3) | F2, F4 |
| V6 | pending | Rename the row marked **Current**; and commit a blank value | browser | Current row renames (R6); blank commits `''` and the row falls back to `untitledLabel` (G5) | F2, G5 |
| V7 | **pass** | `pnpm --filter @invana/canvas-ui build && node scripts/check-api-surface.mjs` | build gate | No surface diff | D3 |
| V9 | **pass** | `pnpm --filter @canvas/storybook check-types` | build | clean | F8 |
| V8 | **skipped** | Open `sym:PropertiesEditor` (inspector) after F7 | browser | — | F7 rejected, so `sym:PropertiesEditor` is untouched |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Trigger: single click or double click on the title? | single · double · pencil-only | **Single click** — nothing else in the row consumes a click (R5), and it is what was asked for | accepted |
| D-2 | Where does `INPUT_CLASS` live? | duplicate a local const in the panel · extract to `shared/field.ts` (F7) | **Inline the local const; F7 rejected** — recommendation reversed before implementing: F7 was the only row touching shipped rendering, and it bought deduplicating one string. Extract at the third call site | accepted |
| D-3 | What does committing a blank name mean? | clear the label (G5) · treat as cancel | **Clear it** — `label` is optional and `untitledLabel` is the designed fallback | accepted |
| D-4 | Wire the rename into the Storybook host so it is demoable? | no (rule 11) · yes, on explicit ask | **Reversed on explicit ask** — with no host passing `onRename`, the opt-in gate meant the feature was invisible everywhere it could be seen (S6). Both story hosts now wire it (F8) | accepted |
| D-5 | Ship the hover pencil (F5)? | yes · no | **Yes** — an editable title with no affordance is undiscoverable; it is marked `dressing` so it can be dropped alone | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Asked for: click the title of a captured version and edit it inline |
| 2026-09-11 | Decisions settled | proposed | D-1 … D-5 accepted as recommended, except **D-2 reversed**: F7 rejected, `INPUT_CLASS` stays duplicated as a panel-local `sym:RENAME_INPUT_CLASS` rather than touching `sym:PropertiesEditor` |
| 2026-09-11 | F1–F6 implemented | proposed | One file: `file:packages/canvas-ui/src/view-panels/canvas-snapshots/CanvasSnapshotsViewPanel.tsx`. V1 + V7 pass. V2–V6 are browser checks and stay `pending` — the rows are `implemented`, not `landed` |
| 2026-09-11 | Reported invisible | proposed | No pencil on hover over "Manual capture" — diagnosed as S6: rename is gated on `onRename` and no host passed it. Panel code correct; D-4 was the wrong call |
| 2026-09-11 | D-4 reversed, F8 implemented | proposed | Both story hosts wire `onRename` on explicit ask. V9 pass |
| 2026-09-11 | Implementation note | proposed | The read-mode ghost `Button` needed `h-auto … py-0 font-normal` *and* an inner `truncate` span: the flat sizing is on the button, the ellipsis has to be on the text node inside it. The row root gained `group` so F5's pencil can hover-reveal |

> **Renamed 2026-09-11** — `Version` → `Snapshot` across this surface (`sym:CanvasSnapshotsViewPanel`, `sym:CanvasSnapshot`, `file:packages/canvas-ui/src/view-panels/canvas-snapshots/`). The `sym:`/`file:` references above were updated mechanically; the prose, title and slug are unchanged, so "version" in the narrative means what is now called a snapshot.
