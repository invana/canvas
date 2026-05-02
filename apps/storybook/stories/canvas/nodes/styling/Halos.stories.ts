// Single-story showcase of every halo use case.
//
// The halo is a state-driven outer ring drawn underneath each shape's body.
// `halo.visibleStates` controls *when* it appears; `color`, `width`, `offset`
// and `alpha` control *how* it looks. Each node below pins one configuration.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, HoverActivatePlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling' };
export default meta;
type Story = StoryObj;

interface HaloDemo {
  shape:    string;
  label:    string;
  /** Initial active states (e.g. `['selected']`). */
  states?:  string[];
  halo?:    INodeData['halo'];
  /** Extra geometry/data fields (e.g. `sides` for polygon). */
  extra?:   Partial<INodeData>;
}

// 8 demos laid out as a 4×2 grid. Hover any node to see hover-driven halos.
const DEMOS: HaloDemo[] = [
  {
    shape: 'circle',
    label: 'Default (selected)',
    states: ['selected'],
  },
  {
    shape: 'rect',
    label: 'Custom Color',
    states: ['selected'],
    halo:  { color: '#22d3ee' },
  },
  {
    shape: 'hexagon',
    label: 'Thick Ring',
    states: ['selected'],
    halo:  { color: '#f97316', width: 14 },
  },
  {
    shape: 'diamond',
    label: 'Big Offset',
    states: ['selected'],
    halo:  { color: '#a855f7', width: 4, offset: 16 },
  },
  {
    shape: 'star',
    label: 'Subtle Alpha',
    states: ['selected'],
    halo:  { color: '#22c55e', width: 8, alpha: 0.15 },
  },
  {
    shape: 'circle',
    label: 'Hover Only ✦',
    halo:  { color: '#f43f5e', width: 8, visibleStates: ['hovered'] },
  },
  {
    shape: 'ellipse',
    label: 'Selected + Hover ✦',
    states: ['selected'],
    halo:  { color: '#eab308', width: 8, visibleStates: ['selected', 'hovered'] },
  },
  {
    shape: 'polygon',
    label: 'Halo Disabled',
    states: ['selected'],
    halo:  { visibleStates: [] },
    extra: { sides: 5 },
  },
];

const COL_GAP = 200;
const ROW_GAP = 200;

const nodes: INodeData[] = DEMOS.map((d, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  return {
    id:          `n${i}`,
    shape:       d.shape,
    x:           (col - 1.5) * COL_GAP,
    y:           (row - 0.5) * ROW_GAP,
    size:        90,
    label:       d.label,
    interactive: true,
    ...(d.states ? { states: d.states } : {}),
    ...(d.halo   ? { halo:   d.halo }   : {}),
    ...d.extra,
  } as INodeData;
});

export const HaloShowcase: Story = {
  name: 'Halo',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background', key: 'bg',
          options: {
            type: 'pattern', patternType: 'dots',
            color: '#1e293b', backgroundColor: '#0f172a',
            size: 1.5, spacing: 30,
          },
        },
        {
          plugin: 'graph-data', key: 'graph-data',
          options: {
            fitOnRender: true,
            fitPadding: 100,
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e293b', stroke: '#94a3b8', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();

    // Drive the `hovered` state so halo.visibleStates: ['hovered'] activates
    // when the pointer is over a node.
    await canvas.plugins.register(new HoverActivatePlugin({
      state:  'hovered',
      degree: 0,
    }));
  },
};
