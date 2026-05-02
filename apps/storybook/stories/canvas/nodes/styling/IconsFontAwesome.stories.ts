// FontAwesome icons rendered as font glyphs. Two families ship in the free
// CDN bundle:
//   • Solid    → fontFamily 'Font Awesome 6 Free', fontWeight '900'
//   • Brands   → fontFamily 'Font Awesome 6 Brands', fontWeight '400'
//
// Codepoints are FontAwesome's Private Use Area assignments — see
// https://docs.fontawesome.com/icons. The webfont is loaded by
// `apps/storybook/.storybook/preview-head.html`.
//
// Pixi rasterises Text at creation time, so we wait for `document.fonts.ready`
// before initialising the canvas — otherwise the first paint shows tofu and
// the cached glyph never updates.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Icons/FontAwesome' };
export default meta;
type Story = StoryObj;

const FA_SOLID  = 'Font Awesome 6 Free';
const FA_BRANDS = 'Font Awesome 6 Brands';
const SOLID_WT  = '900';
const BRANDS_WT = '400';

const COL_GAP = 160;
const ROW_GAP = 170;

// ── Solid icon set ───────────────────────────────────────────────────────────
const SOLID = [
  { id: 'house',    cp: '', label: 'house'    },
  { id: 'server',   cp: '', label: 'server'   },
  { id: 'database', cp: '', label: 'database' },
  { id: 'cloud',    cp: '', label: 'cloud'    },
  { id: 'user',     cp: '', label: 'user'     },
  { id: 'bell',     cp: '', label: 'bell'     },
  { id: 'gear',     cp: '', label: 'gear'     },
  { id: 'rocket',   cp: '', label: 'rocket'   },
];

// ── Brand icons ──────────────────────────────────────────────────────────────
const BRANDS = [
  { id: 'github', cp: '', label: 'github' },
  { id: 'aws',    cp: '', label: 'aws'    },
  { id: 'docker', cp: '', label: 'docker' },
  { id: 'google', cp: '', label: 'google' },
];

const GRID_NODES = (
  items: { id: string; cp: string; label: string }[],
  family: string,
  weight: string,
  cols: number,
): INodeData[] =>
  items.map((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      id:    it.id,
      shape: 'circle',
      x:     (col - (cols - 1) / 2) * COL_GAP,
      y:     (row - 0.5) * ROW_GAP,
      size:  90,
      label: it.label,
      icon: {
        type: 'font',
        value: it.cp,
        fontFamily: family,
        fontWeight: weight,
        size: 36,
        color: '#ffffff',
      },
    };
  });

const launch = async (nodes: INodeData[]) => {
  const container = document.getElementById('canvas-example');
  if (!container) return;

  // Wait for the FontAwesome face to load — otherwise Pixi rasterises tofu.
  if (typeof document.fonts?.ready?.then === 'function') {
    await document.fonts.ready;
  }

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

export const Solid: Story = {
  name: 'Solid (8 icons)',
  render: () => createContainer(),
  play: async () => { await launch(GRID_NODES(SOLID, FA_SOLID, SOLID_WT, 4)); },
};

export const Brands: Story = {
  name: 'Brands (4 icons)',
  render: () => createContainer(),
  play: async () => { await launch(GRID_NODES(BRANDS, FA_BRANDS, BRANDS_WT, 4)); },
};

// One node combining a brand icon with the default selected halo.
export const BrandWithHalo: Story = {
  name: 'Brand icon + selected halo',
  render: () => createContainer(),
  play: async () => {
    await launch([
      {
        id: 'gh',
        shape: 'circle',
        x: 0, y: 0,
        size: 130,
        label: 'GitHub',
        icon: {
          type: 'font',
          value: '',  // fa-brands fa-github
          fontFamily: FA_BRANDS,
          fontWeight: BRANDS_WT,
          size: 56,
          color: '#ffffff',
        },
        states: ['selected'],
      },
    ]);
  },
};
