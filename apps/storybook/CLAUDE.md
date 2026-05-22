# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. The sidebar mirrors the seven core engine concepts under each package namespace.

## Framework — `@storybook/react-vite`

Storybook runs on the React framework (`@storybook/react-vite`). Story files are `.stories.ts` or `.stories.tsx` and import `Meta` / `StoryObj` from `@storybook/react-vite`. Two authoring shapes coexist:

1. **Imperative / `play`-based** — the existing engine, graph, layout, and decoration stories. `render()` returns `createContainer(...)` (defined in `stories/div-util.tsx` — it returns a React element rendering a sized `<div>` with a stable id), and the `play({ canvasElement })` function queries the container by id and drives the engine imperatively. No changes from the pre-React-framework pattern; `play` runs against the same DOM shape.
2. **Declarative React** — stories for `@invana/canvas-react`. `render()` returns the React tree directly (`<Canvas><GraphLayer/>…</Canvas>`). No `play`. No `onStoryTeardown` either — the `<Canvas>` effect cleanup tears the engine down on unmount.

When in doubt: engine + graph stories follow shape (1). Anything under `canvas-react/*` follows shape (2).

## Conventions

Storybook top-level namespacing follows package names. Stories from `@invana/canvas` live under `stories/Canvas/...`; `@invana/graph` stories under `stories/Graph/...`; `@invana/canvas-react` stories under `stories/canvas-react/...` (lowercase, matching the `graph-layouts/<flavour>/` convention for non-core packages); etc.

Inside each package namespace, the seven core engine concepts each get a folder:

- `Canvas/Shapes/...`      — shape primitives (rectangle, circle, polygon, glyph / icon fills, image fills). In a graph context these are the **nodes**.
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

Title fields match the path exactly: `title: 'graph-layouts/<flavour>/<Name>'` — e.g. `'graph-layouts/d3-force/Lattice'`, `'graph-layouts/d3-hierarchy/Sunburst'`. The sidebar then groups all layout flavours under one `graph-layouts` node with one child per layout package, instead of scattering them as siblings of `Canvas` and `Graph`.

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
- **One story per file.** Each `.stories.ts` exports exactly one named story.
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

const meta: Meta = { title: 'Canvas/Area/SubArea' };
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
