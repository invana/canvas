/**
 * Node Styles — Linear Gradient
 *
 * Demonstrates linear gradient fills on every built-in node shape.
 * Each shape uses a distinct gradient direction and color scheme,
 * constructed with PixiJS 8's FillGradient in local (normalised 0–1) space.
 *
 * Gradient directions used across the grid:
 *   left → right  ·  top → bottom  ·  diagonal  ·  right → left
 *   bottom → top  ·  diagonal (alt)  …
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

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Linear Gradient' };
export default meta;
type Story = StoryObj;

// ── Gradient helpers ──────────────────────────────────────────────────────────

/** Horizontal left → right */
function hGrad(from: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0.5 },
    end:   { x: 1, y: 0.5 },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to   },
    ],
    textureSpace: 'local',
  });
}

/** Vertical top → bottom */
function vGrad(from: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0.5, y: 0 },
    end:   { x: 0.5, y: 1 },
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to   },
    ],
    textureSpace: 'local',
  });
}

/** Diagonal top-left → bottom-right */
function dGrad(from: string, mid: string, to: string): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end:   { x: 1, y: 1 },
    colorStops: [
      { offset: 0,   color: from },
      { offset: 0.5, color: mid  },
      { offset: 1,   color: to   },
    ],
    textureSpace: 'local',
  });
}

// ── Per-shape linear gradient fills (index matches allNodeShapeData order) ─────
const linearFills: Record<string, FillGradient> = {
  'shape-circle':       hGrad('#3fcbeb', '#2563eb'),          // circle    — cyan → blue (horizontal)
  'shape-ellipse':      hGrad('#a78bfa', '#ec4899'),          // ellipse   — purple → pink (horizontal)
  'shape-rect':         vGrad('#fb923c', '#fde68a'),          // rect      — orange → yellow (top → bottom)
  'shape-rounded-rect': vGrad('#34d399', '#0d9488'),          // r-rect    — green → teal (top → bottom)
  'shape-diamond':      dGrad('#ef4444', '#f97316', '#fbbf24'), // diamond   — red → orange → yellow (diagonal)
  'shape-hexagon':      dGrad('#6366f1', '#3fcbeb', '#06b6d4'), // hexagon   — indigo → cyan (diagonal)
  'shape-triangle':     hGrad('#fb7185', '#7c3aed'),          // triangle  — rose → violet (horizontal)
  'shape-pentagon':     vGrad('#38bdf8', '#10b981'),          // pentagon  — sky → emerald (top → bottom)
  'shape-star5':        dGrad('#fbbf24', '#f472b6', '#818cf8'), // star 5pt  — amber → pink (diagonal)
  'shape-star6':        hGrad('#2dd4bf', '#7c3aed'),          // star 6pt  — teal → purple (horizontal)
};

export const LinearGradient: Story = {
  name: 'Linear Gradient',
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
                fill: (node: INodeData) => linearFills[node.id],
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
