---
id: fix-2026-10-20-a-theme-change-wipes-frame-colours
type: fix
title: A theme change keeps an authored group-frame colour
status: accepted
opened: 2026-10-20
decided: 2026-10-20
landed: null
packages: [pkg:@invana/graph]
design_of_record: null
relations:
  - { predicate: caused-by, object: "file:packages/graph/src/layer/GraphLayer.ts#L739-L747" }
  - { predicate: manifests-in, object: "file:studio/packages/canvases/src/model/GraphModelCanvas.tsx (invana repo)" }
  - { predicate: relates-to, object: rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story }
---

## Summary

| | |
|---|---|
| **What breaks** | On every `theme:change` (and at mount) a group frame's authored `bgFill` / `bgStrokeColor` is replaced by the theme's `cardBg` / `divider`; the frame renders white and the theme colour is written into the node's data |
| **Root cause** | `applyTheme` writes `{ ...node.style, ...groupPatch }` into each group node's own `style`, the highest non-state precedence, theme last |
| **Not the cause** | type templates (recompiled from the palette, below `node.style`); `redraw`; collapse or state overlays |
| **Defect rows** | `T1` · `T2` — the theme's node and edge colours also wrote over the layer template |
| **Row status** | proposed 0 · accepted 0 · implemented 2 · landed 0 |
| **Open decisions** | none |

## 1. Symptom

| ID | Observation | Where | Evidence |
|---|---|---|---|
| S1 | A host re-paints frame hues on `theme:change` | Studio `GraphModelCanvas.tsx:301-311` | the `rehue` listener |

## 2. Diagnosis

| Step | Mechanism | Evidence | Consequence |
|---|---|---|---|
| 1 | `theme:change` and the initial adopt call `applyTheme` | `file:packages/graph/src/layer/GraphLayer.ts#L687-L690` | every switch, and mount |
| 2 | `paletteToGroupStyle` maps `cardBg` → `bgFill`, `divider` → `bgStrokeColor` | `file:packages/graph/src/theme/roles.ts#L57-L62` | concrete colours |
| 3 | written into the node's own `style`, theme spread last | `GraphLayer.ts#L739-L747` (before) | the author's hue is gone from the data |
| 4 | per-node `style` beats template and type binding | `sym:GraphLayer.resolveNodeStyle` | the frame renders the theme's colour |

## 4. The fix

| ID | Kind | Status | File/target | Change | Effect | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| T1 | defect | implemented | `sym:GraphLayer.applyTheme`, `sym:GraphLayer.resolveNodeStyle` | keep the frame patch on the layer; resolve it above the layer template, below the type binding and the node's `style`, for a node that is a group | an authored frame colour survives; a frame without one follows the theme; nothing is written into data | how themed group stories look — never low | — |
| T2 | defect | implemented | `sym:GraphLayer.setNodeDefaults` / `setEdgeDefaults` from `applyTheme` | keep the theme's node/edge defaults in their own fields, under the layer template | an explicit template `labelColor` / `strokeColor` survives a theme switch | a config that relied on the theme overriding it stops following the theme | — |

## 6. Verification

| ID | Status | Check | Target | Expected | Covers |
|---|---|---|---|---|---|
| V1 | pass | `pnpm check-types`, `pnpm test` | graph | clean (392) | T1, T2 |
| V2 | pass | delete the host `rehue`, switch light → dark | Studio Modeller all-models board | frames keep their hues | T1 |
| V3 | pending | control: groups with no authored colour, switch theme | `story:graph/Groups/GroupWithEdges` | frames follow the theme | T1 |

## 8. History

| Date | Event | Status | Note |
|---|---|---|---|
| 2026-10-20 | Opened from P0 of `rfc:feat-2026-10-20-a-host-rebuilds-the-board-from-a-story`; T1 written, T2 proposed | implemented | — |
| 2026-10-20 | Studio workarounds deleted; verified live in Studio | implemented | lands when merged to `main` |
| 2026-10-20 | T2 written: `GraphBoard` colours edges per type, which every theme switch would have wiped | implemented | theme colours resolve under the template |
