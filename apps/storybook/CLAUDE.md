# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. The sidebar mirrors the seven core engine concepts under each package namespace.

## Framework — `@storybook/react-vite`

Storybook runs on the React framework (`@storybook/react-vite`). Story files are `.stories.ts` or `.stories.tsx` and import `Meta` / `StoryObj` from `@storybook/react-vite`. Two authoring shapes coexist:

1. **Imperative / `play`-based** — the existing engine, graph, layout, and decoration stories. `render()` returns `createContainer(...)` (defined in `stories/div-util.tsx` — it returns a React element rendering a sized `<div>` with a stable id), and the `play({ canvasElement })` function queries the container by id and drives the engine imperatively. No changes from the pre-React-framework pattern; `play` runs against the same DOM shape.
2. **Declarative React** — stories for `@invana/canvas-react`. `render()` returns the React tree directly (`<Canvas><GraphLayer/>…</Canvas>`). No `play`. No `onStoryTeardown` either — the `<Canvas>` effect cleanup tears the engine down on unmount. **Still one story per file** (see Rules below) — variants split into a folder of one-story files, each **self-contained** (full data + tree inline, no shared helper module); don't stack multiple exports in one file.

When in doubt: engine + graph stories follow shape (1). Anything under `canvas-react/*` follows shape (2).

### `canvas-react/*` stories stay headless and minimal

A `canvas-react/*` story exists to show the **raw binding layer**, so keep it as small as possible: mount a **bare `<Canvas>` / `<GraphCanvas>` root** and compose only **canvas-react** wrappers (layers, behaviours, layouts) as children — the component(s) under test and nothing more. `canvas-react/Canvas/Basic.stories.tsx` is the model.

- **No `@invana/canvas-ui` app chrome.** No `GraphCanvasApp`, no header / footer, no toolbars, connected panels, editors, or detail-views wrapping the scene. The engine root is the whole scene; the sized host `<div>` is the only wrapper.
- **The story owns the tree, not a canvas-ui shell.** If a demo needs the batteries-included app shell, toolbars, editors, or connected panels *around* the canvas, it is a **canvas-ui** story (e.g. under `canvas-ui/apps/GraphCanvasApp/`), **not** a canvas-react one — put it there instead.
- **Exception — canvas-ui preview cards as render-prop *content*.** A story *may* import canvas-ui's presentational preview cards (`NodePreviewCard` / `EdgePreviewCard` / `HoverElementPreviewCard`) and pass them as a behaviour's `renderNode` / `renderEdge` / `renderCard` content. That's exactly how a consumer wires the headless behaviour, and it's confined to the **story** — the canvas-react *package* still never imports canvas-ui. This covers render-prop **content only**; the scene around it stays bare (still no app shell, panels, or toolbars).

### `canvas-ui/*` stories — only three buckets: `apps` / `editors` / `view-panels`

Keep the `@invana/canvas-ui` sidebar simple: **every canvas-ui story is either an editor or a view panel** (plus the composed `apps`). There are exactly three top-level folders under `stories/canvas-ui/` — don't invent a fourth (no `visibility/`, `node-templates/`, `panels/`, etc.):

- `canvas-ui/apps/…`         — composed batteries-included app shells (`GraphCanvasApp/…`).
- `canvas-ui/editors/…`      — schema-driven settings editors and editor showcases (`CanvasSettingsEditorPanel`, `node-styles/…`, `HoverPreviewCardEditorPanel`, `Template Studio`).
- `canvas-ui/view-panels/…`  — presentational / store-connected `*ViewPanel` surfaces (`CanvasPagesViewPanel/…`, `LayersViewPanel/…`, `SchemaViewPanel/…`, `CanvasFiltersViewPanel`).

Titles mirror the path (`canvas-ui/<bucket>/<Name>`). When a new canvas-ui story doesn't obviously fit, ask "is its subject an editor form or a view panel?" and file it accordingly — a composed studio that exists to demo editors is an **editor** story, not its own category.

