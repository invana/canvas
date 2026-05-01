/**
 * Edge All-Shapes
 *
 * 4×4 grid — one example per edge type, all with markers.
 * cellW = 320 · cellH = 220 · col x: -480/-160/160/480 · row y: -330/-110/110/330
 *
 *   Row 0 — Path Types A : straight · bezier · orthogonal · quadratic
 *   Row 1 — Path Types B : rounded · smooth · cubic-horizontal · cubic-vertical
 *   Row 2 — Loop Types   : loop-curve · loop-polyline
 *   Row 3 — Routers      : normal · orth · oneSide · er
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IEdgeData, type INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/AllShapes' };
export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────────────────────────────────
// Nodes — pair offset within each cell: (-80, -40) and (+80, +40)
// Routers use a larger dy to force visible bends
// ─────────────────────────────────────────────────────────────────────────────

const nodes: INodeData[] = [

  // ── Row 0 (y = -330): straight · bezier · orthogonal · quadratic ─────────

  { id: 'pt-straight-l',   x: -560, y: -370, shape: 'circle',  size: 36 },
  { id: 'pt-straight-r',   x: -400, y: -290, shape: 'circle',  size: 36 },

  { id: 'pt-bezier-l',     x: -240, y: -370, shape: 'ellipse', size: 36 },
  { id: 'pt-bezier-r',     x:  -80, y: -290, shape: 'ellipse', size: 36 },

  { id: 'pt-orthogonal-l', x:   80, y: -370, shape: 'rect',    size: 36 },
  { id: 'pt-orthogonal-r', x:  240, y: -290, shape: 'rect',    size: 36 },

  { id: 'pt-quadratic-l',  x:  400, y: -370, shape: 'diamond', size: 36 },
  { id: 'pt-quadratic-r',  x:  560, y: -290, shape: 'diamond', size: 36 },

  // ── Row 1 (y = -110): rounded · smooth · cubic-h · cubic-v ───────────────

  { id: 'pt-rounded-l',    x: -560, y: -150, shape: 'hexagon', size: 36 },
  { id: 'pt-rounded-r',    x: -400, y:  -70, shape: 'hexagon', size: 36 },

  { id: 'pt-smooth-l',     x: -240, y: -110, shape: 'star',    size: 36 },
  { id: 'pt-smooth-r',     x:  -80, y: -110, shape: 'star',    size: 36 },

  { id: 'pt-cubic-h-l',    x:   80, y: -150, shape: 'circle',  size: 36 },
  { id: 'pt-cubic-h-r',    x:  240, y:  -70, shape: 'circle',  size: 36 },

  { id: 'pt-cubic-v-l',    x:  400, y: -170, shape: 'rect',    size: 36 },
  { id: 'pt-cubic-v-r',    x:  560, y:  -50, shape: 'rect',    size: 36 },

  // ── Row 2 (y = 110): Loop Types — placed in cells 0 and 1 ────────────────

  { id: 'lp-curve',        x: -480, y:  110, shape: 'rect', size: 60 },
  { id: 'lp-polyline',     x: -160, y:  110, shape: 'rect', size: 60 },

  // ── Row 3 (y = 330): Routers — dy=120 for visible bends ──────────────────

  { id: 'rt-normal-l',     x: -560, y:  270, shape: 'circle',  size: 36 },
  { id: 'rt-normal-r',     x: -400, y:  390, shape: 'circle',  size: 36 },

  { id: 'rt-orth-l',       x: -240, y:  270, shape: 'rect',    size: 36 },
  { id: 'rt-orth-r',       x:  -80, y:  390, shape: 'rect',    size: 36 },

  { id: 'rt-oneside-l',    x:   80, y:  270, shape: 'diamond', size: 36 },
  { id: 'rt-oneside-r',    x:  240, y:  390, shape: 'diamond', size: 36 },

  { id: 'rt-er-l',         x:  400, y:  270, shape: 'hexagon', size: 36 },
  { id: 'rt-er-r',         x:  560, y:  390, shape: 'hexagon', size: 36 },

];

// ─────────────────────────────────────────────────────────────────────────────
// Edges
// ─────────────────────────────────────────────────────────────────────────────

const edges: IEdgeData[] = [

  // ── Row 0 ────────────────────────────────────────────────────────────────

  {
    id: 'e-straight',   source: 'pt-straight-l',   target: 'pt-straight-r',
    pathType: 'straight',   label: 'straight',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#4fc3f7', strokeWidth: 2.5 },
  },
  {
    id: 'e-bezier',     source: 'pt-bezier-l',     target: 'pt-bezier-r',
    pathType: 'bezier',     label: 'bezier',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#81c784', strokeWidth: 2.5 },
  },
  {
    id: 'e-orthogonal', source: 'pt-orthogonal-l', target: 'pt-orthogonal-r',
    pathType: 'orthogonal', label: 'orthogonal',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#ffb74d', strokeWidth: 2.5 },
  },
  {
    id: 'e-quadratic',  source: 'pt-quadratic-l',  target: 'pt-quadratic-r',
    pathType: 'quadratic',  label: 'quadratic',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#f06292', strokeWidth: 2.5 },
  },

  // ── Row 1 ────────────────────────────────────────────────────────────────

  {
    id: 'e-rounded',    source: 'pt-rounded-l',    target: 'pt-rounded-r',
    pathType: 'rounded',    label: 'rounded',       router: 'orth',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#ce93d8', strokeWidth: 2.5 },
  },
  {
    // SmoothConnector with only 2 points draws a straight line → waypoints create the S-wave
    id: 'e-smooth',     source: 'pt-smooth-l',     target: 'pt-smooth-r',
    pathType: 'smooth',     label: 'smooth (S-wave)',
    vertices: [{ x: -210, y: -160 }, { x: -110, y: -60 }],
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#4dd0e1', strokeWidth: 2.5 },
  },
  {
    id: 'e-cubic-h',    source: 'pt-cubic-h-l',    target: 'pt-cubic-h-r',
    pathType: 'cubic-horizontal', label: 'cubic-horizontal',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#a78bfa', strokeWidth: 2.5 },
  },
  {
    id: 'e-cubic-v',    source: 'pt-cubic-v-l',    target: 'pt-cubic-v-r',
    pathType: 'cubic-vertical',   label: 'cubic-vertical',
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#f472b6', strokeWidth: 2.5 },
  },

  // ── Row 2 ────────────────────────────────────────────────────────────────

  {
    id: 'e-loop-curve', source: 'lp-curve', target: 'lp-curve',
    pathType: 'loop-curve', placement: 'top-right', loopSize: 60,
    label: 'loop-curve',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#4fc3f7', strokeWidth: 2.5 },
  },
  {
    id: 'e-loop-polyline', source: 'lp-polyline', target: 'lp-polyline',
    pathType: 'loop-polyline', placement: 'top-right', loopSize: 25, loopSpreadAngle: 0.4,
    label: 'loop-polyline',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#81c784', strokeWidth: 2.5 },
  },

  // ── Row 3 ────────────────────────────────────────────────────────────────

  {
    id: 'e-rt-normal',  source: 'rt-normal-l',  target: 'rt-normal-r',
    pathType: 'bezier',      router: 'normal',  label: 'normal router',
    startMarker: { type: 'circle',   size: 8  },
    endMarker:   { type: 'triangle', size: 11 },
    style: { stroke: '#c084fc', strokeWidth: 2.5 },
  },
  {
    id: 'e-rt-orth',    source: 'rt-orth-l',    target: 'rt-orth-r',
    pathType: 'orthogonal',  router: 'orth',    label: 'orth router',
    startMarker: { type: 'circle',   size: 8  },
    endMarker:   { type: 'triangle', size: 11 },
    style: { stroke: '#34d399', strokeWidth: 2.5 },
  },
  {
    id: 'e-rt-oneside', source: 'rt-oneside-l', target: 'rt-oneside-r',
    pathType: 'rounded',     router: 'oneSide', label: 'oneSide router',
    startMarker: { type: 'circle',   size: 8  },
    endMarker:   { type: 'triangle', size: 11 },
    style: { stroke: '#fb7185', strokeWidth: 2.5 },
  },
  {
    id: 'e-rt-er',      source: 'rt-er-l',      target: 'rt-er-r',
    pathType: 'rounded',     router: 'er',      label: 'er router',
    startMarker: { type: 'circle',   size: 8  },
    endMarker:   { type: 'triangle', size: 11 },
    style: { stroke: '#fbbf24', strokeWidth: 2.5 },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Story
// ─────────────────────────────────────────────────────────────────────────────

export const AllEdgeShapes: Story = {
  name: 'All Shapes',
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
            patternType: 'grid',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1,
            spacing: 40,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 80,
            data: { nodes, edges },
            styles: {
              node: { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 },
            },
          },
        },
      ],
    });

    await canvas.init();
  },
};
