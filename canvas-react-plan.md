# canvas-react plan

## Context

We want a React entry-point for the engine so the canvas can be embedded in product apps the React way — declaratively, with JSX children mapping to engine objects. The new package is `@invana/canvas-react`, modeled on `react-three-fiber`'s context+child pattern (no custom reconciler — too much surface for the value).

Companion decision: switch `apps/storybook` from `@storybook/html-vite` to `@storybook/react-vite` so the React stories can live next to the existing engine stories under one dev server. A Storybook instance is bound to one framework, so dual-framework in one instance isn't an option; the React framework can still host the existing imperative DOM stories via a thin host component.

Scope decisions (locked):
- **Component shape:** declarative JSX children — `<Canvas><GraphLayer/>…</Canvas>`.
- **Showcase scope:** core only — GraphLayer + one layout + pan/zoom/drag. No minimap / contour / bubble-sets / lasso / brush in this cut.
- **Imperative ref:** `forwardRef` exposes the underlying `Canvas` instance — nothing more. Power users drop down via `ref.current.layers.get(...)` etc.
- **Storybook:** migrate to React framework; provide a small `<DomHost>` adapter so existing HTML stories keep working unchanged inside their `play` functions.

---

## 1. New package: `packages/canvas-react`

Standard package layout, mirroring `packages/graph`:

```
packages/canvas-react/
├── package.json           # @invana/canvas-react, tsup build
├── tsconfig.json          # extends @repo/typescript-config/base.json
├── CLAUDE.md              # one-paragraph package rules
└── src/
    ├── index.ts                       # public barrel
    ├── CanvasContext.ts               # React.Context<EngineCanvas | null>
    ├── Canvas.tsx                     # root component (forwardRef → EngineCanvas)
    ├── layers/
    │   └── GraphLayer.tsx             # wraps @invana/graph GraphLayer
    ├── behaviours/
    │   ├── CameraInputBehaviour.tsx   # pan + wheel zoom (engine default)
    │   └── DragPanBehaviour.tsx       # explicit drag-pan
    └── layouts/
        └── D3ForceLayout.tsx          # wraps @invana/graph-layout-d3-force
```

`package.json` peers: `react` (>=18), `react-dom` (>=18), plus the engine packages it wraps as `dependencies`. tsup config matches existing packages (ESM + d.ts + sourcemaps, externals: `react`, `react-dom`, `pixi.js`, every `@invana/*`).

### 1.1 `<Canvas>` (root)

```tsx
const Canvas = forwardRef<EngineCanvas, CanvasProps>((props, ref) => { … });
```

- Renders a sized `<div>` and runs `await new EngineCanvas().init({ container, …opts })` in a `useEffect` (StrictMode-safe: track a "cancelled" flag and call `destroy()` in cleanup).
- Once initialised, stashes the `EngineCanvas` in state and renders `<CanvasContext.Provider value={canvas}>{children}</CanvasContext.Provider>`. Until then children are not mounted (avoids null-canvas branches in every child).
- `useImperativeHandle(ref, () => canvas, [canvas])` — ref is the bare `EngineCanvas`.
- Props mirror a curated subset of `CanvasOptions` (`width`/`height`/`autoResize`/`backgroundColor`/`preference`/`resolution`/`antialias`). The full options object is also accepted as `engineOptions={…}` for escape-hatch use.

### 1.2 Child registration pattern

Every child wrapper is a render-null component that does its imperative engine work in `useEffect` against the canvas pulled from context. Pattern (illustrative):

```tsx
export function GraphLayer({ id = 'graph', data, nodeOptions, edgeOptions }: GraphLayerProps) {
  const canvas = useCanvas();                       // throws if outside <Canvas>
  const layerRef = useRef<EngineGraphLayer | null>(null);

  useEffect(() => {
    const layer = new EngineGraphLayer({ id, options: { node: nodeOptions, edge: edgeOptions } });
    canvas.layers.add(layer);
    layerRef.current = layer;
    return () => { canvas.layers.remove(id); layerRef.current = null; };
  }, [canvas, id]);                                 // recreate on id change only

  useEffect(() => { if (data) layerRef.current?.store.setData(data); }, [data]);

  return null;
}
```

Same shape for `<CameraInputBehaviour>`, `<DragPanBehaviour>`, `<D3ForceLayout>`. Layout subtlety: `<D3ForceLayout>` takes a `targetLayerId` prop (default `'graph'`), looks the layer up on mount, calls `layout.apply(layer)`, wires `end → camera.fitContent(layer.getBounds(), 100)`, and `layout.stop()` in cleanup. Sibling render order (`<GraphLayer/>` before `<D3ForceLayout/>`) guarantees correct effect order — document this in TSDoc.

### 1.3 Public exports (`src/index.ts`)

```ts
export { Canvas } from './Canvas';
export { CanvasContext, useCanvas } from './CanvasContext';
export { GraphLayer } from './layers/GraphLayer';
export { CameraInputBehaviour } from './behaviours/CameraInputBehaviour';
export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export { D3ForceLayout } from './layouts/D3ForceLayout';
export type { CanvasProps, GraphLayerProps /* etc. */ } from './types';
```

