# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. The sidebar mirrors the seven core engine concepts under each package namespace.

## Conventions

Storybook top-level namespacing follows package names. Stories from `@invana/canvas` live under `stories/Canvas/...`; future `@invana/graph` stories will live under `stories/Graph/...`, etc.

Inside each package namespace, the seven core engine concepts each get a folder:

- `Canvas/Shapes/...`      — shape primitives (rectangle, circle, polygon, glyph / icon fills, image fills). In a graph context these are the **nodes**.
- `Canvas/Connectors/...`  — connector pipeline: `Anchors/`, `Routers/`, `PathStyles/`, `ConnectorTypes/`.
- `Canvas/Decorations/...` — decorations painted on top of shapes / connectors (glow, badge, etc.). Static by default.
- `Canvas/Animations/...`  — per-frame motion across any animatable target: shapes, decorations, connectors, the viewport / camera, layer properties. Reserved; no stories yet.
- `Canvas/Layers/...`      — built-in layers: `BackgroundLayer`, `DevInfoLayer`, `LayersPanelLayer`, etc.
- `Canvas/Behaviours/...`  — registrable behaviours: `DragPanBehaviour`, `WheelZoomBehaviour`, etc.
- `Canvas/Events/...`      — canvas / layer event demos.

### Decorations vs. animations

These are orthogonal concepts and compose:

- A **decoration** is *what* is drawn — a visual primitive painted on top of a shape or connector. See `packages/canvas/src/primitives/decorations/`. Decorations are static unless they opt into animation.
- An **animation** is *how a thing changes over time*. Any subclass of `ShapeDecorationBase` can opt in by implementing `tick(deltaMs)`; the renderer auto-registers ticking decorations into its animation set and retires them on a falsy return. Animations are not limited to decorations — the same per-frame model applies to shape position / properties, viewport pan and zoom transitions, camera moves, and layer-level effects.

In storybook this means:
- A static decoration story (e.g. `Glow`) lives under `Canvas/Decorations/`.
- An animated decoration story (e.g. `PulsatingGlow`, `BreathingGlow`) also lives under `Canvas/Decorations/` — animation is just a property of that decoration.
- A story whose primary subject is the animation itself — viewport tweens, shape transitions, camera fly-to, easing comparisons — lives under `Canvas/Animations/`.

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
