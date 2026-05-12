# CLAUDE.md — apps/storybook (`@canvas/storybook`)

Storybook for the new architecture. The sidebar mirrors the seven core engine concepts under each package namespace.

## Conventions

Storybook top-level namespacing follows package names. Stories from `@invana/canvas` live under `stories/Canvas/...`; future `@invana/graph` stories will live under `stories/Graph/...`, etc.

Inside each package namespace, the seven core engine concepts each get a folder:

- `Canvas/Shapes/...`      — shape primitives (rectangle, circle, polygon, glyph / icon fills, image fills). In a graph context these are the **nodes**.
- `Canvas/Connectors/...`  — connector pipeline: `Anchors/`, `Routers/`, `PathStyles/`, `ConnectorTypes/`.
- `Canvas/Decorations/...` — decorations painted *alongside / on top of* a host (glow, halo, pulse-ring, badge). Additive geometry. Static by default; animated decorations also live here.
- `Canvas/Effects/...`     — effects that *modulate* a host (shake, breathing, shimmer). No new geometry — they tweak the host's transform or style channels each frame.
- `Canvas/Animations/...`  — per-frame motion across any animatable target where the *motion itself* is the subject of the story: viewport tweens, camera fly-to, easing comparisons, composed-effects proof stories.
- `Canvas/Layers/...`      — built-in layers: `BackgroundLayer`, `DevInfoLayer`, `LayersPanelLayer`, etc.
- `Canvas/Behaviours/...`  — registrable behaviours: `DragPanBehaviour`, `WheelZoomBehaviour`, etc.
- `Canvas/Events/...`      — canvas / layer event demos.

### Decorations vs. Effects vs. Animations

These are three orthogonal concepts; they compose. See `packages/canvas/CLAUDE.md` and `architecture-proposal.md` §2.7 for the full story.

- **Decoration** — what is drawn *alongside* a host. Additive geometry painted on top of a shape or connector (glow, halo, pulse-ring, marching-ants, badge). Static by default; can opt into animation via `tick(dt)`. Source: `packages/canvas/src/primitives/decorations/`.
- **Effect** — a *modulation* of the host itself. No new geometry — transform-effects (`shake`, `breathing`) write `{dx, dy, dRot, sx, sy}` deltas the renderer composes onto the host gfx; style-effects write tint/alpha overrides. Source: `packages/canvas/src/primitives/effects/`.
- **Animation** — the per-frame `tick(deltaMs)` engine. Both animated decorations and effects opt in via `tick`. Animation also drives camera easing, viewport transitions, etc.

In storybook this means:
- A static decoration story (e.g. `Glow`) lives under `Canvas/Decorations/`.
- An animated decoration story (e.g. `PulseRing`, `AnimatedGlow`) also lives under `Canvas/Decorations/` — animation is a property of the decoration.
- An effect story (`Shake`, `Breathing`) lives under `Canvas/Effects/`.
- A story whose primary subject is the *animation engine itself* — viewport tweens, shape transitions, camera fly-to, easing comparisons, composed-effects proofs — lives under `Canvas/Animations/`.

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