**Every canvas-ui story mounts `GraphCanvasApp` as its base — show the component the way the real app uses it.** Editors and views dock into the app's resizable **`right` region** (`right={{ content, defaultSize, maxSize, collapsible }}`), never a **floating `Panel`** (the canvas-ui `Panel` positioner is package-internal chrome; stories don't import it). Wrap detail content in `PanelContent` for header/close chrome, or let a `TabbedPanel` fill the region — the section is the resizable container. Pages-of-canvases stories (`CanvasPagesViewPanel`) make each page a `<GraphCanvasApp>` board (the `apps/GraphCanvasApp/CanvasBoards` pattern); with many boards pass `keepMounted={false}` so only the active board holds a live engine / GPU context.

**Reference template for a view-panel story: `stories/canvas-ui/view-panels/FindInCanvasViewPanel.stories.tsx`.** Copy its shape — it's the cleanest way to wire toggle-driven docked panels:

- **Drive the dock with `useSidePanels` (canvas-ui), not hand-rolled state.** Pass panel descriptors — `{ id, icon, label, render: (canvas) => <XViewPanel canvas={canvas} /> }` — and get back `items` (spread into **one** `header.right` `<ToolbarItems>`, *not* a bar per panel) plus `region` (hand straight to `right`). It owns the open-state, activity-bar style: one panel docked at a time, toggle-off drops the region. A single always-on panel can still pass `right={{ content, … }}` directly.
- **Memoise `data` / `config` / `onReady`** (`useMemo` / `useCallback`, empty deps) so a panel toggle — which re-renders the story — never hands `GraphCanvasApp` a new `data`/`config` identity and reloads the engine (`onReady` re-fires on identity change; see the `CanvasReady` note).
- **Frame the graph with `canvas.fitView(padding)`** — the built-in union-of-world-layer-bounds fitter (same as the Fit button / `config.fitOnLoad`). Never hand-roll `layer.getBounds()` + `camera.fitContent`. It reads *renderer* bounds, so call it one `requestAnimationFrame` after `onReady` (which fires at *registered*, before the first paint), or rely on `fitOnLoad` (already on in `BASE_CONFIG`) and a falsy `activeLayout`.

Right-region content is a **sibling of `<Canvas>`** under the app's *lifted* context, so it can render before the engine is ready. `useGraphCanvas()` / `useCanvas()` / `useGraphCanvasUpdate()` **throw on the null lifted context** — gate the docked content on `useContext(GraphCanvasContext)` (bail to `null` when absent), as `editors/node-styles/_shared.tsx` (`PanelGate`) and the converted view stories do. Pure controlled editors (`defaults` in → patch out, e.g. `HoverPreviewCardEditorPanel`) need no gate; connected content (anything calling an engine hook) does. **A view panel that takes a `canvas` prop needs no gate either** — the region `content` render-fn is handed the live engine (`content: (ctx) => …` → `ctx.canvas`, which `useSidePanels`' `render(canvas)` forwards), and the panel handles the `null`-until-ready case internally. That's the preferred shape (`FindInCanvasViewPanel` / `CanvasFiltersViewPanel`): pass `canvas` explicitly, no context read in the story.

## Styling — no hand-rolled CSS (root rule 13)

**Never write manual CSS in a story** — no inline `style={{…}}` objects, no `CSSProperties` consts, no raw CSS for static presentation. Wrap demo layout/chrome in **`@invana/ui` components** (`Card`/`CardHeader`/`CardContent`, `Separator`, `Badge`, `Button`, …) and use **Tailwind design-token utility classes** via `className` (`flex`, `flex-col`, `gap-4`, `p-4`, `bg-card`, `text-muted-foreground`, `text-xs`, …) — the design-kit Tailwind theme is wired into Storybook (`.storybook/preview.ts`), so utilities work. `stories/canvas-ui/editors/TemplateStudio.stories.tsx` (its docked `right`-region editor panel — `Card`/`CardHeader`/`CardContent` + Tailwind utilities, no `CSSProperties`) is the reference.

