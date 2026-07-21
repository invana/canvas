# Storybook namespace migration — `canvas-react/` slim-down plan

> **Status: executed (2026-07-21).** All 22 stories moved via `git mv`, titles
> rewritten, `pnpm --filter @canvas/storybook check-types` passes. Three as-built
> notes: (1) the 4 `usecases/` stories title as **`Usecases/…`** (capital U) to
> merge with the existing usecases sidebar node, not `usecases/`. (2) The 2 export
> stories were relocated **as-is (D-ii)** — they still import `@invana/canvas-ui`
> chrome to trigger the export, so re-authoring them to demo the capability
> directly (**D-i**) remains a recommended follow-up. (3) `GraphReseed` was
> subsequently **deleted** (not kept). (4) `Canvas` and `GraphCanvas` were each
> **split into a one-story-per-file folder** (`Canvas/WithTelemetry` +
> `Canvas/WithoutTelemetry`; same for `GraphCanvas/`) to honour the
> one-story-per-file rule — so `canvas-react/` holds two component folders, not two
> flat files. Each story file is **fully self-contained** (data + tree inline, no
> shared helper) so the "Show code"/source reader sees the complete implementation.

**Goal.** The `canvas-react/` Storybook namespace currently mixes true headless
bindings with stories whose real subject is the **UI kit** (`@invana/canvas-ui`),
cross-package **demo apps**, or an engine **capability** (image / state export).
Per the storybook rule — *a story's top-level namespace = the package that owns
the code it demos* (`apps/storybook/CLAUDE.md`) — most of these are mis-filed.

After this migration `canvas-react/` keeps **only the 3 stories that demo its own
exports** (`<Canvas>`, `<GraphCanvas>`, and the `<Canvas>`-based reseed demo).
The other 22 move: everything that draws UI → `canvas-ui/`, cross-package demo
apps → `usecases/`, and the two export stories → the package that owns the
capability.

> **Mechanics.** Storybook auto-discovers via `../stories/**/*.stories.@(...)`
> (`.storybook/main.ts`), so **moving a file needs no config change** — but the
> in-file `title:` string **must** be rewritten to mirror the new folder path
> exactly (title === path). No `package.json`/dep changes: `@canvas/storybook`
> already depends on every publishable package.

---

## Decisions (locked)

1. **GraphCanvasApp stories → all move to `canvas-ui/`.** `GraphCanvasApp` lives
   in `@invana/canvas-ui`; strict ownership wins over "it's a root". `canvas-react/`
   keeps only the raw `<Canvas>` / `<GraphCanvas>` roots.
2. **Cross-package demo apps → top-level `usecases/`** (matches the existing
   `usecases/` namespace for demos belonging to no single package).
3. **Export → split by capability.** `ExportImage → canvas/` (renderer capability),
   `ExportState → canvas-store/` (kernel capability).
4. **Layout-comparison stories → `canvas-ui/layouts/`.** Originally slated to stay
   (assumed headless), but they render `<StreamingDemo>` from `streaming-demo.tsx`,
   which imports `@invana/canvas-ui` + `@invana/ui` — so they file by what they
   render. The shared `streaming-demo.tsx` helper moves out of `canvas-react/` with
   them (to `stories/canvas-ui/`).

---

## Full migration table (25 stories)

### A. Stay in `canvas-react/` (2) — demo canvas-react's own exports; no `@invana/canvas-ui`

Only stories whose **subject is canvas-react itself** stay. (The `layouts/*` pair
was a false positive — it renders a canvas-ui streaming demo; see group B.
`GraphReseed` was deleted post-migration.)

| File | Title (unchanged) | Why it stays |
|---|---|---|
| `canvas-react/Canvas.stories.tsx` | `canvas-react/Canvas` | demos `<Canvas>` — canvas-react's own export |
| `canvas-react/GraphCanvas.stories.tsx` | `canvas-react/GraphCanvas` | demos `<GraphCanvas>` — canvas-react's own export |

### B. Move to `canvas-ui/` (16) — import `@invana/canvas-ui`; the UI kit is the subject

