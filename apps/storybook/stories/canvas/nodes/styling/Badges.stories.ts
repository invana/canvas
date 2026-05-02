// Badges anchored to one of eight positions on the bounding box:
//   T  TR  R  BR  B  BL  L  TL.
// Each badge has a background (`pill` | `circle` | `rect`), text and/or icon,
// and a per-anchor outward `offset`.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import type { BadgePosition, BadgeSpec } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Badges' };
export default meta;
type Story = StoryObj;

const POSITIONS: BadgePosition[] = ['T', 'TR', 'R', 'BR', 'B', 'BL', 'L', 'TL'];

const POSITION_COLOR: Record<BadgePosition, string> = {
  T:  '#ef4444', TR: '#f97316', R:  '#eab308', BR: '#22c55e',
  B:  '#06b6d4', BL: '#3b82f6', L:  '#8b5cf6', TL: '#ec4899',
};

// Story 1 — one node, eight badges, one per position.
export const AllPositions: Story = {
  name: 'All 8 Positions',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const badges: BadgeSpec[] = POSITIONS.map((pos) => ({
      position: pos,
      text: pos,
      shape: 'pill',
      fill: POSITION_COLOR[pos],
      textColor: '#ffffff',
      fontSize: 11,
    }));

    const node: INodeData = {
      id: 'n1', shape: 'circle', x: 0, y: 0, size: 140,
      label: 'badges',
      badges,
    };

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
            fitPadding: 100,
            data: { nodes: [node], edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// Story 2 — three badge shape variants (pill, circle, rect) with text vs icon
// vs combined content.
export const ShapeVariants: Story = {
  name: 'Pill / Circle / Rect',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      {
        id: 'pill', shape: 'rect', x: -200, y: 0, width: 120, height: 80, label: 'pill',
        badges: [
          { position: 'TR', shape: 'pill', text: 'NEW',  fill: '#16a34a' },
          { position: 'BR', shape: 'pill', text: '12',   fill: '#0ea5e9' },
        ],
      },
      {
        id: 'circle-badge', shape: 'rect', x: 0, y: 0, width: 120, height: 80, label: 'circle',
        badges: [
          { position: 'TR', shape: 'circle', text: 'A', fill: '#7c3aed', fontSize: 14 },
          { position: 'BL', shape: 'circle', icon: { type: 'unicode', value: '⚠', size: 14, color: '#ffffff' }, fill: '#dc2626' },
        ],
      },
      {
        id: 'rect-badge', shape: 'rect', x: 200, y: 0, width: 120, height: 80, label: 'rect',
        badges: [
          { position: 'T', shape: 'rect', text: 'STATUS', fill: '#1f2937', stroke: '#94a3b8', strokeWidth: 1 },
          { position: 'B', shape: 'rect', text: 'OK',     fill: '#15803d' },
        ],
      },
    ];

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
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};

// Story 3 — G6-inspired layout: a node with the same set of decorations as
// the documentation diagram (Important + Notice pills, A circle).
export const GraphLikeExample: Story = {
  name: 'G6-style Example',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const node: INodeData = {
      id: 'g6', shape: 'circle', x: 0, y: 0, size: 110,
      label: 'label',
      icon: { type: 'unicode', value: '🌐', size: 36 },
      badges: [
        { position: 'TR', shape: 'circle', text: 'A',         fill: '#475569', fontSize: 11 },
        { position: 'R',  shape: 'pill',   text: 'Important', fill: '#dc2626', fontSize: 11 },
        { position: 'BR', shape: 'pill',   text: 'Notice',    fill: '#f59e0b', fontSize: 11 },
      ],
      states: ['selected'],
    };

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
            fitPadding: 100,
            data: { nodes: [node], edges: [] },
            styles: { node: { fill: '#2563eb', stroke: '#bfdbfe', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};
