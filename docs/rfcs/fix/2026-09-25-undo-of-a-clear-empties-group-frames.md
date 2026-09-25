---
id: fix-2026-09-25-undo-of-a-clear-empties-group-frames
type: fix
title: Undoing a clear (or a group delete) restores the group frames empty
status: accepted
opened: 2026-09-25
decided: 2026-09-25
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/history/GraphHistory.ts#L164-L169" }
  - { predicate: caused-by, object: "file:packages/graph/src/store/GraphStore.ts#L998-L1004" }
  - { predicate: manifests-in, object: "story:usecases/by-casestudies/global-model/GlobalModel" }
  - { predicate: verified-by, object: "file:packages/graph/tests/history/GraphHistory.test.ts" }
---

# Undoing a clear (or a group delete) restores the group frames empty

| | |
|---|---|
| **What breaks** | Clear canvas → Undo re-adds every node, but group frames come back empty and their members render as top-level nodes |
| **Root cause** | `sym:GraphStore.removeNode` clears `parentId` on a removed group's surviving children; `sym:GraphHistory` saves each node's copy only when that node is removed, so a member removed after its group is saved without `parentId`, and nothing records the membership |
| **Defect rows** | F1 |
| **Open decisions** | none |
| **Row status** | proposed 0 · accepted 0 · implemented 1 · landed 0 |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | After Clear → Undo, the four `model` frames (Deals / Twitter / NewsArticles / AirRoutes) draw at their minimum size with no members; members sit outside them | `story:usecases/by-casestudies/global-model/GlobalModel` | screenshot 2026-09-25 16:07 |
| S2 | Deleting a single group and then undoing it re-adds the group but not its membership | any `sym:GraphHistory` consumer | `file:packages/graph/tests/history/GraphHistory.test.ts` (fails before F1) |

**Ruled out**

| ID | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| R1 | Group frame bounds not recomputed after undo | rejected | The frames are the right size for groups with no members; the store has no children for them (`childrenOf('g')` is empty after undo) |
| R2 | Layout / fit sequencing | rejected | Reproduces with `GraphStore` + `GraphHistory` alone, with no layer |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Clear runs `history.transaction('clear')` → `rec.removeNode(id)` in insertion order | `file:packages/canvas-react/src/hooks/useClearGraph.ts#L55-L59` | Groups are removed first, because datasets list each group before its members (`dataset:airwaysGlobalModel`) |
| 2 | Removing a group clears `parentId` on each surviving child | `file:packages/graph/src/store/GraphStore.ts#L998-L1004` | Members are unlinked in the live store |
| 3 | The recorder saves a copy of each node just before removing it | `file:packages/graph/src/history/GraphHistory.ts#L164-L169` | Members removed after their group are saved already unlinked |
| 4 | Undo restores each copy as it was saved | `sym:GraphHistory.applyInverse` | Members come back parentless → the frames are empty (S1). Removing a group alone records no membership at all (S2) |

**Confirming test**

| Test | Action | Result | Inference |
|---|---|---|---|
| T1 | Run the new tests with `src/history` reverted | 2 fail (clear, group-only), control passes | Membership loss is in history, not the layer |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| F1 | defect | implemented | `file:packages/graph/src/history/GraphHistory.ts`, `file:packages/graph/src/history/types.ts` | The `removeNode` op records `orphanedChildIds` (from `store.childrenOf`) before removing the node; the inverse re-links them with `updateNode(child, { parentId })` via `relinkChildren`, skipping children that are gone or have a new parent | Membership survives undo regardless of removal order; redo unlinks them again through the store | low — additive optional field on the exported `HistoryOp` type; API surface unchanged | — |
| F2 | dressing | rejected | `file:packages/canvas-react/src/hooks/useClearGraph.ts` | Remove children before parents | Fixes only clear, and only when removal order happens to put children first; S2 remains | — | — |

## 5. Blast radius

Downstream:

| ID | Consumer | Kind | Impact | Action required |
|---|---|---|---|---|
| B1 | `sym:useClearGraph` / `ClearCanvasToolbar` / `GraphToolbar` / `ModellerToolbar` | UI | Undo now restores groups with their members | none |
| B2 | `sym:EraseBehaviour`, anything calling `rec.removeNode` | behaviour | Same | none |
| B3 | Serialised `HistoryOp` (in memory only, never persisted) | type | Gains an optional field | none |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | Clear → undo → redo → undo | `file:packages/graph/tests/history/GraphHistory.test.ts` | membership restored each time | F1 |
| V2 | pass | Group-only delete → undo → redo | same | re-linked, then unlinked again | F1 |
| V3 | pass | Control: member delete → undo | same | back in group (worked before) | F1 |
| V4 | pass | `@invana/graph` full vitest + tsc + build; `check-api-surface` | `pkg:@invana/graph` | 199/199, surfaces unchanged | F1 |
| V5 | pending | Manual: Clear → Undo in GlobalModel | `story:usecases/by-casestudies/global-model/GlobalModel` | frames wrap their members | F1 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-09-25 | Opened after diagnosis; maintainer said "fix it" | accepted | F1 chosen over F2 |
| 2026-09-25 | F1 implemented, V1–V4 pass | implemented | V5 (in-story check) pending |
