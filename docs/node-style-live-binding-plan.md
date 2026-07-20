# Node-style live binding — editors that reflect & drive the canvas

**Status:** 📋 planned (design-of-record). Companion to
[`graph-canvas-apps-plan.md`](./graph-canvas-apps-plan.md),
[`designer-studio-plan.md`](./designer-studio-plan.md), and the kernel work in
[`canvas-state-plan.md`](./canvas-state-plan.md).

## Context — the problem

The `@invana/canvas-ui` node-style editors (`SimpleNodeStyleEditor`,
`CompositeNodeStyleEditor`) are **headless**: they take `defaults`, emit a patch
via `onSubmit`, and know nothing about the canvas. Each consumer wires the store
by hand (`styleToForm(resolveNodeStyle(node))` in → `updateNode` out — see
`apps/storybook/.../node-styles/_shared.tsx`).

Two things fall out of that:

1. **A field can show a fabricated value.** In the Simple editor's basics, "Size"
   renders **0** for a normal node. Root cause: `NodeStyle.size` is a *unified
   size override* that is **usually undefined** — the effective size lives in
   `shape.radius` / `width` / `height`. `GraphLayer.resolveNodeStyle`
   (`packages/graph/src/layer/GraphLayer.ts:903`) only emits `size` if a
   contributor set it, so it comes back `undefined`, and the design-kit
   `NumberField` coerces `typeof value === 'number' ? value : 0` → **0**. The
   field is showing an *unset override* as if it were a real value.

2. **The developer wires state manually.** There's no drop-in that binds an
   editor to the selected node so edits flow to the canvas automatically. That's
   the ask: *the CanvasStore should own this state; a hook binds the UI to it;
   any UI change auto-applies — the developer shouldn't hand-wire `onSubmit` →
   `updateNode`.*

## Guiding principles (decided)

- **Editors reflect the effective (resolved) canvas value, never a fabricated
  default.** Seeding already comes from `resolveNodeStyle` (so Fill / Stroke /
  Label *do* reflect the canvas today). A field that maps to an *unset override*
  (like `size`) must not render a made-up `0` — either omit it or bind it to the
  effective value it stands for.
  - **Decision for `size`:** **drop the raw `size` override from the Simple
    basics tier.** The real footprint already lives in advanced Geometry
    (Radius for circle, Width+Height for rect). Basics = Shape + Fill. No
    misleading 0. (A future "effective-size" basics slider is a deferred
    option — see below.)

- **Keep canvas-ui editors headless.** No engine/store imports in
  `@invana/canvas-ui` (per its `CLAUDE.md`). That seam buys reuse, testability,
  undo, and the "produces a patch" contract. **Auto-sync lives one layer up, in
  `@invana/canvas-react`** — the bindings layer — mirroring the *existing*
  `useEntityEditor` pattern (`packages/canvas-react/src/hooks/useEntityEditor.ts`),
  which already does read-resolve-from-store → return a `commit` that writes back
  undoably (for label / type / data).

## The binding — `useNodeStyleEditor(nodeId)` (canvas-react)

A new hook that composes three primitives that already exist (no new engine
work):

- **Seed** from `layer.resolveNodeStyle(node)` → `styleToForm(...)` for the
  simple case / `compositeToForm(...)` for composite. Effective values, so every
  field reflects the canvas.
- **Stay reactive** via `useGraphEvent('node:update', …)` over `store.events`
  (`GraphStore` emits `node:update` on every `updateNode` — see
  `packages/graph/src/store/GraphStore.ts:1649`). NB **`useStore` cannot be used
  here** — it's bound to the kernel `ReactiveStore` (`canvas.store.view`), while
  nodes live in `GraphStore` (typed-column store + event bus, deliberately off
  the immer/reactive path for perf). `useGraphEvent` is the node-reactive
  primitive.
- **Write** via `store.updateNode(id, { style: { ...node.style, ...formToStyle(v) } })`,
  history-wrapped through the `HistoryContext` when a `<GraphHistoryProvider>` is
  present (exactly as `useEntityEditor` does).

Sketch:

```ts
interface NodeStyleEditorBinding {
  kind: 'simple' | 'composite';      // from node's shape.kind === 'composite'
  defaults: NodeStyleFields | CompositeFormState;
  onChange: (values) => void;        // live apply (debounced), history-coalesced
  commit?: (values) => void;         // optional Apply-button path
}
function useNodeStyleEditor(
  nodeId: string | null,
  options?: { layerId?: string; live?: boolean },
  canvas?: Canvas | null,
): NodeStyleEditorBinding | null;
```

**Target resolution.** Bind to an explicit `nodeId` (caller passes it) or to
`useSelection()`'s first id. **Do not** default to `ClickInspectBehaviour` — the
`GraphCanvasApp` `BASE_CONFIG` bundle doesn't register `click-inspect`, so
`useInspectTarget` would never fire there. (A caller that *has* a
`ClickInspectBehaviour` can still pass its target id in.)

