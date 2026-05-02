// Lucide icons rendered via full SVG markup. Lucide icons are stroke-based
// (`fill="none" stroke="currentColor"`) which is incompatible with our
// path-d wrapper that fills the path. Instead we pass the entire `<svg>…`
// document through `IconSpec.value` — `_drawSvgIcon` detects the `<svg`
// prefix and forwards it to PixiJS `Graphics.svg()` unchanged.
//
// In a real app you would import path data from `lucide-static` or use
// `createIcons()` from `lucide`; here we inline the bodies so the story is
// self-contained.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Icons/Lucide' };
export default meta;
type Story = StoryObj;

/**
 * Wrap Lucide icon body markup in the standard 24×24 stroked-icon SVG
 * envelope. `color` is interpolated into the `stroke` attribute so each
 * icon picks up the caller's chosen palette.
 */
const lucide = (body: string, color: string, strokeWidth = 2): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

// Icon bodies copied verbatim from https://lucide.dev (MIT licensed).
const ICONS = {
  globe:
    '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  zap:
    '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  bell:
    '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
  server:
    '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
  database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  cloud:
    '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 0 1 0 9"/>',
  user:
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

const COL_GAP = 160;
const ROW_GAP = 170;

const ITEMS = [
  { id: 'globe',    name: 'globe'    },
  { id: 'heart',    name: 'heart'    },
  { id: 'zap',      name: 'zap'      },
  { id: 'bell',     name: 'bell'     },
  { id: 'server',   name: 'server'   },
  { id: 'database', name: 'database' },
  { id: 'cloud',    name: 'cloud'    },
  { id: 'user',     name: 'user'     },
];

const buildNodes = (color: string): INodeData[] =>
  ITEMS.map((it, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    return {
      id:    it.id,
      shape: 'circle',
      x:     (col - 1.5) * COL_GAP,
      y:     (row - 0.5) * ROW_GAP,
      size:  90,
      label: it.name,
      icon: {
        type: 'svg',
        value: lucide(ICONS[it.id as keyof typeof ICONS], color),
        size: 36,
      },
    };
  });

const launch = async (nodes: INodeData[]) => {
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
          data: { nodes, edges: [] },
          styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
        },
      },
    ],
  });
  await canvas.init();
};

export const White: Story = {
  name: 'Lucide (white stroke)',
  render: () => createContainer(),
  play: async () => { await launch(buildNodes('#ffffff')); },
};

export const Tinted: Story = {
  name: 'Lucide (per-icon color)',
  render: () => createContainer(),
  play: async () => {
    const palette: Record<string, string> = {
      globe: '#60a5fa', heart: '#fb7185', zap: '#fbbf24', bell: '#a78bfa',
      server: '#4ade80', database: '#22d3ee', cloud: '#cbd5e1', user: '#f472b6',
    };
    const nodes = buildNodes('#ffffff').map((n) => ({
      ...n,
      icon: {
        type: 'svg' as const,
        value: lucide(ICONS[n.id as keyof typeof ICONS], palette[n.id]!),
        size: 36,
      },
    }));
    await launch(nodes);
  },
};

// One node combining a Lucide icon with the default selected halo + a badge.
export const IconWithDecorations: Story = {
  name: 'Lucide + halo + badge',
  render: () => createContainer(),
  play: async () => {
    await launch([
      {
        id: 'srv',
        shape: 'circle',
        x: 0, y: 0,
        size: 130,
        label: 'API server',
        icon: {
          type: 'svg',
          value: lucide(ICONS.server, '#ffffff', 2.2),
          size: 56,
        },
        badges: [
          { position: 'TR', shape: 'circle', text: '3', fill: '#dc2626', fontSize: 11 },
        ],
        states: ['selected'],
      },
    ]);
  },
};
