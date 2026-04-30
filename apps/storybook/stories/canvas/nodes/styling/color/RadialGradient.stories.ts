/**
 * Node Styles — Radial Gradient
 *
 * Demonstrates radial gradient fills on every built-in node shape.
 * Uses GraphDataPlugin with per-shape radial gradients mapped by node id.
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
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import type { INodeData } from '@invana/plugins-graph-data';
import { allNodeShapeData } from '../../../all-nodes-shapes.js';
import { createContainer } from '../../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

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

// ── Per-shape radial gradient fills (index matches allNodeShapeData order) ────
const radialFills: Record<string, FillGradient> = {
  'shape-circle':       centreGlow('#b2f5ff', '#0e7490'),          // circle        — white → cyan
  'shape-ellipse':      centreGlow('#fce7f3', '#7e22ce'),          // ellipse       — pink → purple
  'shape-rect':         centreGlow('#fef08a', '#c2410c'),          // rect          — yellow → orange
  'shape-rounded-rect': centreGlow('#d1fae5', '#065f46'),          // rounded rect  — mint → forest
  'shape-diamond':      threeStop('#fef2f2', '#ef4444', '#1e1b4b'), // diamond    — red centre → violet
  'shape-hexagon':      threeStop('#e0f2fe', '#38bdf8', '#0f172a'), // hexagon    — sky blue → navy
  'shape-triangle':     cornerGlow('#fecdd3', '#9f1239'),          // triangle      — rose upper-left
  'shape-pentagon':     cornerGlow('#fef3c7', '#92400e'),          // pentagon      — amber upper-left
  'shape-star5':        threeStop('#ede9fe', '#818cf8', '#1e1b4b'), // star 5pt   — white → indigo
  'shape-star6':        centreGlow('#ccfbf1', '#134e4a'),          // star 6pt      — teal → dark teal
};

export const RadialGradient: Story = {
  name: 'Radial Gradient',
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
            styles: {
              node: {
                fill: (node: INodeData) => radialFills[node.id],
                stroke: '#ffffff',
                strokeWidth: 2,
              },
            },
          },
        },
      ],
    });
    await canvas.init();
  },
};
