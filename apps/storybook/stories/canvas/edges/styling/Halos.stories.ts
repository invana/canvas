// Edge halos — a soft outer band stroked underneath each connector when a
// halo state is active (default: 'selected'). Implemented as a second pass
// on the per-edge halo Graphics, so it never affects body redraws.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData, IEdgeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/Styling/Halos' };
export default meta;
type Story = StoryObj;

const nodes: INodeData[] = [
  { id: 'a', shape: 'circle', x: -260, y: -120, size: 70, label: 'A' },
  { id: 'b', shape: 'circle', x:  260, y: -120, size: 70, label: 'B' },
  { id: 'c', shape: 'circle', x: -260, y:    0, size: 70, label: 'C' },
  { id: 'd', shape: 'circle', x:  260, y:    0, size: 70, label: 'D' },
  { id: 'e', shape: 'circle', x: -260, y:  120, size: 70, label: 'E' },
  { id: 'f', shape: 'circle', x:  260, y:  120, size: 70, label: 'F' },
];

// All three edges have the 'selected' state pre-active so the halo is
// immediately visible. Each row shows a different connector type.
const edges: IEdgeData[] = [
  {
    id: 'e1', source: 'a', target: 'b', pathType: 'straight',
    label: 'straight',
    states: ['selected'],
  },
  {
    id: 'e2', source: 'c', target: 'd', pathType: 'bezier',
    label: 'bezier',
    states: ['selected'],
    halo: { color: '#22d3ee', width: 8, offset: 2, alpha: 0.5 },
  },
  {
    id: 'e3', source: 'e', target: 'f', pathType: 'orthogonal',
    label: 'orthogonal',
    states: ['selected'],
    halo: { color: '#f59e0b', width: 12, offset: 4, alpha: 0.4 },
  },
];

export const EdgeHalo: Story = {
  name: 'Edge Halo (default + custom)',
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
          plugin: 'graph-data', key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 80,
            data: { nodes, edges },
            styles: {
              node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 },
              edge: { stroke: '#cbd5e1', strokeWidth: 2 },
            },
          },
        },
      ],
    });
    await canvas.init();
  },
};