### 1.4 Rules out of scope for v0

- No prop diffing beyond `id` and `data` — changing other layer options requires unmount/remount. TSDoc says so; broader reactivity is a future iteration.
- No declarative state-config / palette wiring through props beyond what `GraphLayerOptions` already takes.
- No JSX wrappers for ElkLayout, MiniMapLayer, DensityContourLayer, BubbleSetsLayer, or hover/select/lasso/brush behaviours yet (they slot in as additional files later — pattern is identical).

---

## 2. Storybook migration: html-vite → react-vite

### 2.1 Config changes

- `apps/storybook/.storybook/main.ts`: swap `@storybook/html-vite` import + framework name for `@storybook/react-vite`.
- `apps/storybook/package.json`:
  - remove `@storybook/html-vite`
  - add `@storybook/react-vite`, `react`, `react-dom`, `@types/react`, `@types/react-dom`
  - add `@invana/canvas-react: workspace:*`
- `tsconfig.json` (storybook app): `"jsx": "react-jsx"` if not already.

### 2.2 Keeping existing HTML stories working

Existing stories return a DOM element from `render` and do imperative setup in `play`. React framework wants `render` to return a React element. Cheapest adapter — one helper used everywhere:

```tsx
// apps/storybook/stories/dom-host.tsx
export function DomHost({ make }: { make: () => HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.replaceChildren(make()); }, []);
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}
```

Per-story migration is a one-liner:

```ts
// before
render: () => createContainer({ id: 'cvs-foo' }),
// after
render: () => <DomHost make={() => createContainer({ id: 'cvs-foo' })} />,
```

`play({ canvasElement })` keeps querying by id, untouched. Story files become `.stories.tsx` (rename only when touched; new file extension isn't enforced — Storybook globs already match `.tsx`). This is a sweep, not a rewrite — every existing story stays semantically identical.

### 2.3 New React story namespace

Per `apps/storybook/CLAUDE.md` conventions: new package gets its own top-level folder. Add:

```
apps/storybook/stories/Canvas-React/
└── GettingStarted.stories.tsx
```

Title `'Canvas-React/GettingStarted'`. One story, exactly the kitchen-sink the user wants to verify the wrapper works:

```tsx
export const GettingStarted: Story = {
  render: () => (
    <Canvas autoResize>
      <CameraInputBehaviour />
      <DragPanBehaviour />
      <GraphLayer id="graph" data={lesMiserables} />
      <D3ForceLayout targetLayerId="graph" charge={-300} />
    </Canvas>
  ),
};
```

Dataset comes from `@invana/graph-datasets`. No `play` function needed — the React tree drives setup. `onStoryTeardown` is unnecessary because React unmounts the tree between stories and `<Canvas>`'s effect cleanup runs `canvas.destroy()`.

### 2.4 Existing CLAUDE.md updates

`apps/storybook/CLAUDE.md` — add a short section on the React framework: the `<DomHost>` adapter for HTML stories, the `Canvas-React/*` namespace, that React stories don't need `onStoryTeardown` because effect cleanup handles it.

---

## 3. Critical files to touch

| Path | Action |
|---|---|
| `packages/canvas-react/**` | **new** — package per §1 |
| `apps/storybook/.storybook/main.ts` | swap framework |
| `apps/storybook/package.json` | deps swap + new deps |
| `apps/storybook/stories/dom-host.tsx` | **new** — `<DomHost>` adapter |
| `apps/storybook/stories/**/*.stories.ts` | sweep: wrap `render` returns with `<DomHost>` (no other changes) |
| `apps/storybook/stories/Canvas-React/GettingStarted.stories.tsx` | **new** — kitchen-sink showcase |
| `apps/storybook/CLAUDE.md` | document React framework + `<DomHost>` |
| `CLAUDE.md` (repo root) | add `packages/canvas-react` row to active-packages table |
| `apps/docs/typedoc.json` | add `packages/canvas-react/src/index.ts` entry point |

No edits to `packages/canvas`, `packages/graph`, or the layout/overlay packages — `canvas-react` consumes their public APIs only.

---

## 4. Verification

1. `pnpm install` after the dep changes resolves cleanly.
2. `pnpm --filter @invana/canvas-react build` produces ESM + d.ts in `dist/`.
3. `pnpm --filter @canvas/storybook dev` boots on 6006 without framework errors.
4. Manually navigate to **Canvas-React → GettingStarted**: graph renders, dragging pans, wheel zooms, layout settles and viewport fits content.
5. Smoke-check at least three pre-existing HTML stories (one shape, one behaviour, one graph layout) — they should look identical post-migration.
6. `pnpm check-types` clean across the monorepo.
7. `pnpm --filter @canvas/storybook build` succeeds (catches anything dev-only didn't).

Out of scope for this verification pass: prop-update reactivity beyond `data`, ElkLayout / overlay layers / other behaviours — those land in follow-ups.
