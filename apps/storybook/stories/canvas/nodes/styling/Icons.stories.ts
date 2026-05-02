// Icons centred inside nodes. Three sources are supported:
//   - 'unicode'  → emoji or single character via Text
//   - 'font'     → icon-font codepoint (FontAwesome, Lucide, Material Symbols)
//   - 'svg'      → SVG path 'd' attribute (24×24 viewBox assumed)
//
// The 'font' demo uses Material Symbols Outlined (loaded via Google Fonts in
// `apps/storybook/.storybook/preview-head.html`); skipped here unless the
// font is actually present.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Icons' };
export default meta;
type Story = StoryObj;

// Lucide-style 'globe' icon path (24×24 viewBox). Public domain examples for
// the SVG demo; real apps would import paths from `lucide-static` or similar.
const SVG_GLOBE =
  'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm0-16a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8Zm0 16a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8Z';

const SVG_HEART =
  'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z';

const SVG_BOLT =
  'M13 2 3 14h8l-1 8 10-12h-8l1-8z';

const COL_GAP = 160;
const ROW_GAP = 170;

const nodes: INodeData[] = [
  // Row 0 — unicode emoji
  { id: 'u1', shape: 'circle', x: -1.5 * COL_GAP, y: -ROW_GAP / 2, size: 80, label: 'unicode',
    icon: { type: 'unicode', value: '🌍', size: 32 } },
  { id: 'u2', shape: 'circle', x: -0.5 * COL_GAP, y: -ROW_GAP / 2, size: 80, label: 'unicode',
    icon: { type: 'unicode', value: '⚡', size: 32 } },
  { id: 'u3', shape: 'circle', x:  0.5 * COL_GAP, y: -ROW_GAP / 2, size: 80, label: 'unicode',
    icon: { type: 'unicode', value: '★', size: 36, color: '#fbbf24' } },
  { id: 'u4', shape: 'circle', x:  1.5 * COL_GAP, y: -ROW_GAP / 2, size: 80, label: 'unicode',
    icon: { type: 'unicode', value: 'A', size: 36, color: '#ffffff' } },

  // Row 1 — svg paths
  { id: 's1', shape: 'circle', x: -1.5 * COL_GAP, y:  ROW_GAP / 2, size: 80, label: 'svg globe',
    icon: { type: 'svg', value: SVG_GLOBE, size: 36, color: '#ffffff' } },
  { id: 's2', shape: 'circle', x: -0.5 * COL_GAP, y:  ROW_GAP / 2, size: 80, label: 'svg heart',
    icon: { type: 'svg', value: SVG_HEART, size: 36, color: '#fb7185' } },
  { id: 's3', shape: 'circle', x:  0.5 * COL_GAP, y:  ROW_GAP / 2, size: 80, label: 'svg bolt',
    icon: { type: 'svg', value: SVG_BOLT, size: 36, color: '#fbbf24' } },
  // Row 1 last cell — font (only renders if Material Symbols font is loaded
  // by the host page; otherwise falls back to the codepoint as plain text).
  { id: 'f1', shape: 'circle', x:  1.5 * COL_GAP, y:  ROW_GAP / 2, size: 80, label: 'font',
    icon: {
      type: 'font',
      value: '',     // material symbols 'home'
      fontFamily: 'Material Symbols Outlined',
      size: 32,
      color: '#ffffff',
    } },
];

export const Icons: Story = {
  name: 'Icons (unicode + svg + font)',
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
            data: { nodes, edges: [] },
            styles: { node: { fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 } },
          },
        },
      ],
    });
    await canvas.init();
  },
};
