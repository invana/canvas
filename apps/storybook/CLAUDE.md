# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. Rebuilt fresh as part of the architecture rewrite.

**Status:** skeleton — only a Welcome page so far. Stories to port are listed in `migration-storybook-inventory.md` at repo root; that file is the authoritative checklist.

## Conventions

- Stories live under `stories/<area>/...` mirroring the new structure proposed in the inventory:
  - `stories/Renderer/...`  ← primitive renderer demos
  - `stories/Layers/...`                  ← `BackgroundLayer`, `MiniMapLayer`, `ThemedBackgroundLayer`, `DevInfoLayer`
  - `stories/Behaviours/...`              ← `HoverActivate`, `ClickSelect`, `LassoSelect`, etc.
  - `stories/Layouts/...`                 ← `D3ForceLayout`, `ElkLayout`
  - `stories/Layer/Graph/...`             ← `GraphLayer`-specific stories
  - `stories/Showcase/...`                ← end-to-end demos
- Story files: `<Name>.stories.ts`. Title format: `'<Area>/<Subarea>'`.
- **One story per file.** Each `.stories.ts` file exports exactly one named story.
- No raw `pixi.js` imports inside stories — go through `@invana/canvas` / `@invana/graph` API.

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

- `render` — synchronously returns the container DOM element via `createContainer`.
- `play` — async; runs after Storybook mounts the element; all canvas init goes here.

`createContainer` lives in `stories/div-util.ts`. Canvas is queried from `canvasElement` using the container's `id`.

```ts
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Area/SubArea' };
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
