# Plan: Reusable toolbar components + 5 assembled toolbars (engine-owned history & clipboard)

## Context

The canvas-react UI layer already has a small set of self-wiring building blocks
(`ZoomControls`, `ZoomPicker`, `FitContentButton`, `ClearButton`, `LockToggle`,
`Panel`, `ControlButton`, `OptionPicker`) and two assembled toolbars
(`CanvasControlsToolbar`, `GraphToolbar`). The user wants a **complete, parallel
set** of building-block components plus **5 fresh assembled toolbars**, grouped as:

1. **History** — undo, redo, redraw
2. **Edit/clipboard** — cut, copy, paste, delete selection, clear canvas
3. **View** — zoom in, zoom out, zoom picker, fit content, lock view
4. **Grid** — show grid (toggle)
5. **Graph** — layout selection, select mode (click / brush / lasso)

Exploration found the engine already supports groups 3, 4, 5, and `delete`/`clear`
(via `Camera`, `BackgroundLayer.setOptions`, `GraphStore.removeNode`, behaviour
enable/disable). It has **no undo/redo/history and no clipboard**. Per the user's
decisions, those are to be **built in the engine** (`packages/graph`), the
deliverable includes **both components and toolbars**, and all **5 toolbars are
built fresh** (existing two left untouched).

Outcome: a layered, multi-canvas-safe toolbar kit where History/Edit/View/Grid
self-wire from engine state, and Graph (layout + select mode) is config-driven
because layouts live in separate packages and mode-switching toggles
consumer-registered behaviours.

## Verified ground truth (read from source)

- `GraphLayer.store` is **public** (`readonly store: GraphStore`, `GraphLayer.ts:150`).
- `rerenderNode`/`rerenderEdge` are **private** (`GraphLayer.ts:997,1041`) → must add a public `redraw()`.
- `GraphStore.getNode(id)`/`getEdge(id)` return **full clones** incl. `position`+`pinned` → the snapshot primitive for delete pre-capture.
- `node:remove`/`edge:remove` fire **after** mutation on flush → deletes need pre-capture; passive event capture can't invert them.
- `setPosition(..., {silent})` skips events → layout sim ticks never reach an opt-in journal (no undo flooding).
- `GraphStore.batch(fn)` coalesces to one flush; `events` is typed (`node:*`, `edge:*`, `flush`).
- **No selection-change event** exists, but `ClickSelectBehaviour` has an `onSelectionChange` option + `setOptions` patch path (`ClickSelectBehaviour.ts:107,157`), plus `selectMultiple`, `clearSelection`, `getSelectedShapeIds/ConnectorIds`. Brush/Lasso delegate into the registered `ClickSelectBehaviour` (default id `'click-select'`).
- `BackgroundLayer.setOptions({ type:'pattern'|'solid', patternType:'grid' })` toggles the grid; canvas-react `<BackgroundLayer>` wrapper defaults `id='background'`.
- Layouts: `layout.apply(layer): Promise<void>` (+ optional `stop()`); no registry.

## Architecture decisions

- **History = command/transaction journal** (opt-in per mutation path), NOT full snapshots and NOT passive event-listening. Only ops routed through `history.transaction(...)`/`push(...)` are recorded; streaming feeds and silent layout ticks bypass it. Inverses are captured **before** mutating (read-before-write via `store.getNode/getEdge` clones), which is the only way to invert deletes.
- **Clipboard = standalone buffer class**; it does not read selection itself — the hook reads ids from `ClickSelectBehaviour` and passes them in (decoupled, testable).
- **redraw = a render pass**, independent of history; add public `GraphLayer.redraw()`.
- Engine objects are **consumer-constructed** and surfaced to hooks via small React **contexts + provider wrappers** (mirrors `CanvasContext`), keeping the engine classes free of canvas coupling.

---

## Phase 1 — Engine (`packages/graph`)

### 1a. `GraphHistory` — `packages/graph/src/history/`
- `types.ts` — `HistoryOp` union (`addNode | removeNode{node,edges} | updateNode{before,after} | moveNode{before,after} | addEdge | removeEdge | updateEdge`), `HistoryEntry { ops; label? }`, `GraphHistoryEventMap { change:{canUndo,canRedo,undoDepth,redoDepth} }`.
- `GraphHistory.ts` — `constructor(store: GraphStore, opts?: { limit?: number })`; `readonly events`.
  - `transaction<T>(label, fn: (rec: HistoryRecorder) => T): T` — wraps `store.batch`; `rec.*` helpers read-before-write then mutate + journal one `HistoryEntry`.
  - `undo()` / `redo()` — replay inverse/forward ops inside `store.batch` using **plain `store.*`** calls (no re-journal); positions restored non-silent so the renderer repaints.
  - `get canUndo` / `get canRedo`, `clear()`, `push(entry)` (escape hatch for behaviours like drag-end). Emits `change` after every mutation.
  - Honors `limit` (default 100) by dropping oldest undo entries.