| From | To (new path) | New `title:` |
|---|---|---|
| `canvas-react/graph-canvas-app/Default.stories.tsx` | `canvas-ui/graph-canvas-app/Default.stories.tsx` | `canvas-ui/graph-canvas-app/Default` |
| `canvas-react/graph-canvas-app/NoChrome.stories.tsx` | `canvas-ui/graph-canvas-app/NoChrome.stories.tsx` | `canvas-ui/graph-canvas-app/NoChrome` |
| `canvas-react/graph-canvas-app/SideRegions.stories.tsx` | `canvas-ui/graph-canvas-app/SideRegions.stories.tsx` | `canvas-ui/graph-canvas-app/SideRegions` |
| `canvas-react/graph-canvas-app/RightInspector.stories.tsx` | `canvas-ui/graph-canvas-app/RightInspector.stories.tsx` | `canvas-ui/graph-canvas-app/RightInspector` |
| `canvas-react/graph-canvas-app/BottomTable.stories.tsx` | `canvas-ui/graph-canvas-app/BottomTable.stories.tsx` | `canvas-ui/graph-canvas-app/BottomTable` |
| `canvas-react/graph-canvas-app/EmbeddedWidget.stories.tsx` | `canvas-ui/graph-canvas-app/EmbeddedWidget.stories.tsx` | `canvas-ui/graph-canvas-app/EmbeddedWidget` |
| `canvas-react/graph-canvas-app/FullFeatured.stories.tsx` | `canvas-ui/graph-canvas-app/FullFeatured.stories.tsx` | `canvas-ui/graph-canvas-app/FullFeatured` |
| `canvas-react/graph-canvas-app/MultipleApps.stories.tsx` | `canvas-ui/graph-canvas-app/MultipleApps.stories.tsx` | `canvas-ui/graph-canvas-app/MultipleApps` |
| `canvas-react/graph-canvas-app/CanvasBoards.stories.tsx` | `canvas-ui/graph-canvas-app/CanvasBoards.stories.tsx` | `canvas-ui/graph-canvas-app/CanvasBoards` |
| `canvas-react/graph-canvas-app/CustomComposition.stories.tsx` | `canvas-ui/graph-canvas-app/CustomComposition.stories.tsx` | `canvas-ui/graph-canvas-app/CustomComposition` |
| `canvas-react/behaviours/HoverElementPreview.stories.tsx` | `canvas-ui/behaviours/HoverElementPreview.stories.tsx` | `canvas-ui/behaviours/HoverElementPreview` |
| `canvas-react/behaviours/HoverElementPreviewPerType.stories.tsx` | `canvas-ui/behaviours/HoverElementPreviewPerType.stories.tsx` | `canvas-ui/behaviours/HoverElementPreviewPerType` |
| `canvas-react/node-templates/TemplateStudio.stories.tsx` | `canvas-ui/node-templates/TemplateStudio.stories.tsx` | `canvas-ui/node-templates/Template Studio` |
| `canvas-react/visibility/HideShowLayersPanel.stories.tsx` | `canvas-ui/visibility/HideShowLayersPanel.stories.tsx` | `canvas-ui/visibility/HideShowLayersPanel` |
| `canvas-react/layouts/AcyclicExamples.stories.tsx` | `canvas-ui/layouts/AcyclicExamples.stories.tsx` | `canvas-ui/layouts/AcyclicExamples` |
| `canvas-react/layouts/CyclicExamples.stories.tsx` | `canvas-ui/layouts/CyclicExamples.stories.tsx` | `canvas-ui/layouts/CyclicExamples` |
| `canvas-react/streaming-demo.tsx` *(shared helper, not a story)* | `canvas-ui/streaming-demo.tsx` | — (update import paths in the two layout stories) |

### C. Move to top-level `usecases/` (4) — cross-package demo apps