**Kind dispatch.** The hook reports `kind` from `resolveNodeStyle(node).shape?.kind
=== 'composite'`, so the bound wrapper mounts the right editor — the canvas-ui
`NodeStyleEditor` dispatcher already switches on a `kind` prop.

## The drop-in — `<GraphNodeStyleEditor>` (canvas-react)

A thin wrapper that composes the headless canvas-ui editor with the hook, so a
developer drops it into `GraphCanvasApp`'s `right` region and edits flow to the
canvas with zero manual state:

```tsx
// right: { content: (ctx) => <GraphNodeStyleEditor /> }
export function GraphNodeStyleEditor({ nodeId, layerId, live = true }: Props) {
  const binding = useNodeStyleEditor(nodeId ?? null, { layerId, live });
  if (!binding) return <SelectPrompt text="Select a node to edit its style." />;
  return (
    <NodeStyleEditor
      key={/* nodeId */}                 // remount to reseed on target change
      kind={binding.kind}
      defaults={binding.defaults}
      onSubmit={binding.commit ?? binding.onChange}
    />
  );
}
```

## Live vs Apply, and history coalescing

- **Live is the default.** The overview editor already proves the live path
  (`NodeStyleOverviewEditor` fires `onChange` on every pick, no Apply button).
  `useNodeStyleEditor` offers the same for the full editors.
- **Debounce** live writes (~human-rate; style is on the reactive/cold path, not
  the position hot path, so this is cheap — but colour-drag / slider-drag still
  wants coalescing).
- **One history entry per gesture.** A live drag must not push 60 undo entries.
  Coalesce into a single `history.transaction(...)` per interaction (commit on
  blur / drag-end, or a debounced-then-committed transaction). Keep an **Apply**
  button as an opt-out (`live={false}`) for consumers who want explicit commits.

## Footguns to design around (all confirmed in code)

1. **`updateNode` replaces `style` wholesale** (`GraphStore.ts:749` —
   `if ('style' in patch) cold.style = patch.style`). Spread the **raw**
   `node.style` (the per-node override), **not** the resolved style. Spreading
   the *resolved* style would bake the layer template + theme + state defaults
   into an explicit per-node override, breaking templating / color-by-label. This
   is the same idiom `useEntityEditor` / `CollapseExpandBehaviour` /
   `NodeCentralityBehaviour` already follow.
2. **Only write touched fields.** `formToStyle` already prunes to the fields the
   form actually set (no `undefined` keys), so spreading its result is safe —
   keep it that way; don't re-introduce full-object writes.
3. **`useStore` ≠ node subscription.** As above — nodes are in `GraphStore`, not
   the kernel `ReactiveStore`. Use `useGraphEvent`. (Kernel-roadmap note: if/when
   node data projects onto a `DataSource`/`ReactiveStore` façade per
   `canvas-store-d13-data-ownership.md`, this hook can migrate to a uniform
   `useStore` read — the hook API is designed to hide that.)

## Deferred — an effective-size basics slider

If we later want a size control back in basics, bind it to the **effective
geometry** (not the raw override): seed from resolved `shape.radius` / `width`,
write back via the `size → shape` normalization (`normalizeShapeSize`,
`GraphLayer.ts:2476`) — the same thing `NodeResizeBehaviour` does when it writes
`style.size` / `style.shape`. Out of scope for the first pass.

## Phasing

- **P0 (tiny, can land now):** drop raw `size` from the Simple basics tier
  (`packages/canvas-ui/src/editors/node-style/simple/fields.ts` —
  `basicNodeStyleFields`). Basics = Shape + Fill.
- **P1:** `useNodeStyleEditor` in `packages/canvas-react/src/hooks/` (compose
  `resolveNodeStyle` + `useGraphEvent` + `updateNode`; kind dispatch; raw-style
  spread; history-wrapped). Export from the hooks barrel.
- **P2:** `<GraphNodeStyleEditor>` wrapper (`packages/canvas-react/src/…`),
  composing the canvas-ui `NodeStyleEditor`. `@invana/canvas-ui` becomes a
  **dependency of canvas-react** for this wrapper (today it isn't) — or the
  wrapper is left to the consumer/app and canvas-react ships only the hook.
  **Open question — see below.**
- **P3:** live/debounce + history coalescing polish; wire it into
  `GraphCanvasApp`'s `right` region as an opt-in default; add one Storybook story
  under `canvas-react/*` (only when explicitly requested — root rule 11).

## Open questions

1. **Where does `<GraphNodeStyleEditor>` live?** canvas-react (needs a
   `@invana/canvas-ui` dep — currently canvas-react has none) vs. the app layer
   vs. a new thin bindings package. Leaning canvas-react-owns-the-hook, and the
   **wrapper** either in canvas-react (accept the dep) or the consuming app. The
   hook alone already removes the manual wiring; the wrapper is sugar.
2. **Multi-select.** First pass edits the single selected node. Applying one
   style patch across N selected nodes (fan the write) is a natural follow-up.
3. **Init-only vs live options.** Node *style* is all live (`updateNode`). No
   remount needed — unlike behaviour/layer/layout `setOptions` cases.
