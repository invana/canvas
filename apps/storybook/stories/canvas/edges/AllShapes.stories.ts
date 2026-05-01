/**
 * Edge All-Shapes
 *
 * Six horizontal rows — items within each row rendered side-by-side.
 *
 *   Row 1 — Path types   (6)  y ≈    0 : straight · bezier · orthogonal · quadratic · rounded · smooth
 *   Row 2 — Markers A    (8)  y =  300 : triangle … square          (straight edges, dy = 0)
 *   Row 3 — Markers B    (7)  y =  490 : square-outline … none      (straight edges, dy = 0)
 *   Row 4 — Routers      (4)  y =  760 : normal · orth · oneSide · er
 *   Row 5 — Loop Curve   (4)  y = 1100 : 4-cardinal · 4-diagonal · top-right · stacked
 *   Row 6 — Loop Poly    (4)  y = 1380 : 4-cardinal · 4-diagonal · top-right · stacked
 *
 * Grid maths (for reference, not used at runtime):
 *   Row 1  cellW=220  pairW=150  dy=90   (bezier dy=110, smooth dy=0+waypoints)
 *   Row 2  cellW=190  pairW=130  dy=0
 *   Row 3  cellW=190  pairW=130  dy=0
 *   Row 4  cellW=280  pairW=190  dy=140
 *   Row 5  cellW=250  single node per cell  (self-loop, source===target)
 *   Row 6  cellW=250  single node per cell  (self-loop, source===target)
 *   Cell centre x  =  (i − (count−1)/2) × cellW
 *   Left  node     =  (cx − pairW/2,  sectionY − dy/2)
 *   Right node     =  (cx + pairW/2,  sectionY + dy/2)
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
// Nodes
// ─────────────────────────────────────────────────────────────────────────────

const nodes: INodeData[] = [

  // ── Row 1: Path Types ── cellW=220 pairW=150 dy=90 (bezier dy=110, smooth dy=0) ──

  { id: 'pt-straight-l',   x: -625, y:  -45, shape: 'circle',  size: 36 },
  { id: 'pt-straight-r',   x: -475, y:   45, shape: 'circle',  size: 36 },

  { id: 'pt-bezier-l',     x: -405, y:  -55, shape: 'ellipse', size: 36 },  // dy=110
  { id: 'pt-bezier-r',     x: -255, y:   55, shape: 'ellipse', size: 36 },

  { id: 'pt-orthogonal-l', x: -185, y:  -45, shape: 'rect',    size: 36 },
  { id: 'pt-orthogonal-r', x:  -35, y:   45, shape: 'rect',    size: 36 },

  { id: 'pt-quadratic-l',  x:   35, y:  -45, shape: 'diamond', size: 36 },
  { id: 'pt-quadratic-r',  x:  185, y:   45, shape: 'diamond', size: 36 },

  { id: 'pt-rounded-l',    x:  255, y:  -45, shape: 'hexagon', size: 36 },
  { id: 'pt-rounded-r',    x:  405, y:   45, shape: 'hexagon', size: 36 },

  { id: 'pt-smooth-l',     x:  475, y:    0, shape: 'star',    size: 36 },  // dy=0, waypoints create S-wave
  { id: 'pt-smooth-r',     x:  625, y:    0, shape: 'star',    size: 36 },

  // ── Row 2: Markers A ── cellW=190 pairW=130 dy=0  y=300 ──

  { id: 'mk-triangle-l',          x: -730, y: 300, shape: 'circle',  size: 36 },
  { id: 'mk-triangle-r',          x: -600, y: 300, shape: 'circle',  size: 36 },

  { id: 'mk-triangle-outline-l',  x: -540, y: 300, shape: 'ellipse', size: 36 },
  { id: 'mk-triangle-outline-r',  x: -410, y: 300, shape: 'ellipse', size: 36 },

  { id: 'mk-diamond-l',           x: -350, y: 300, shape: 'rect',    size: 36 },
  { id: 'mk-diamond-r',           x: -220, y: 300, shape: 'rect',    size: 36 },

  { id: 'mk-diamond-outline-l',   x: -160, y: 300, shape: 'diamond', size: 36 },
  { id: 'mk-diamond-outline-r',   x:  -30, y: 300, shape: 'diamond', size: 36 },

  { id: 'mk-circle-l',            x:   30, y: 300, shape: 'hexagon', size: 36 },
  { id: 'mk-circle-r',            x:  160, y: 300, shape: 'hexagon', size: 36 },

  { id: 'mk-circle-outline-l',    x:  220, y: 300, shape: 'polygon', size: 36, sides: 3 },
  { id: 'mk-circle-outline-r',    x:  350, y: 300, shape: 'polygon', size: 36, sides: 3 },

  { id: 'mk-circle-plus-l',       x:  410, y: 300, shape: 'polygon', size: 36, sides: 5 },
  { id: 'mk-circle-plus-r',       x:  540, y: 300, shape: 'polygon', size: 36, sides: 5 },

  { id: 'mk-square-l',            x:  600, y: 300, shape: 'star',    size: 36 },
  { id: 'mk-square-r',            x:  730, y: 300, shape: 'star',    size: 36 },

  // ── Row 3: Markers B ── cellW=190 pairW=130 dy=0  y=490 ──

  { id: 'mk-square-outline-l', x: -635, y: 490, shape: 'circle',  size: 36 },
  { id: 'mk-square-outline-r', x: -505, y: 490, shape: 'circle',  size: 36 },

  { id: 'mk-block-l',          x: -445, y: 490, shape: 'ellipse', size: 36 },
  { id: 'mk-block-r',          x: -315, y: 490, shape: 'ellipse', size: 36 },

  { id: 'mk-classic-l',        x: -255, y: 490, shape: 'rect',    size: 36 },
  { id: 'mk-classic-r',        x: -125, y: 490, shape: 'rect',    size: 36 },

  { id: 'mk-ellipse-l',        x:  -65, y: 490, shape: 'diamond', size: 36 },
  { id: 'mk-ellipse-r',        x:   65, y: 490, shape: 'diamond', size: 36 },

  { id: 'mk-cross-l',          x:  125, y: 490, shape: 'hexagon', size: 36 },
  { id: 'mk-cross-r',          x:  255, y: 490, shape: 'hexagon', size: 36 },

  { id: 'mk-async-l',          x:  315, y: 490, shape: 'polygon', size: 36, sides: 5 },
  { id: 'mk-async-r',          x:  445, y: 490, shape: 'polygon', size: 36, sides: 5 },

  { id: 'mk-none-l',           x:  505, y: 490, shape: 'star',    size: 36 },
  { id: 'mk-none-r',           x:  635, y: 490, shape: 'star',    size: 36 },

  // ── Row 4: Routers ── cellW=280 pairW=190 dy=140  y=760 ──

  { id: 'rt-normal-l',  x: -515, y: 690, shape: 'circle',  size: 36 },
  { id: 'rt-normal-r',  x: -325, y: 830, shape: 'circle',  size: 36 },

  { id: 'rt-orth-l',    x: -235, y: 690, shape: 'rect',    size: 36 },
  { id: 'rt-orth-r',    x:  -45, y: 830, shape: 'rect',    size: 36 },

  { id: 'rt-oneside-l', x:   45, y: 690, shape: 'diamond', size: 36 },
  { id: 'rt-oneside-r', x:  235, y: 830, shape: 'diamond', size: 36 },

  { id: 'rt-er-l',      x:  325, y: 690, shape: 'hexagon', size: 36 },
  { id: 'rt-er-r',      x:  515, y: 830, shape: 'hexagon', size: 36 },

  // ── Row 5: Loop Curve ── cellW=320 sectionY=1100 ──
  // 4 cells: cardinal-rosette · diagonal-rosette · single placement · stacked

  { id: 'lc-cardinal', x: -480, y: 1100, shape: 'rect',    size: 60 },
  { id: 'lc-diagonal', x: -160, y: 1100, shape: 'rect',    size: 60 },
  { id: 'lc-single',   x:  160, y: 1100, shape: 'rect',    size: 60 },
  { id: 'lc-stack',    x:  480, y: 1100, shape: 'rect',    size: 60 },

  // ── Row 6: Loop Polyline ── cellW=320 sectionY=1450 ──

  { id: 'lp-cardinal', x: -480, y: 1450, shape: 'rect', size: 60 },
  { id: 'lp-diagonal', x: -160, y: 1450, shape: 'rect', size: 60 },
  { id: 'lp-single',   x:  160, y: 1450, shape: 'rect', size: 60 },
  { id: 'lp-stack',    x:  480, y: 1450, shape: 'rect', size: 60 },

];

// ─────────────────────────────────────────────────────────────────────────────
// Edges
// ─────────────────────────────────────────────────────────────────────────────

const edges: IEdgeData[] = [

  // ── Row 1: Path Types ─────────────────────────────────────────────────────

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
    vertices: [{ x: 520, y: -60 }, { x: 580, y: 60 }],
    endMarker: { type: 'triangle', size: 11 },
    style: { stroke: '#4dd0e1', strokeWidth: 2.5 },
  },

  // ── Row 2: Markers A — straight edges so arrowhead shape is unambiguous ──

  {
    id: 'e-mk-triangle',         source: 'mk-triangle-l',         target: 'mk-triangle-r',
    pathType: 'straight', label: 'triangle',
    endMarker: { type: 'triangle', size: 14 },
    style: { stroke: '#f97316', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-triangle-outline', source: 'mk-triangle-outline-l', target: 'mk-triangle-outline-r',
    pathType: 'straight', label: 'triangle-outline',
    endMarker: { type: 'triangle-outline', size: 14 },
    style: { stroke: '#ec4899', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-diamond',          source: 'mk-diamond-l',          target: 'mk-diamond-r',
    pathType: 'straight', label: 'diamond',
    endMarker: { type: 'diamond', size: 14 },
    style: { stroke: '#a855f7', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-diamond-outline',  source: 'mk-diamond-outline-l',  target: 'mk-diamond-outline-r',
    pathType: 'straight', label: 'diamond-outline',
    endMarker: { type: 'diamond-outline', size: 14 },
    style: { stroke: '#3b82f6', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-circle',           source: 'mk-circle-l',           target: 'mk-circle-r',
    pathType: 'straight', label: 'circle',
    endMarker: { type: 'circle', size: 14 },
    style: { stroke: '#06b6d4', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-circle-outline',   source: 'mk-circle-outline-l',   target: 'mk-circle-outline-r',
    pathType: 'straight', label: 'circle-outline',
    endMarker: { type: 'circle-outline', size: 14 },
    style: { stroke: '#10b981', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-circle-plus',      source: 'mk-circle-plus-l',      target: 'mk-circle-plus-r',
    pathType: 'straight', label: 'circle-plus',
    endMarker: { type: 'circle-plus', size: 14 },
    style: { stroke: '#eab308', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-square',           source: 'mk-square-l',           target: 'mk-square-r',
    pathType: 'straight', label: 'square',
    endMarker: { type: 'square', size: 14 },
    style: { stroke: '#ef4444', strokeWidth: 2.5 },
  },

  // ── Row 3: Markers B — straight edges ────────────────────────────────────

  {
    id: 'e-mk-square-outline', source: 'mk-square-outline-l', target: 'mk-square-outline-r',
    pathType: 'straight', label: 'square-outline',
    endMarker: { type: 'square-outline', size: 14 },
    style: { stroke: '#8b5cf6', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-block',          source: 'mk-block-l',          target: 'mk-block-r',
    pathType: 'straight', label: 'block',
    endMarker: { type: 'block', size: 14 },
    style: { stroke: '#14b8a6', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-classic',        source: 'mk-classic-l',        target: 'mk-classic-r',
    pathType: 'straight', label: 'classic',
    endMarker: { type: 'classic', size: 14 },
    style: { stroke: '#f43f5e', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-ellipse',        source: 'mk-ellipse-l',        target: 'mk-ellipse-r',
    pathType: 'straight', label: 'ellipse',
    endMarker: { type: 'ellipse', size: 14 },
    style: { stroke: '#84cc16', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-cross',          source: 'mk-cross-l',          target: 'mk-cross-r',
    pathType: 'straight', label: 'cross',
    endMarker: { type: 'cross', size: 14 },
    style: { stroke: '#6366f1', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-async',          source: 'mk-async-l',          target: 'mk-async-r',
    pathType: 'straight', label: 'async',
    endMarker: { type: 'async', size: 14 },
    style: { stroke: '#fb923c', strokeWidth: 2.5 },
  },
  {
    id: 'e-mk-none',           source: 'mk-none-l',           target: 'mk-none-r',
    pathType: 'straight', label: 'none',
    endMarker: { type: 'none', size: 14 },
    style: { stroke: '#22d3ee', strokeWidth: 2.5 },
  },

  // ── Row 4: Routers — large dy forces visible bends ────────────────────────

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

  // ── Row 5: Loop Curve ─────────────────────────────────────────────────────
  // Cell 1: 4 cardinal placements on one node (top · right · bottom · left)
  ...(['top', 'right', 'bottom', 'left'] as const).map((p, i) => ({
    id: `e-lc-card-${p}`, source: 'lc-cardinal', target: 'lc-cardinal',
    pathType: 'loop-curve' as const, placement: p, loopSize: 60,
    ...(i === 0 ? { label: 'loop-curve / cardinal' } : {}),
    endMarker: { type: 'triangle' as const, size: 10 },
    style: { stroke: '#4fc3f7', strokeWidth: 2.5 },
  })),
  // Cell 2: 4 diagonal placements on one node
  ...(['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const).map((p, i) => ({
    id: `e-lc-diag-${p}`, source: 'lc-diagonal', target: 'lc-diagonal',
    pathType: 'loop-curve' as const, placement: p, loopSize: 60,
    ...(i === 0 ? { label: 'loop-curve / diagonal' } : {}),
    endMarker: { type: 'triangle' as const, size: 10 },
    style: { stroke: '#81c784', strokeWidth: 2.5 },
  })),
  // Cell 3: single diagonal placement (top-right) for clarity
  {
    id: 'e-lc-single', source: 'lc-single', target: 'lc-single',
    pathType: 'loop-curve', placement: 'top-right', loopSize: 60,
    label: 'loop-curve / top-right',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#ffb74d', strokeWidth: 2.5 },
  },
  // Cell 4: 3 stacked curve loops on same node (loopIndex 0/1/2)
  {
    id: 'e-lc-stack-0', source: 'lc-stack', target: 'lc-stack',
    pathType: 'loop-curve', placement: 'bottom', loopSize: 50, loopIndex: 0, loopSpacing: 25,
    label: 'loop-curve / stacked',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#ce93d8', strokeWidth: 2.5 },
  },
  {
    id: 'e-lc-stack-1', source: 'lc-stack', target: 'lc-stack',
    pathType: 'loop-curve', placement: 'bottom', loopSize: 50, loopIndex: 1, loopSpacing: 25,
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#9c27b0', strokeWidth: 2.5 },
  },
  {
    id: 'e-lc-stack-2', source: 'lc-stack', target: 'lc-stack',
    pathType: 'loop-curve', placement: 'bottom', loopSize: 50, loopIndex: 2, loopSpacing: 25,
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#7b1fa2', strokeWidth: 2.5 },
  },

  // ── Row 6: Loop Polyline ──────────────────────────────────────────────────
  // Wider spread + smaller leg = square loop (matches G6 visual).
  // Cell 1: 4 cardinal placements on one node
  ...(['top', 'right', 'bottom', 'left'] as const).map((p, i) => ({
    id: `e-lp-card-${p}`, source: 'lp-cardinal', target: 'lp-cardinal',
    pathType: 'loop-polyline' as const, placement: p, loopSize: 25, loopSpreadAngle: 0.4,
    ...(i === 0 ? { label: 'loop-polyline / cardinal' } : {}),
    endMarker: { type: 'triangle' as const, size: 10 },
    style: { stroke: '#4dd0e1', strokeWidth: 2.5 },
  })),
  // Cell 2: 4 diagonal placements on one node
  ...(['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const).map((p, i) => ({
    id: `e-lp-diag-${p}`, source: 'lp-diagonal', target: 'lp-diagonal',
    pathType: 'loop-polyline' as const, placement: p, loopSize: 25, loopSpreadAngle: 0.4,
    ...(i === 0 ? { label: 'loop-polyline / diagonal' } : {}),
    endMarker: { type: 'triangle' as const, size: 10 },
    style: { stroke: '#4fc3f7', strokeWidth: 2.5 },
  })),
  // Cell 3: single diagonal placement
  {
    id: 'e-lp-single', source: 'lp-single', target: 'lp-single',
    pathType: 'loop-polyline', placement: 'top-right', loopSize: 25, loopSpreadAngle: 0.4,
    label: 'loop-polyline / top-right',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#ffb74d', strokeWidth: 2.5 },
  },
  // Cell 4: 3 stacked polyline loops on same node
  {
    id: 'e-lp-stack-0', source: 'lp-stack', target: 'lp-stack',
    pathType: 'loop-polyline', placement: 'bottom', loopSize: 25, loopSpreadAngle: 0.4, loopIndex: 0, loopSpacing: 20,
    label: 'loop-polyline / stacked',
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#4dd0e1', strokeWidth: 2.5 },
  },
  {
    id: 'e-lp-stack-1', source: 'lp-stack', target: 'lp-stack',
    pathType: 'loop-polyline', placement: 'bottom', loopSize: 25, loopSpreadAngle: 0.4, loopIndex: 1, loopSpacing: 20,
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#0097a7', strokeWidth: 2.5 },
  },
  {
    id: 'e-lp-stack-2', source: 'lp-stack', target: 'lp-stack',
    pathType: 'loop-polyline', placement: 'bottom', loopSize: 25, loopSpreadAngle: 0.4, loopIndex: 2, loopSpacing: 20,
    endMarker: { type: 'triangle', size: 10 },
    style: { stroke: '#006064', strokeWidth: 2.5 },
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
