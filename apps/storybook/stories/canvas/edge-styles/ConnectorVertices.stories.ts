/**
 * ElementPlugin — Connector Vertices (Waypoints)
 *
 * Demonstrates intermediate waypoints on connector specs using the `vertices`
 * field (preferred over the deprecated `waypoints` alias).
 *
 * Rows:
 *   Row 1  bezier — no vertices    → auto-computed cubic Bézier arc (curvature slider)
 *   Row 2  bezier — 1 vertex       → single mid-waypoint shapes the arc
 *   Row 3  bezier — 2 vertices     → used directly as cubic Bézier control points
 *   Row 4  bezier — S-curve        → 2 vertices placed to create an S-shape
 *   Row 5  smooth — 4 waypoints    → Catmull-Rom spline through all points
 *   Row 6  orthogonal — 2 verts    → right-angle routing threading explicit bends
 *   Row 7  bezier — waypoints      → deprecated `waypoints` alias (shown for reference)
 *
 * API fields shown:
 *   `vertices`     — preferred waypoint array
 *   `waypoints`    — deprecated alias
 *   `sourceRadius` / `targetRadius` — trims path to node boundary
 *   `curvature`    — BezierConnectorSpec arc strength
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  ElementPlugin,
  type CircleElementSpec,
  type BezierConnectorSpec,
} from '@invana/plugins-graph-data';
import { createContainer } from '../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Edge Styles/Connector Vertices' };
export default meta;
type Story = StoryObj;

const NODE_R  = 20;
const ROW_GAP = 130;
const HALF_W  = 180;
const ANCHOR  = { fill: '#0f172a', stroke: '#475569', strokeWidth: 1.5 };

interface RowDef {
  id:         string;
  label:      string;
  color:      string;
  connType:   string;
  /** Vertices are relative to the row centre; they are shifted to world space at runtime. */
  vertices?:  Array<{ x: number; y: number }>;
  /** Deprecated alias — shown only in the last row. */
  waypoints?: Array<{ x: number; y: number }>;
}

const ROWS: RowDef[] = [
  {
    id: 'auto', label: 'bezier — no vertices (auto-arc)', color: '#4fc3f7',
    connType: 'bezier',
  },
  {
    id: 'one', label: 'bezier — 1 vertex (mid-point)', color: '#81c784',
    connType: 'bezier',
    vertices: [{ x: 0, y: -60 }],
  },
  {
    id: 'two', label: 'bezier — 2 vertices (control pts)', color: '#ffb74d',
    connType: 'bezier',
    vertices: [{ x: -60, y: -80 }, { x: 60, y: 80 }],
  },
  {
    id: 'scurve', label: 'bezier — S-curve (2 ctrl pts)', color: '#f06292',
    connType: 'bezier',
    vertices: [{ x: 80, y: -80 }, { x: -80, y: 80 }],
  },
  {
    id: 'smooth', label: 'smooth — 4-waypoint Catmull-Rom', color: '#ce93d8',
    connType: 'smooth',
    vertices: [
      { x: -90, y: -70 },
      { x: -30, y:  60 },
      { x:  30, y: -60 },
      { x:  90, y:  70 },
    ],
  },
  {
    id: 'orth', label: 'orthogonal — threaded waypoints', color: '#4dd0e1',
    connType: 'orthogonal',
    vertices: [{ x: -60, y: 0 }, { x: 60, y: 0 }],
  },
  {
    id: 'legacy', label: 'bezier — waypoints (deprecated alias)', color: '#a5f3fc',
    connType: 'bezier',
    waypoints: [{ x: 0, y: 70 }],
  },
];

export const ConnectorVertices: Story = {
  name: 'Connector Vertices',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 28,
    }));

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    const totalH = (ROWS.length - 1) * ROW_GAP;
    const startY = -totalH / 2;

    ROWS.forEach((row, i) => {
      const rowY = startY + i * ROW_GAP;
      const lx   = -HALF_W;
      const rx   =  HALF_W;

      // Shift relative vertices into world space for this row
      const shiftedVertices  = row.vertices?.map(v => ({ x: v.x, y: rowY + v.y }));
      const shiftedWaypoints = row.waypoints?.map(v => ({ x: v.x, y: rowY + v.y }));

      elements.addNode('circle', {
        id: `${row.id}-l`, x: lx, y: rowY,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      elements.addNode('circle', {
        id: `${row.id}-r`, x: rx, y: rowY,
        radius: NODE_R, style: ANCHOR,
      } as CircleElementSpec);

      // Small dot markers at each vertex position
      shiftedVertices?.forEach((v, vi) => {
        elements.addNode('circle', {
          id: `${row.id}-vrt-${vi}`, x: v.x, y: v.y,
          radius: 5,
          style: { fill: row.color, fillAlpha: 0.5, stroke: row.color, strokeWidth: 1 },
        } as CircleElementSpec);
      });

      const spec: Record<string, unknown> = {
        id:           `${row.id}-conn`,
        from:         { x: lx, y: rowY },
        to:           { x: rx, y: rowY },
        sourceRadius: NODE_R,
        targetRadius: NODE_R,
        label:        row.label,
        endMarker:    { type: 'triangle', size: 10 },
        style:        { stroke: row.color, strokeWidth: 2.5 },
      };

      if (shiftedVertices)  spec['vertices']  = shiftedVertices;
      if (shiftedWaypoints) spec['waypoints'] = shiftedWaypoints;

      elements.addEdge(row.connType, spec as never);
    });

    elements.fitContent();

    // ── lil-gui: curvature slider for the auto-bezier row ─────────────────
    const params = { curvature: 80 };
    const gui = new GUI({ title: 'Bezier options', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui.add(params, 'curvature', 0, 300, 5).onChange((v: number) => {
      elements.updateEdge('auto-conn', { curvature: v } as Partial<BezierConnectorSpec>);
    });
  },
};
