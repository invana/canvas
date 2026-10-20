---
id: fix-2026-10-20-an-unanimated-layout-draws-nothing
type: fix
title: A node placed while the placement gate is closed is drawn when the gate opens
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/store/GraphStore.ts#L1108-L1115" }
  - { predicate: manifests-in, object: "file:studio/packages/explorer/src/ExplorerCanvas.tsx (invana repo)" }
  - { predicate: relates-to, object: rfc:fix-2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs }
  - { predicate: relates-to, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

## Summary

| | |
|---|---|
| **What breaks** | After a board's first un-animated layout (d3-force `animate: false`, a snapping ELK run) the viewport is empty while the store and the minimap hold the graph. Hosts call `layer.redraw()` on `layout:run:end` (Studio ×3) |
| **Root cause** | Shapes install **hidden** while the gate is closed. The layout places every node (setting `FLAG_PLACED`) and ends in the same beat; lifting the gate announces visibility only for nodes **still unplaced**, and a position update only moves a shape. No event re-publishes `visible` |
| **Not the cause** | a missing install (shapes exist, hidden); the auto-fit |
| **Defect rows** | `G1` |
| **Row status** | proposed 0 · accepted 0 · implemented 1 · landed 0 |
| **Open decisions** | none |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | an `activeLayout` that has not run closes the gate | `file:packages/graph/src/layer/GraphLayer.ts#L429-L462` | unplaced nodes are not visible |
| 2 | data flushes; `installNodeShape` publishes `visible: false` | `GraphLayer.ts#L517-L530` | shapes installed hidden |
| 3 | the solve calls `setPositionsBulk`: `FLAG_PLACED` set, `node:update {position}` queued | `GraphStore.ts#L871-L895` | every node now has a position |
| 4 | `end` lifts the gate; `setPlacementPending(false)` skips placed nodes | `GraphStore.ts#L1108-L1115` | no `node:visibility` |
| 5 | the queued update takes the position-only path (`moveShape`) | `GraphLayer.ts#L2731-L2740` | shapes move, stay hidden |

Timing-dependent: only when the data flush precedes the solve and the solve beats the 1.2 s grace — fast static solves, first run only.

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| G1 | defect | implemented | `sym:GraphStore.setPosition`, `sym:GraphStore.setPositionsBulk` | a node's **first** placement while the gate is closed queues a derived `node:visibility` (also on silent writes) | the layer re-renders it visible | none: derived events do not touch the counters that re-run the layout | — |
| G2 | dressing | rejected | hosts | `redraw()` on `layout:run:end` | — | — | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `vitest tests/store` (two new cases: placed-then-lifted announces; a second placement does not) | graph | 134 green | G1 |
| V2 | pass | delete Studio's redraw-on-settle ×3; run a query; open the model board (Studio e2e ME25, a pixel check of the viewport) | Explorer, Modeller, plans | the graph draws | G1 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from P0 of `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story`; G1 written | implemented | — |
| 2026-10-20 | Studio workarounds deleted; verified live in Studio | implemented | lands when merged to `main` |
