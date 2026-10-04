# CLAUDE.md — packages/canvas-boards (`@invana/canvas-boards`)

**Canvas panels for the design kit's `@invana/boards`.** A kit board is drawn from a JSON `BoardSpec`, and the kit deliberately ships no `canvas` panel (it would put PixiJS in every board's bundle). This package is that panel, plus the panels that read a canvas: `canvas` · `canvas-inspector` · `canvas-layers` · `canvas-table`. A board of kit panels only is a dashboard; add a `canvas` panel and it is a canvas board. See `docs/rfcs/feat/2026-10-05-a-board-cannot-hold-a-canvas.md`.

## Shape

| File | Role |
|---|---|
| `src/types.ts` | Each kind's **JSON** options + `CanvasPanelKinds` (the spec's type argument — keep it a `type`, not an `interface`: an index signature would make every option unchecked) |
| `src/provider.tsx` | `CanvasBoardProvider` — `resolveData(dataRef)` + the live engines keyed by `canvasId`. Board panels only get their own options, and a canvas is a *sibling* of the panels that read it, so the engine travels through this |
| `src/panels/CanvasPanel.tsx` | `GraphCanvasAppRoot` + `GraphCanvasAppSurface` (canvas-ui) — the app's engine half, none of its chrome |
| `src/panels/Canvas{Inspector,Layers,Table}Panel.tsx` | Thin bindings: canvas-ui's view panels, and the kit's own `table` block fed from the live graph |
| `src/CanvasBoard.tsx` | `CANVAS_PANELS` registry + `CanvasBoard` (provider + kit `Board`) |

## Rules

- **Options are JSON.** A graph is a `dataRef`, never data; config is `CanvasConfig` data, never a callback or a layout class.
- **No module state.** Everything per-board lives in `CanvasBoardProvider`, so N boards on one page are independent.
- **Behaviours are opt-in** (root rule 7): the canvas panel registers `ClickInspectBehaviour` only when the spec says `inspect: true`.
- **Reuse, don't redraw.** A new kind wraps an existing canvas-ui view panel or a kit block; chrome comes from the kit's `PanelBox`, which every board panel already gets.
- canvas-ui never imports this package (the dependency runs canvas-boards → canvas-ui).