| From | To (new path) | New `title:` |
|---|---|---|
| `canvas-react/use-cases/GraphModellerApp.stories.tsx` | `usecases/GraphModellerApp.stories.tsx` | `usecases/GraphModellerApp` |
| `canvas-react/use-cases/GraphVisualiserApp.stories.tsx` | `usecases/GraphVisualiserApp.stories.tsx` | `usecases/GraphVisualiserApp` |
| `canvas-react/use-cases/SchemaTable.stories.tsx` | `usecases/SchemaTable.stories.tsx` | `usecases/Schema Table` |
| `canvas-react/use-cases/SimpleAndCompositeNodes.stories.tsx` | `usecases/SimpleAndCompositeNodes.stories.tsx` | `usecases/Simple And Composite Nodes` |

### D. Move by capability (2) — export

| From | To (new path) | New `title:` |
|---|---|---|
| `canvas-react/export/ExportImage.stories.tsx` | `canvas/Export/ExportImage.stories.tsx` | `canvas/Export/ExportImage` |
| `canvas-react/export/ExportState.stories.tsx` | `canvas-store/Export/ExportState.stories.tsx` | `canvas-store/Export/ExportState` |

> ⚠️ **Open sub-decision for group D.** Both export stories currently pull
> `@invana/canvas-ui` chrome (`GraphCanvasApp` + `<ExportImageToolbar>`) to
> *trigger* the export. Two ways to honour "namespace = capability owner":
> - **(D-i, recommended)** Re-author each to demo the **capability directly** —
>   imperative `Canvas.export(...)` for `canvas/Export`, store serialization for
>   `canvas-store/Export` — dropping the canvas-ui dependency so the story
>   genuinely belongs to that package.
> - **(D-ii)** Keep the canvas-ui-driven UX but relocate the file anyway. This
>   leaves a canvas-ui-importing story under `canvas/` / `canvas-store/`, which
>   is inconsistent with the very rule driving this migration.
>
> `canvas/` has no existing "Export" area (its children are the seven
> `Conncepts/` concepts). Export isn't one of the seven, so a new top-level
> `canvas/Export/` area is proposed. Confirm the area name before moving.

---

## Resulting `canvas-react/` tree (after)

```
canvas-react/
├── Canvas/
│   ├── WithTelemetry.stories.tsx     (self-contained)
│   └── WithoutTelemetry.stories.tsx  (self-contained)
└── GraphCanvas/
    ├── WithTelemetry.stories.tsx     (self-contained)
    └── WithoutTelemetry.stories.tsx  (self-contained)
```

Emptied folders removed: `graph-canvas-app/`, `behaviours/`, `export/`,
`node-templates/`, `visibility/`, `use-cases/`, `layouts/`. The shared
`streaming-demo.tsx` helper also leaves (→ `canvas-ui/`).

---

## Execution steps

1. **Group B (16 items) → `canvas-ui/`.** `git mv` each story into
   `stories/canvas-ui/<subpath>`; rewrite the `title:` string in each. Also
   `git mv canvas-react/streaming-demo.tsx → canvas-ui/streaming-demo.tsx` and fix
   its import in `layouts/AcyclicExamples` + `CyclicExamples`. `canvas-ui/` already
   exists (`editors/`, `views/`) so only new sub-folders are created.
2. **Group C (4 files) → `usecases/`.** `git mv`; rewrite titles. Fold the
   `use-cases/` sub-namespace into the flat `usecases/` convention (drop the hyphen).
3. **Group D (2 files) → capability packages.** Resolve the D-i/D-ii sub-decision
   first; `git mv`, rewrite titles, and (if D-i) strip the canvas-ui imports and
   re-author to the imperative capability.
4. **Remove emptied folders** under `canvas-react/`.
5. **Verify:** `pnpm --filter @canvas/storybook dev` — confirm the sidebar shows
   the five surviving `canvas-react/*` nodes, the moved stories appear under their
   new namespaces, and no story renders under a stale path. `pnpm check-types`.

## Non-goals / notes

- No `main.ts`, `package.json`, or dep changes — glob-discovered, storybook
  already depends on all packages.
- Titles use the exact folder path (spaces preserved where the current title has
  them, e.g. `Template Studio`, `Schema Table`).
- This is a **story-file relocation only** — no `packages/**` source moves. It
  does **not** touch the in-progress canvas-react → canvas-ui *package* re-split
  (`ui-consolidation-plan.md`); it just makes the story namespaces reflect where
  the demoed code already lives.