The **only** inline `style` allowed is a genuinely dynamic runtime value Tailwind can't express (a computed colour, a cursor/absolute coordinate, a prop-driven pixel size). **Exempt** (structural / engine-demo tooling, not chrome): `createContainer(...)` in `stories/div-util.tsx` sizes the canvas-host `<div>`, and imperative engine stories drive settings through a **lil-gui** panel — those stay as-is. This rule targets the React/UI framing *around* components (columns, panels, spacing, labels), not the canvas surface or lil-gui.

## Conventions

**Storybook top-level namespacing follows package names — each package owns its own top-level sidebar node; a package's stories never nest under another package's namespace.** So `@invana/canvas` stories live under `stories/canvas/...`, `@invana/graph` under `stories/graph/...`, `@invana/canvas-react` under `stories/canvas-react/...`, `@invana/canvas-ui` under `stories/canvas-ui/...`, `@invana/canvas-store` under `stories/canvas-store/...`, `@invana/canvas-designer` under `stories/canvas-designer/...`. The layout and layer packages keep a *grouped* parent (`stories/graph-layouts/<flavour>/...`, `stories/graph-layers/<name>/...`) — see below — but that group is itself a **top-level** sibling of `canvas` and `graph`, not a child of `canvas`. The `title` field mirrors the folder path exactly, so the sidebar tree matches the filesystem tree. (`usecases/` is the one deliberate exception: cross-package demo apps that belong to no single package — see its own two-bucket rule below.)

> Don't nest `graph`, `graph-layouts`, or `graph-layers` (or any other package) under `canvas/` — they're separate packages and get separate top-level nodes.

