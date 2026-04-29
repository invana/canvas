/**
 * Node Styles — Radial Gradient
 *
 * Demonstrates radial gradient fills on every built-in node shape.
 * Imports `allNodeShapes` as the base node set and overrides each
 * shape's `style.fill` with a per-shape radial gradient before
 * passing the whole array to `GraphPlugin.setData()`.
 *
 * Gradient styles used:
 *   centered (inner glow)  ·  offset center  ·  three-stop
 *
 * Shapes shown (grid, 4 columns):
 *   circle · ellipse · rect · rounded-rect
 *   diamond · hexagon · triangle · pentagon
 *   star-5pt · star-6pt
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, FillGradient } from '@invana/canvas';
import { ShapesPlugin } from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';
import { allNodeShapes } from '../../all-nodes-shapes.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Radial Gradient' };
export default meta;
type Story = StoryObj;

// ── Gradient helpers ──────────────────────────────────────────────────────────

/** Centered radial gradient: bright centre → dark edge (inner glow effect). */
function centreGlow(inner: string, outer: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: [
      { offset: 0, color: inner },
      { offset: 1, color: outer },
    ],
    textureSpace: 'local',
  });
}

/** Offset radial gradient: glow from upper-left corner. */
function cornerGlow(inner: string, outer: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.25, y: 0.25 },
    innerRadius: 0,
    outerCenter: { x: 0.5,  y: 0.5  },
    outerRadius: 0.75,
    colorStops: [
      { offset: 0,   color: inner },
      { offset: 1,   color: outer },
    ],
    textureSpace: 'local',
  });
}

/** Three-stop radial: centre → mid ring → edge. */
function threeStop(c0: string, c1: string, c2: string): FillGradient {
  return new FillGradient({
    type: 'radial',
    center:      { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: [
      { offset: 0,   color: c0 },
      { offset: 0.5, color: c1 },
      { offset: 1,   color: c2 },
    ],
    textureSpace: 'local',
  });
}

// ── Per-shape radial gradient fills (index matches allNodeShapes order) ────────
const radialFills: FillGradient[] = [
  centreGlow('#b2f5ff', '#0e7490'),          // 0 circle   — white → cyan
  centreGlow('#fce7f3', '#7e22ce'),          // 1 ellipse  — pink → purple
  centreGlow('#fef08a', '#c2410c'),          // 2 rect     — yellow → orange
  centreGlow('#d1fae5', '#065f46'),          // 3 rounded rect — mint → forest
  threeStop('#fef2f2', '#ef4444', '#1e1b4b'),// 4 diamond  — red centre → violet
  threeStop('#e0f2fe', '#38bdf8', '#0f172a'),// 5 hexagon  — sky blue → navy
  cornerGlow('#fecdd3', '#9f1239'),          // 6 triangle — rose upper-left
  cornerGlow('#fef3c7', '#92400e'),          // 7 pentagon — amber upper-left
  threeStop('#ede9fe', '#818cf8', '#1e1b4b'),// 8 star 5pt — white → indigo
  centreGlow('#ccfbf1', '#134e4a'),          // 9 star 6pt — teal → dark teal
];

const BORDER = { stroke: '#ffffff', strokeWidth: 2 };
const HOVER  = { strokeWidth: 3.5 };
const SEL    = { stroke: '#ffffff', strokeWidth: 4 };

/** allNodeShapes with each style.fill replaced by the matching radial gradient. */
const nodes = allNodeShapes.map((entry, i) => ({
  ...entry,
  spec: {
    ...entry.spec,
    style:  { ...entry.spec.style,  fill: radialFills[i], ...BORDER },
    states: { hovered: HOVER, selected: SEL },
  },
}));

export const RadialGradient: Story = {
  name: 'Radial Gradient',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));

    const elements = new ShapesPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    elements.setData(nodes);
    elements.fitContent();
  },
};
