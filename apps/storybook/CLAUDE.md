# CLAUDE.md — apps/storybook (@canvas/storybook)

Storybook for `@invana/canvas`. Dev server: `pnpm --filter @canvas/storybook dev` → http://localhost:6006

## Story file layout

```
stories/canvas/canvas-core/
  Camera.stories.ts
  Shapes.stories.ts
  plugins/
    background/     — BackgroundDots, BackgroundGrid, BackgroundLines, BackgroundSolid, BackgroundInteractive
    shape-plugin/   — FillStyles, ShapeSampler, EventsInteractive, BorderAnimations, BodyAnimations
      animations/   — Pulse, Breathe, FadeIn, ColorCycle, MarchingAnts, DashedFlow, BorderGlow
      node-styles/  — shape/, color/, sizes/, borders/, labels/, gradients/, halos/, icon/, image/, ...
    element-plugin/ — Connectors, Routers, SolidElements, MixedGraph, LargeGraph, States, Markers, ...
    drawing-plugin/ — DrawingPlugin.* constellation/masterpiece/kids/circuit stories
    dev-info-plugin/
stories/layouts/
  d3-force/         — D3 force-directed layout stories (e.g. LesMiserables.stories.ts)
```

**Layout stories always go under `stories/layouts/`, never under `stories/canvas/layouts/`.**

## Story pattern

```typescript
import { Canvas } from '@invana/canvas';
import { createContainer } from '../../../src/div-utils.js';
import type { StoryObj } from '@storybook/html';

type Story = StoryObj;

export default { title: 'Canvas/MyFeature' };

export const MyStory: Story = {
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    const canvas = new Canvas({ container, width: 800, height: 600 });
    await canvas.init();
    // register plugins, interact with canvas.camera / canvas.events
  }
};
```

## Rules

- Import only from `@invana/canvas` — never from internal paths or `pixi.js`.
- Use `createContainer()` for the DOM mount point; never create raw `<div>` elements.
- Mirror the existing folder structure when adding new stories.
