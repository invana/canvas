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

Node and edge styling stories must use `GraphDataPlugin` with the declarative `plugins` array. This keeps styling stories focused on graph data rather than low-level shape API.

```typescript
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { allNodeShapeData } from '../../all-nodes-shapes.js';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/MyFeature' };
export default meta;
type Story = StoryObj;

export const MyStory: Story = {
  name: 'MyStory',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1.5,
            spacing: 30,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 60,
            data: { nodes: allNodeShapeData, edges: [] },
            styles: { node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
    // Use canvas.plugins.get<GraphDataPlugin>('graph') for runtime updates
  },
};
```

## Rules

- Import only from `@invana/canvas` — never from internal paths or `pixi.js`.
- Use `createContainer()` for the DOM mount point; never create raw `<div>` elements.
- Mirror the existing folder structure when adding new stories.
- **Node/edge styling stories must use `GraphDataPlugin`** — never `ShapesPlugin` directly.
- Register plugins with `Canvas.registerPlugin()` before using them declaratively in `CanvasOptions.plugins`.
