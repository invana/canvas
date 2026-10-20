---
id: fix-2026-10-20-a-strictmode-remount-drops-the-config
type: fix
title: An instance that registers again after the config landed gets its config back
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/canvas-react]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/canvas-react/src/useCanvasEngine.tsx#L135-L141" }
  - { predicate: manifests-in, object: "file:studio/packages/canvases/src/model/GraphModelCanvas.tsx (invana repo)" }
  - { predicate: relates-to, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

## Summary

| | |
|---|---|
| **What breaks** | Under React StrictMode every `config.layers.*`, `config.behaviours.*` (including `enabled: false`) and `config.layouts.*` is lost: brush and lasso come back armed, `hover` loses `degree`, a layout loses its options |
| **Root cause** | The root applies `config` once per `[canvas, config]`. StrictMode remounts only *newly mounted* fibers — the children — so each child unregisters and registers a fresh instance from its props, and the root's effect never runs again. Registration does not replay the stored definition |
| **Not the cause** | the engine double-create (the first engine is destroyed); `canvas.update` persistence (it writes the definition); init config (React never passes it) |
| **Defect rows** | `R1` |
| **Row status** | proposed 0 · accepted 0 · implemented 1 · landed 0 |
| **Open decisions** | none |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A host re-applies `canvas.update(config)` on ready to get its config back | Studio `GraphModelCanvas.tsx:283-285` | comment at 277-282: collapse-expand, hover degree, text-lod band lost |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | Children render only once `canvas` is set | `sym:GraphCanvas` | every wrapper mounts in the commit after `setCanvas` |
| 2 | Each child's effect creates and registers its instance from props | `file:packages/canvas-react/src/behaviours/useBehaviourRegistration.ts#L34-L48`, `file:packages/canvas-react/src/layers/GraphLayer.tsx#L40-L53` | instance set 1, defaults |
| 3 | The root's effect runs next and applies `config` | `file:packages/canvas-react/src/useCanvasEngine.tsx#L135-L141` | set 1 configured; definition holds it |
| 4 | StrictMode re-runs effects of the newly mounted children only | React strict effects | set 1 destroyed; set 2 built from props and wrapper `enabled` |
| 5 | The root is not newly mounted; its deps are unchanged | same | set 2 never configured |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| R1 | defect | implemented | `file:packages/canvas-react/src/useCanvasEngine.tsx` | on `scene:layer:add` · `scene:behaviour:register` · `scene:layout:add`, a microtask later, `update()` the instance with its definition slice | a re-registered instance (StrictMode, a `key` change) gets its config and its edits back | a re-added layout's options re-apply, which may re-run it once | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pending | `pnpm check-types`, `pnpm build` | canvas-react | clean | R1 |
| V2 | pass | delete the host workaround, open the model board under StrictMode (Studio runs in it) | Studio Modeller | the board draws and frames as before | R1 |
| V3 | pending | control: a board with no config | `story:canvas-ui/apps/GraphCanvasApp/RightInspector` | unchanged | R1 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from P0 of `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story`; R1 written | implemented | — |
| 2026-10-20 | Studio workarounds deleted; verified live in Studio | implemented | lands when merged to `main` |
