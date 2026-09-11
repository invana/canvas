---
id: fix-2026-09-11-restored-positions-are-overwritten-by-the-active-layout
type: fix
title: Restoring a snapshot loads every position, then the active layout immediately overwrites them
status: proposed
opened: 2026-09-11
decided: 2026-09-11
landed: null
packages: [pkg:@invana/graph, pkg:@invana/canvas]
design_of_record: null
relations:
  - { predicate: caused-by, object: file:packages/graph/src/canvas/GraphCanvas.ts#L70-L82 }
  - { predicate: manifests-in, object: rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state }
  - { predicate: relates-to, object: file:packages/canvas/src/io/stateExport.ts#L234 }
---

# Restored positions are overwritten by the active layout

`sym:importCanvasState` restores every node's `x`/`y` correctly. Then
`sym:GraphCanvas.wireActiveLayout` re-runs the active layout over the freshly-loaded data —
**twice, by two independent paths** — and the layout writes its own positions over them.

| | |
|---|---|
| Symptom | Restore a snapshot: selection, camera, styling and topology all come back; the nodes do not sit where they were |
| Not the cause | The round-trip. `sym:GraphStore.getNode` attaches `position` on export (`file:packages/graph/src/store/GraphStore.ts#L251-L259`) and `sym:GraphStore.installNode` writes `x`/`y` into the column store on import (`#L1405-L1409`). Positions survive the document intact |
| Cause 1 (synchronous) | `sym:importCanvasState` step 2a calls `canvas.update({ activeLayout })` → `sym:GraphCanvas.update` re-wires → `file:packages/graph/src/canvas/GraphCanvas.ts#L79` runs the layout immediately because the layer now has nodes |
| Cause 2 (a frame later) | `sym:GraphLayer.setData` emits `data:changed` with `addedNodes > 0`, and the subscription at `file:packages/graph/src/canvas/GraphCanvas.ts#L80-L82` runs the layout again |
| The hard part | The store is **frame-coalesced** (`file:packages/graph/src/store/GraphStore.ts#L1620-L1627`), so cause 2 fires on a later rAF — *after* `sym:importCanvasState` has returned. A synchronous "import in progress" flag cannot cover it (R5). The restored data must carry the signal, not the clock |
| Why it looks like "positions are ignored" | With `sym:D3ForceLayout` the nodes visibly drift to a fresh simulation; with a one-shot layout they snap once. Either way the restored coordinates are never what you end up looking at |
| Non-goal | Changing what a snapshot stores, layout scheduling in general, or whether a layout should run on ordinary data loads (it should — that is the feature this breaks) |
| Row status | rows: **proposed 3** (F1, F2, F5 — re-scoped, see §8) · **rejected 2** (F3, F4) · verification: **pending 7** (V1–V7) · decisions: **accepted 2** (D-2, D-3) · **rejected 1** (D-1) |

## 1 Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | Positions are the only part of a restore that does not hold | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | Reported after the snapshot RFC landed: "the positions are still not loading correctly onto the canvas". Selection / camera / data all restore |
| S2 | The auto-run is deliberate, documented, and guards the wrong case | `file:packages/graph/src/canvas/GraphCanvas.ts#L64-L69` | "again whenever the target's topology changes (nodes added / removed). Position-only updates (drags, the sim's own writes) don't re-trigger it, so there's no loop." The guard was written for drags — a restore changes topology *and* carries authoritative positions, which is the case it never considered |
| S3 | A restore is a full replace, so it always trips the topology test | `file:packages/graph/src/layer/GraphLayer.ts#L644-L661` | `setData` → `detachAllFromRenderer()` → `store.clear()` + `addNodesBulk(...)`. Every node counts as added |
| S4 | The layout also runs *before* any event, via the config path | `file:packages/canvas/src/io/stateExport.ts#L262-L268` + `file:packages/graph/src/canvas/GraphCanvas.ts#L54-L56,L79` | The import writes `activeLayout` into the definition; `sym:GraphCanvas.update` re-wires on any `activeLayout` in the patch, and re-wiring runs the layout unconditionally when the layer has data |

### Ruled out

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | The export drops positions | **No** | `file:packages/graph/src/store/GraphStore.ts#L251-L259` — `getNode` reads `readPosition(id)` and attaches `node.position`; `sym:GraphLayer.exportData` spreads `store.nodes()` |
| R2 | The import drops positions | **No** | `#L1405-L1409` — `installNode` seeds the column store from `node.position?.x ?? 0`. The positions are in the store; something later moves them |
| R3 | It is the camera restore | **No** | A wrong camera translates the whole scene uniformly. Here the nodes move *relative to each other* — the signature of a layout, not a transform |
| R4 | Pinning would protect them | **Partly, and it is the confirming test** | `pinned` round-trips (`#L1408`, `#L251-L259`) and `sym:D3ForceLayout` honours pins — so a snapshot of an all-pinned graph restores correctly while an unpinned one does not (T2). Useful as proof; useless as a fix, since pinning every node changes the product |
| R5 | An "importing" flag on `sym:Canvas` would fix it | **Only half** | It covers cause 1 (synchronous). Cause 2 arrives on a later rAF because the store coalesces flushes (`#L1620-L1627`), by which time any synchronous window has closed. This is the trap that makes the obvious fix wrong |
| R6 | Only `sym:D3ForceLayout` is affected because it animates | **No** | Any active layout re-runs. An iterative one drifts, a one-shot one snaps — the restored coordinates are discarded either way |
| R7 | The host can work around it by clearing `activeLayout` before importing | **Yes, but it is dressing** | It would work, and it pushes engine knowledge into every host that ever restores a snapshot. F4 records and rejects it |

## 2 Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `sym:importCanvasState` loads data first, by design | `file:packages/canvas/src/io/stateExport.ts#L248-L258` | Store now holds the restored `x`/`y`. Correct so far |
| 2 | Step 2a pushes the definition, `activeLayout` included | `#L262-L268` | `sym:GraphCanvas.update` sees `patch.activeLayout !== undefined` |
| 3 | Re-wiring runs the layout **immediately** when the layer has nodes | `file:packages/graph/src/canvas/GraphCanvas.ts#L54-L56`, `#L79` | **Cause 1.** Synchronous, inside the import call. Restored positions are overwritten before `importCanvasState` returns |
| 4 | Meanwhile `setData`'s adds sit in the store's pending buffers | `file:packages/graph/src/store/GraphStore.ts#L1620-L1627` — `flushMode 'frame'` → rAF, `'manual'` → the engine's loop | The `data:changed` for the restore has not fired yet |
| 5 | On the next flush it fires with `addedNodes = N` | `file:packages/graph/src/layer/GraphLayer.ts#L736` | **Cause 2.** `#L80-L82` runs the layout a second time, now outside any import window |
| 6 | The layout writes positions through the normal path | — | The snapshot's coordinates are gone, and nothing reports an error — the restore "worked" |

### Confirming test

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Restore with **no** `activeLayout` set | pending (browser) | If positions hold, the layout is the writer — isolates the cause from the round-trip |
| T2 | Restore a snapshot whose nodes are all `pinned` | pending (browser) | Pins survive and `sym:D3ForceLayout` honours them; positions holding here while T1's unpinned case fails confirms R4 and rules out R1/R2 from the other side |
| T3 | Log in `sym:GraphCanvas.wireActiveLayout` and in the `data:changed` handler during one restore | pending (browser) — **confirmed statically instead**: both call sites read, both reachable on the import path, and `file:packages/graph/src/store/GraphStore.ts#L1294-L1305` shows the flush (and therefore cause 2) lands after the synchronous cause 1 | Expect **two** runs — one synchronous (cause 1), one on the following frame (cause 2). Two is the prediction that separates this diagnosis from "the auto-run fires once" |

## 3 Prior art

| Doc | Relation | Status | What survives |
|---|---|---|---|
| `rfc:feat-2026-09-11-a-snapshot-stores-no-canvas-state` | manifests-in | proposed | Its V2/V6 ("positions and viewport come back") are the checks this defect fails. They stay `pending` until this lands |
| `file:packages/canvas/src/io/stateExport.ts#L248-L258` | relates-to | shipped | "Bulk data first — layouts / renderers / dependent layers can then read it." The ordering is right; what is missing is telling the layout that these positions are authoritative |
| `file:packages/graph/src/canvas/GraphCanvas.ts#L64-L69` | caused-by | shipped | The auto-run and its no-loop reasoning stay. Only the "topology changed ⇒ re-run" test gains an exception |

## 4 The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | proposed | `file:packages/graph/src/layer/GraphLayer.ts` + `file:packages/graph/src/store/GraphStore.ts` | Carry "these nodes arrived with authoritative positions" in the **flush counters** (reset per flush, like the existing ones) and surface it on the `data:changed` payload; `sym:GraphLayer.importData` sets it | Cause 2 is fixed rAF-safely — the signal rides the data, not the clock (R5) | medium — touches the store's event payload, which several behaviours read | — |
| F2 | defect | proposed | `file:packages/graph/src/canvas/GraphCanvas.ts#L70-L82` | Skip the auto-run when the flag is set — read **twice**: synchronously in `wireActiveLayout` (cause 1, where the flag is already set because `importData` ran first) and off the `data:changed` payload (cause 2) | Both causes covered, and the subscription still re-wires, so the layout stays armed for later topology changes | low — the guards fire only on a restore | F1 |
| F3 | defect | **rejected** | `file:packages/graph/src/canvas/GraphCanvas.ts#L70-L79` | Do not run on re-wire when the active layout id is **unchanged** | Would fix cause 1 — *and* change when layouts run for every consumer | **Rejected**: an unrelated cleanup bundled into a bug fix. Cause 1 is covered by F2 reading the flag synchronously, with no cross-consumer behaviour change (D-1) | — |
| F4 | dressing | **rejected** | both story hosts | Clear `activeLayout`, import, restore it afterwards | Hides the symptom in two places while every other host keeps the bug | — | R7 |
| F5 | defect | proposed | `file:packages/graph/src/canvas/GraphCanvas.ts#L64-L69` | Update the TSDoc: say that restored data is exempt and why | The next reader sees the case the original guard missed | low | F2, F3 |

## 5 Blast radius

Upstream:

| ID | Dependency | Why it matters | Risk if it moves |
|---|---|---|---|
| U1 | `sym:GraphStore` flush counters | F1 adds a field to a payload reset every flush | `file:packages/graph/src/behaviours/EdgeLODBehaviour.ts#L138`, `ContentLODBehaviour#L116`, `NodeResizeBehaviour#L187`, `CollapseExpandBehaviour#L292`, `sym:MiniMapLayer`, `sym:GraphLegendLayer` all read `data:changed`. An **additive** field leaves them untouched; renaming an existing one would not |
| U2 | `sym:Canvas.importState` ordering | F1/F2 assume data lands before the definition | If the import ever pushes the definition first, cause 1 returns in a new shape |

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| D1 | Every `sym:GraphCanvas` with an `activeLayout` | ~~Behaviour change~~ | ~~A layout no longer re-runs on `update({ activeLayout })` when the id is unchanged (F3).~~ **This is the row to scrutinise** — a host that relied on that as a "re-layout now" trigger loses it and must call `runLayout` | D-1 |
| D2 | `story:graph-layouts/*` | Storybook | Layout stories switch layouts by id, which still re-runs. Same-id re-runs are the case that changes | V5 |
| D3 | `sym:GraphLayer.importData` callers | API | Any `importData` now suppresses one auto-layout. That is the intent, and it is the only caller path a snapshot uses | — |
| D4 | `data:changed` payload | Published event | One additive field | V6 |

## 6 Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | Capture, drag three nodes far away, restore | `story:canvas-ui/view-panels/CanvasSnapshotsViewPanel` | All three snap back to the captured coordinates and **stay** (watch a full second — cause 2 lands a frame later) | F1, F2, F3 |
| V2 | pending | The same with `sym:D3ForceLayout` active and animating | browser | No drift after the restore. The sim does not restart | F1, F2 |
| V3 | pending | **Control** — load a fresh dataset with no positions | browser | The active layout still runs and positions it. The fix must not disable ordinary auto-layout | F1, F2, F3 |
| V4 | pending | **Control** — add nodes to an existing graph | browser | The layout still re-runs on topology change | F2 |
| V5 | pending | Switch the active layout by id from the settings editor | browser | The new layout runs (F3 only skips an *unchanged* id) | F3 |
| V6 | pending | `pnpm check-types && pnpm build && node scripts/check-api-surface.mjs && pnpm check-boundaries` | build gate | Clean; the `data:changed` / `flush` field is additive and no surface changes | F1, D4 |
| V7 | pending | T3's instrumentation, re-run after the fix | browser | **Zero** layout runs during a restore, where there were two | F2, F3 |

## 7 Decisions

| ID | Question | Options | Recommendation | Status |
|---|---|---|---|---|
| D-1 | Should F3 land, given it changes auto-layout for every consumer? | yes · no, fix only the import path | **No — reversed.** F2 reading the flag synchronously fixes cause 1 without changing behaviour for any consumer that never restores. Re-running on a same-id re-wire may still be wrong, but that is a separate cleanup and does not belong in a bug fix | rejected |
| D-2 | How is "authoritative positions" carried? | a flush-counter field (F1) · a one-shot flag on the layer consumed by the next `data:changed` · a `source` discriminator on the event | **The counter field** — on `sym:GraphStoreEvents.flush` + `GraphLayerEvents['data:changed']`, set by a `markPositionsAuthoritative()` on the store. Reset with the counters, so it is rAF-correct by construction | accepted |
| D-3 | Should `sym:importCanvasState` restore `activeLayout` at all, if it must not run? | yes (current) · no | **Yes** — unchanged; `sym:importCanvasState` still records `activeLayout`, it just no longer causes a run | accepted |

## 8 History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-11 | Opened | proposed | Reported: clicking a snapshot restores everything except the positions |
| 2026-09-11 | Approved | proposed | Approved whole (F4 stays rejected) |
| 2026-09-11 | F1–F3, F5 implemented | proposed | `positionsAreAuthoritative` on the flush + `data:changed` payloads; `sym:GraphCanvas` skipped the auto-run for it **and** for a same-id re-wire (F3). Build gates passed |
| 2026-09-11 | **Discarded by the maintainer** | proposed | Changes to `sym:GraphStore`, `sym:GraphLayer` and `sym:GraphCanvas` reverted, with the objection: a snapshot panel should not be fixed by editing core. Correct as to F3 — a cross-consumer change to when layouts run, bundled into a bug fix that did not need it |
| 2026-09-11 | Host-side alternative explored and dropped | proposed | Restoring with `activeLayout: null` loses part of the restored definition; writing the recorded id straight into the store afterwards leaves `sym:GraphCanvas`'s subscription detached while the definition says a layout is active — state lost one way, state corrupted the other. This is why the guard belongs in `pkg:@invana/graph` |
| 2026-09-11 | Re-scoped to F1, F2, F5 | proposed | F2 now reads the flag **synchronously** in `wireActiveLayout` as well as off the event, which covers cause 1 without F3. ~15 additive lines; no behaviour change for a canvas that never restores. **Not yet implemented — awaiting a go-ahead** |
| 2026-09-11 | Implementation note (from the discarded attempt, still applies) | proposed | The RFC had `sym:GraphLayer.importData` mark the flush **after** `setData` (whose `store.clear()` resets the counters). That is right for the default `flushMode: 'frame'` store and **wrong** for a host-supplied `'sync'` store, where `setData`'s batch flushes on exit and the mark would land on the *following* flush — suppressing an unrelated layout run. `importData` now wraps both in an outer `batch`; nested batches flush only on the outermost exit (`file:packages/graph/src/store/GraphStore.ts#L1294-L1305`), so it is correct in all three flush modes |
| 2026-09-11 | Implementation note | proposed | `sym:GraphLayer.clear` builds a `data:changed` payload by hand rather than from the counters, so it needed the new field explicitly — `false`, since a wipe restores nothing |