**One deliberate exception — `GraphLegendLayer`.** Its story is filed by *concept* (it's a layer) rather than by owning package: `canvas/concepts/Layers/GraphLegendLayer`, alongside `BackgroundLayer` / `DevInfoLayer` / `LayersPanelLayer`, even though the class ships in `@invana/graph`. **`MiniMapLayer` still sits at `graph/Layer/MiniMap`**, so the two graph-domain layers are currently filed differently — if a third graph layer gets a story, decide which wins and move the odd one out rather than adding a third pattern.

### `usecases/` has exactly two buckets: `apps/` and `domains/`

- **`usecases/apps/<surface>/`** — the **product surfaces** (`modeller` · `visualiser` · `designer`). A story here is about *the tool*; its dataset is a prop. Model it, explore it, style it.
- **`usecases/domains/<domain>/`** — the **verticals** (`code-kg` · `cora` · `microservices` · …). A story here is about *the picture a domain needs*; `GraphCanvasApp` is a given. Several styling / layout configs of one dataset are **sibling files in that domain's folder** — e.g. `domains/code-kg/{DotsForce,CompositeCards,HealthBadges}`.

**Don't add a third bucket.** An engine-capability demo wearing a use-case costume is **not** a use case — it belongs under the owning package's namespace (`graph/Nodes/…`, `canvas/Concepts/…`). Titles are lowercase and mirror the path exactly (`usecases/domains/code-kg/DotsForce`).

Two neighbouring namespaces are deliberately distinct:

- `usecases/apps/` vs **`canvas-ui/apps/GraphCanvasApp/`** — the latter teaches the *component's API* (regions, chrome slots, `bundle={false}`, `keepMounted`); the former shows a *tool built with it*.
- `usecases/apps/designer/` vs **`canvas-designer/`** — the latter is stories for the `@invana/canvas-designer` package's own authoring surfaces; the former imports none of that package's code (it's `GraphCanvasApp` + `CanvasSettingsEditorPanel`, both canvas-ui). If canvas-designer ships its planned studio shell, the designer use case moves there and the namespace rule takes over.

Full taxonomy + move manifest: [`docs/usecases-storybook-taxonomy-plan.md`](../../docs/usecases-storybook-taxonomy-plan.md).

Inside the `@invana/canvas` namespace, the seven core engine concepts each get a folder (`canvas/Concepts/...`):

- `Canvas/Concepts/Shapes/...`      — shape primitives (rectangle, circle, polygon, glyph / icon fills, image fills). In a graph context these are the **nodes**.
- `Canvas/Connectors/...`  — connector pipeline: `Anchors/`, `Routers/`, `PathStyles/`, `ConnectorTypes/`.
- `Canvas/Decorations/...` — decorations painted *alongside / on top of* a host (glow, halo, pulse-ring, badge). Additive geometry. Static by default; animated decorations also live here.
- `Canvas/Effects/...`     — effects that *modulate* a host (shake, breathing, shimmer). No new geometry — they tweak the host's transform or style channels each frame.
- `Canvas/Animations/...`  — per-frame motion across any animatable target where the *motion itself* is the subject of the story: viewport tweens, camera fly-to, easing comparisons.
- `Canvas/Layers/...`      — built-in layers: `BackgroundLayer`, `DevInfoLayer`, `LayersPanelLayer`, etc.
- `Canvas/Behaviours/...`  — registrable behaviours: `DragPanBehaviour`, `WheelZoomBehaviour`, etc.
- `Canvas/Events/...`      — canvas / layer event demos.

### Layout-package stories — `graph-layouts/<flavour>/...`

Stories for any `@invana/graph-layout-<flavour>` package live under a *single* shared parent folder, namespaced by the package suffix (the package name with the `graph-layout-` prefix stripped):

```
apps/storybook/stories/graph-layouts/
├── d3-force/          ← @invana/graph-layout-d3-force
│   ├── Lattice.stories.ts
│   ├── LesMiserables.stories.ts
│   └── …
├── d3-hierarchy/      ← @invana/graph-layout-d3-hierarchy
│   ├── Sunburst.stories.ts
│   ├── Tree.stories.ts
│   └── …
└── elkjs/             ← @invana/graph-layout-elkjs (future)
```

Title fields match the path exactly: `title: 'graph-layouts/<flavour>/<Name>'` — e.g. `'graph-layouts/d3-force/Lattice'`, `'graph-layouts/d3-hierarchy/Sunburst'`. The sidebar then groups all layout flavours under one top-level `graph-layouts` node (a sibling of `canvas` and `graph`) with one child per layout package, instead of scattering them as siblings under `canvas`.

The layer packages (`@invana/graph-layer-*`) follow the same shape under a top-level `graph-layers/<name>/...` group — `title: 'graph-layers/d3-contour/DensityContourFillLayer'`, `'graph-layers/maplibre/Airports'`, etc.

When adding a new layout package `@invana/graph-layout-<X>`, create `apps/storybook/stories/graph-layouts/<X>/` and write the story titles as `graph-layouts/<X>/<Name>`. Don't put layout-package stories under `Graph/Layer/`, `Canvas/Layers/`, or a flat `graph-layouts-<X>/` folder — those are the wrong neighbours.

### Decorations vs. Effects vs. Animations

These are three orthogonal concepts; they compose. See `packages/canvas/CLAUDE.md` and `architecture-proposal.md` §2.7 for the full story.

- **Decoration** — what is drawn *alongside* a host. Additive geometry painted on top of a shape or connector (glow, halo, pulse-ring, marching-ants, badge). Static by default; can opt into animation via `tick(dt)`. Source: `packages/canvas/src/primitives/decorations/`.
- **Effect** — a *modulation* of the host itself. No new geometry — transform-effects (`shake`, `breathing`) write `{dx, dy, dRot, sx, sy}` deltas the renderer composes onto the host gfx; style-effects write tint/alpha overrides. Source: `packages/canvas/src/primitives/effects/`.
- **Animation** — the per-frame `tick(deltaMs)` engine. Both animated decorations and effects opt in via `tick`. Animation also drives camera easing, viewport transitions, etc.

In storybook this means:
- A static decoration story (e.g. `Glow`) lives under `Canvas/Decorations/`.
- An animated decoration story (e.g. `PulseRing`, `AnimatedGlow`) also lives under `Canvas/Decorations/` — animation is a property of the decoration.
- An effect story (`Shake`, `Breathing`) lives under `Canvas/Effects/`.
- A story whose primary subject is the *animation engine itself* — viewport tweens, shape transitions, camera fly-to, easing comparisons — lives under `Canvas/Animations/`.
- A composed-effects proof for a given host kind lives under that host's `Effects/` folder (e.g. `Canvas/Effects/Shapes/ComposedEffects`, `Canvas/Effects/Connectors/ComposedEffects`) — it's a proof about how effects + decorations compose on that host, not about the animation engine.

Rules:

- Story files: `<Name>.stories.ts`. Title format: `'<Package>/<Area>/<Subarea>'` mirroring the filesystem path exactly.
- **One story per file — no exceptions, including declarative `canvas-react` stories.** Each `.stories.ts(x)` exports **exactly one** named story. **Variants ship as separate files, never as extra exports in one file:** a component with two demos (e.g. `Canvas` with telemetry on vs. off) becomes a **folder** of one-story files — `canvas-react/Canvas/WithTelemetry.stories.tsx` + `canvas-react/Canvas/WithoutTelemetry.stories.tsx`, titles `canvas-react/Canvas/WithTelemetry` etc. (mirroring the folder path).

- **The single story is named for its subject, and the sidebar must show ONE FLAT LEAF — never a component node wrapping a single child.** Since every file holds exactly one story, the sidebar should read like the filesystem: a `GraphLegendLayer` leaf, not `GraphLegendLayer ▸ Graph Legend`. That nested "table" shape is a bug, not a style choice — fix it, don't ship it.

  Storybook only collapses a one-story file when the story's **display name equals the title's last segment**. It start-cases the export name (`DevInfo` → `"Dev Info"`), so an export named after a *shortened* subject silently nests: title `canvas/concepts/Layers/DevInfoLayer` + `export const DevInfo` → `"Dev Info"` ≠ `"DevInfoLayer"` → nested. The fix is an explicit `name`:

  ```ts
  const meta: Meta = { title: 'canvas/concepts/Layers/GraphLegendLayer' };  // last segment = the subject
  export default meta;

  // Export is `<Subject>Story` — the bare `GraphLegendLayer` would collide with
  // the imported class. `name` matches the title's last segment → one flat leaf.
  export const GraphLegendLayerStory: Story = {
    name: 'GraphLegendLayer',
    render: () => createContainer({ id: 'cvs-graph-legend-layer' }),
    play: async ({ canvasElement }) => { /* … */ },
  };
  ```

  So: **file `<Subject>.stories.ts` · title `…/<Subject>` · `export const <Subject>Story` · `name: '<Subject>'`** — all four agree, and `<Subject>` is the class/component name in full (`GraphLegendLayer`, not `GraphLegend`). The `Story` suffix on the export is what keeps it from shadowing the imported class; keep it even where there'd be no collision, so every file reads the same. Variant files use the variant as the subject (`WithTelemetry.stories.tsx` → title `…/WithTelemetry`, `export const WithTelemetryStory`, `name: 'WithTelemetry'`).

  > Several older stories still nest (`BackgroundLayer ▸ Background`, `DevInfoLayer ▸ Dev Info`, `LayersPanelLayer ▸ …`). They predate this rule — normalise one when you're already editing it, and don't copy their shape into a new file.
- **Every story file is self-contained — show the full implementation inline.** A developer reading (or copying from) one story file must see **everything** needed to reproduce it: the data, the styling, the config, and the complete React tree, all in that file. **Do NOT extract shared setup into a helper module** (no `scene.tsx` exporting a `*Scene` component, no shared data module) — that hides the implementation the story is meant to teach. **Accept the duplication** across sibling variant files; the story is documentation first, DRY second. `canvas-react/Canvas/WithTelemetry.stories.tsx` is the reference.
- **All story code lives in the one story function — no extra components, no module-level story logic (unless I explicitly ask).** Everything goes in the story's own render function: for **declarative React** stories that's `render()` (put `useState`, effects, event handlers, and the data — via `useMemo` when it must stay a stable reference so a re-render doesn't reload the engine — **right inside `render`**); for **imperative** stories that's `play` (per "Writing a story"). **Do not create a `*Demo` / `*Scene` / any wrapper or sub-component** in a story file, and don't hoist story data/config/handlers to module scope — a stateful, interactive story is still one `render` function. The only module-level things are the `meta`, the single `Story` export, and imports. (This supersedes the older "keep data as module-level consts" guidance — inline it in `render`, memoised.) Add a helper component **only** when I explicitly ask for one.
- No raw `pixi.js` imports inside stories — go through `@invana/canvas` / `@invana/graph` public API.

## Shapes & Renderer stories

Keep these minimal and focused:

- Draw **one or two graphics at most** — the goal is to demonstrate the drawing/rendering capability, not to fill the canvas.
- Always wire up a **lil-gui panel** to expose the relevant settings (fill color, stroke width, alpha, radius, etc.) so the viewer can interactively explore the options.
- Update the graphic(s) live when the user tweaks a control — destroy and redraw, or mutate properties, whatever is cleanest for that shape.

```ts
import GUI from 'lil-gui';

// inside play:
const settings = { fillColor: 0x4a90d9, strokeWidth: 2, alpha: 1 };
const gui = new GUI({ title: 'Rect settings' });
gui.addColor(settings, 'fillColor').onChange(redraw);
gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
```

## Writing a story

Always use the **`render` + `play`** pattern. Never use `requestAnimationFrame`.

**Put everything inside `play`.** All constants, helper functions, shape data, settings objects, and GUI setup must be defined inside the `play` function body — not at module level. Storybook's "Show code" tab only renders the story object literal; anything declared outside `play` is invisible to readers of that tab.

- `render` — synchronously returns the container DOM element via `createContainer`.
- `play` — async; runs after Storybook mounts the element; all canvas init goes here.

`createContainer` lives in `stories/div-util.ts`. Canvas is queried from `canvasElement` using the container's `id`.

```ts
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'canvas/concepts/Area/SubArea' };
export default meta;
type Story = StoryObj;

export const MyStory: Story = {
  render: () => createContainer({ id: 'cvs-my-story' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-my-story')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    // ... add layers, draw shapes, etc.
  },
};
```

### Graph / layout stories — `GraphCanvas` + serialisable config

**Canonical example: `stories/graph-layouts/d3-force/Lattice.stories.ts`. Write new graph/layout stories this way.**

The shape is **add everything, then `init()` last**:

1. `const canvas = new GraphCanvas()` (from `@invana/graph`). Register cleanup first.
2. **Register** layers / behaviours / layouts **by id** (mounting is deferred until `init`). Only *wiring* + non-serialisable bits go in the constructor: ids, `layerId` / `targetLayerId`, resolver functions, and the graph layer's initial content via **`options.initData`** (data is content, not config — it rides on the layer).
3. Build **one `const canvasOptions`** object — the whole serialisable config keyed by id: `layers` (per-id option bags, e.g. `graph.node.style`), `behaviours` (`{ enabled: true, … }` — `enabled` turns it on), `layouts` (per-id params), and `activeLayout`. No class refs, no functions — pure JSON.
4. `await canvas.init({ container, autoResize: true, config: canvasOptions })` **last**. It mounts everything, applies the config, and enables behaviours. The `activeLayout` auto-runs against its target once data is present — **don't call `setData`/`layout.apply` for the initial render**.
5. **lil-gui binds straight to `canvasOptions`** (the config *is* the source of truth) and pushes each change live via `canvas.update({ … })`. Layout/force edits go through `canvas.update({ layouts: { … } })` and re-heat the sim — no rebuild.
6. **OS dark-mode** = `@invana/graph`'s `ThemeBehaviour` in single-layer shorthand: register it with a `targetLayerId` (`'bg'`); its `light` / `dark` `{ backgroundColor, color }` patches live in `config.behaviours.theme`, and the default `mode: 'system'` follows `prefers-color-scheme`. (Drop the `light`/`dark` shorthand and set `active` instead to drive a full named palette across the whole canvas.)
7. Datasets generators return `GraphNode` / `GraphEdge` directly (e.g. `generateLattice(n)`) — feed `options.initData` with no mapping.

```ts
const canvas = new GraphCanvas();
onStoryTeardown(() => canvas.destroy());

const graph = new GraphLayer({ id: 'graph', options: { initData: generateLattice(20) } });
canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
canvas.layers.add(graph);
canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));
const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
canvas.layouts.add(forceLayout);

const canvasOptions = {
  layers: {
    bg: { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#475569' },
    graph: { node: { style: { shape: { kind: 'circle', radius: 3 }, bgFill: 0x60a5fa } },
             edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8 } } },
  },
  behaviours: {
    pan: { enabled: true },
    theme: { enabled: true, mode: 'system',
      light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
      dark:  { backgroundColor: '#0f172a', color: '#475569' } },
  },
  layouts: { force: { alpha: 1, link: { distance: 30 }, charge: { strength: -30 } } },
  activeLayout: 'force',
};
await canvas.init({ container, autoResize: true, config: canvasOptions });
// done — initData loads on mount, the active layout runs itself.

// GUI edits push live:
gui.addColor(canvasOptions.layers.graph.node.style, 'bgFill')
   .onChange((v) => canvas.update({ layers: { graph: { node: { style: { bgFill: v } } } } }));
```

Teardown still applies: `onStoryTeardown(() => canvas.destroy())`, `gui.destroy()`, and `forceLayout.stop()` (the layout instance is kept only for stop).

## Teardown — every story must register cleanup

Storybook keeps the iframe alive across story switches, so anything a story creates (Canvas, lil-gui panels, ResizeObservers, event listeners, RAF loops) leaks into the next story unless explicitly destroyed. The global `beforeEach` in `.storybook/preview.ts` drains a per-story cleanup queue between stories — your job is to populate that queue.

**Rule:** register cleanup **inline, right next to the thing being created**, using `onStoryTeardown` from `stories/div-util.ts`. Don't lift refs to module scope and don't batch teardown at the bottom of `play` — co-locating creation and destruction keeps it readable and survives refactors.

```ts
import { createContainer, onStoryTeardown } from '../../div-util';

play: async ({ canvasElement }) => {
  const container = canvasElement.querySelector<HTMLDivElement>('#cvs-my-story')!;

  const canvas = new Canvas();
  onStoryTeardown(() => canvas.destroy());
  await canvas.init({ container, autoResize: true });

  const gui = new GUI({ title: 'My settings' });
  onStoryTeardown(() => gui.destroy());
  // ... gui.add(...) etc.
},
```

What needs a teardown:

- **`new Canvas()`** — always `onStoryTeardown(() => canvas.destroy())`.
- **`new GUI(...)`** — always `onStoryTeardown(() => gui.destroy())`. The preview also sweeps stray `.lil-gui` DOM nodes as a belt-and-braces fallback, but don't rely on it.
- **Manually added `window` / `document` event listeners** — `onStoryTeardown(() => window.removeEventListener(...))`.
- **`ResizeObserver`, `MutationObserver`, `IntersectionObserver`** — disconnect in teardown.
- **`setInterval` / `setTimeout` (long-lived)** — clear in teardown.
- **`requestAnimationFrame` loops** — don't write these in stories (use the engine's animation loop), but if one slips in, cancel it in teardown.

What does **not** need a teardown:

- Layers and behaviours registered on the Canvas — `canvas.destroy()` tears them down.
- Shapes added via a renderer attached to a Canvas-owned layer — same.
- DOM nodes inside the container returned from `render` — Storybook unmounts the container itself.

Don't try to lift teardown into a `beforeEach` on the story object or a decorator: the things being destroyed are *created during `play`*, so any external hook would need a reference back into play's closure. The inline `onStoryTeardown` pattern is the cleanest available — keep it that way.

`createContainer` options:

| Option | Default | Description |
|---|---|---|
| `id` | `'canvas-example'` | DOM id — must be unique per story, used to query the element in `play` |
| `height` | `'100vh'` | CSS height |
| `width` | — | CSS width (omit to let the parent size it) |
| `title` | — | Optional heading rendered inside the container |

## Run

```bash
pnpm --filter @canvas/storybook dev    # http://localhost:6006
pnpm --filter @canvas/storybook build
```