- `index.ts` barrel; export from `packages/graph/src/index.ts`.

### 1b. `GraphClipboard` — `packages/graph/src/clipboard/`
- `GraphClipboard.ts` — `constructor(store, opts?: { pasteOffset?: Vec2; remapId?: (oldId, attempt)=>string })`.
  - `copy(nodeIds, edgeIds?)` — clone into buffer.
  - `cut(nodeIds, edgeIds, history?)` — copy + delete as one transaction (edges first, then nodes).
  - `paste(history?): { nodeIds; edgeIds }` — remap ids (loop `remapId` until `!store.hasNode`), offset positions, remap `parentId` only when parent is also pasted, paste only edges whose **both** endpoints were buffered (endpoints remapped). One transaction; returns new ids for re-selection.
  - `delete(nodeIds, edgeIds, history?)` — remove as one transaction (no buffer touch).
  - `get hasContent`, `clearBuffer()`.
- `index.ts` barrel; export from `packages/graph/src/index.ts`.

### 1c. `GraphLayer.redraw()` — `packages/graph/src/layer/GraphLayer.ts`
- New public method: iterate `store.nodes()` → `this.rerenderNode(id)`, `store.edges()` → `this.rerenderEdge(id)`. TSDoc: full re-render from current store state; not a data mutation; not undoable.

### 1d. Engine tests (optional but recommended)
- `packages/graph` permits tests (the no-test rule is **canvas-only**). Add focused unit tests for `GraphHistory` (undo/redo of delete+paste+clear, limit, no-flood from silent positions) and `GraphClipboard` (id remap, edge endpoint filtering, cut/paste round-trip) under `packages/graph/tests/`.

---

## Phase 2 — canvas-react contexts + providers (`packages/canvas-react/src/`)

- `HistoryContext.ts` — `createContext<GraphHistory | null>(null)`.
- `ClipboardContext.ts` — `createContext<GraphClipboard | null>(null)`.
- `<GraphHistoryProvider layerId='graph'>` — on mount, `new GraphHistory(layer.store)`; provide via context; dispose on unmount. Renders children.
- `<GraphClipboardProvider layerId='graph'>` — same for `GraphClipboard`.

(Consistent with the "one wrapper per engine class" convention; these provide context rather than render null so descendants can consume.)

---

## Phase 3 — canvas-react hooks (`packages/canvas-react/src/hooks/`)

All mirror `useResolvedCanvas`/`useClearGraph`: resolve canvas via `explicit ?? context`, return actions + reactive state, optional `canvas` arg, effect keyed on resolved instance. Cross-package types imported as `type` only; layer methods duck-typed (no hard `GraphLayer` import), per the `useClearGraph` precedent.

| Hook | Returns | Source / reactivity | Self-wiring? |
|---|---|---|---|
| `useSelection(opts?, canvas?)` | `selectedNodeIds, selectedEdgeIds, count, clear()` | Chains onto `ClickSelectBehaviour.onSelectionChange` via `setOptions` (compose + restore on cleanup); covers brush/lasso via delegation. Default id `'click-select'`. | needs a registered ClickSelectBehaviour |
| `useHistory(opts?, canvas?)` | `undo, redo, redraw, canUndo, canRedo` | `HistoryContext` + `history.events.on('change')`; `redraw` duck-types `layer.redraw()`. | needs `<GraphHistoryProvider>` |
| `useClipboard(opts?, canvas?)` | `cut, copy, paste, remove, canPaste, hasSelection` | `ClipboardContext` + `HistoryContext` (optional) + selection from `useSelection`; `canPaste` ← `clipboard.hasContent` recomputed after each op; re-selects pasted ids. | needs `<GraphClipboardProvider>` + ClickSelectBehaviour |
| `useGrid(opts?, canvas?)` | `showGrid, toggleGrid, setGrid` | `BackgroundLayer` (default id `'background'`); seed from `getOptions().type`; state owned by hook (no event). | yes (needs known bg id) |
| `useLayout(layouts, opts?, canvas?)` | `layout, layoutOptions, applyLayout, isRunning` | Consumer supplies `Record<string, ()=>Layout>`; lifts the story's `LayoutController` (stop in-flight → `apply` → `camera.fitContent`). | config-driven (factories required) |
| `useSelectMode(opts, canvas?)` | `mode, modeOptions, setMode` | Consumer supplies behaviour ids `{click,brush,lasso}`; `setMode` enables one, disables others; state owned by hook. | config-driven (ids required) |
| `useLock(opts?, canvas?)` | `locked, toggleLock, setLock` | Disables/enables configurable behaviour ids (default `['drag-pan','drag-node']`); state owned by hook. | policy-driven (ids configurable) |

Update `hooks/index.ts` with all hooks + result types.

---

## Phase 4 — canvas-react components (`packages/canvas-react/src/components/`)

Self-wiring buttons (consume the new hooks, like the existing `ClearButton`); the
primitive `ControlButton`/`OptionPicker`/`Panel`/`LockToggle` stay dumb and reused.
Icons stay `ToolbarIcon` props; chrome from `@invana/ui`.

- `UndoButton`, `RedoButton`, `RedrawButton` — `useHistory`; undo/redo disabled via `canUndo`/`canRedo`.
- `CutButton`, `CopyButton`, `DeleteSelectionButton` — `useClipboard`+`useSelection`; disabled when `!hasSelection`.
- `PasteButton` — `useClipboard`; disabled when `!canPaste`.
- `ClearButton` — **reuse existing**.
- `GridToggle` — `useGrid`; `active={showGrid}`.
- `LayoutPicker` / `SelectModePicker` — thin self-wiring wrappers over `OptionPicker` (or reuse `OptionPicker` directly inside the toolbar). Self-wiring variants use `useLayout`/`useSelectMode`.
- `LockButton` — self-wiring via `useLock` (keep dumb `LockToggle` too).

Update `components/index.ts`.

---

## Phase 5 — canvas-react toolbars (`packages/canvas-react/src/toolbars/`)

Each: `*Toolbar` suffix, wraps `<Panel position orientation>` around `NavHorizontal`/`NavVertical`, optional `canvas` prop, an `icons` set.

1. **`HistoryToolbar`** — Undo/Redo/Redraw. Default `top-left`, horizontal. Needs `<GraphHistoryProvider>`.
2. **`EditToolbar`** — Cut/Copy/Paste/DeleteSelection/Clear. Default `top-left`, horizontal. Needs `<GraphClipboardProvider>` + ClickSelectBehaviour.
3. **`ViewToolbar`** — ZoomControls + ZoomPicker + FitContentButton + LockButton. Default `bottom-left`, vertical. Self-wires zoom/fit; lock via `useLock` (configurable ids).
4. **`GridToolbar`** — GridToggle. Default `bottom-right`, horizontal. Self-wires via `useGrid`.
5. **`GraphLayoutToolbar`** (name avoids clashing with existing `GraphToolbar`) — LayoutPicker + SelectModePicker. Default `top-center`, horizontal. Primary shape **self-wiring** (`layouts` factories + `selectModeBehaviourIds`), with a callback-driven shape also supported.

Update `toolbars/index.ts`.

---

## Barrels to update
- New: `packages/graph/src/history/index.ts`, `packages/graph/src/clipboard/index.ts`.
- Edit: `packages/graph/src/index.ts`; `packages/canvas-react/src/{hooks,components,toolbars}/index.ts`; `packages/canvas-react/src/index.ts` (hooks, components, toolbars, providers, contexts).

## Key risks / call-outs
- **History is opt-in per mutation path** — document loudly; passive `store.*` calls are NOT captured by design (keeps layout ticks/feeds out of the stack).
- **No selection event** — `useSelection` must compose (not clobber) any consumer `onSelectionChange` and restore on cleanup; requires a registered `ClickSelectBehaviour`.
- **Clear + undo** — forward wipe must go through `layer.clear()` (renderer-synced); inverse re-adds all nodes/edges in one batch. Test both directions for store/renderer sync.
- **`useGrid` needs a known BackgroundLayer id** (default `'background'`; consumer must match).
- **Paste** — remap transactionally, drop edges with unbuffered endpoints, remap `parentId` only when parent is pasted.

## Project rules honored
- **No new stories** (GraphVisualiser is reference only; don't add/modify stories unless asked later).
- **TSDoc** on every new public class/method, hook result field, component prop.
- **No `pixi.js`** imports in canvas-react; **no pixi** in `@invana/graph` (use `GraphStore`/`GraphLayer` public API + `EventEmitter` from `@invana/canvas`).
- Primitive components stay dumb; self-wiring buttons may import hooks (existing `ClearButton` precedent).
- No commits unless explicitly requested.

## Verification
1. `pnpm --filter @invana/graph build && pnpm --filter @invana/canvas-react build` — engine + bindings compile; `pnpm check-types`.
2. (Optional) run the new `packages/graph` unit tests for history/clipboard.
3. Manual: in a throwaway harness (or by temporarily wiring the GraphVisualiser story *only if asked*), wrap a `<Canvas>` with the providers, drop the 5 toolbars, and confirm: undo/redo after delete & paste; copy→paste offsets + re-selects; cut round-trips via undo; grid toggles; lock disables pan/drag; layout switch + select-mode switch; redraw repaints after a `setNodeDefaults` theme change. Confirm `canUndo/canRedo/canPaste/hasSelection` enable/disable the buttons reactively.
