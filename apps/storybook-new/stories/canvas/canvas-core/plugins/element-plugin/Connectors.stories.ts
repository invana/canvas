/**
 * ElementPlugin - Connectors
 *
 * All six built-in connector types shown between pairs of circle anchors:
 *
 *  Row 1  straight   - direct line
 *  Row 2  bezier     - smooth auto-curving Bezier
 *  Row 3  orthogonal - right-angle L-shape
 *  Row 4  quadratic  - quadratic Bezier (single control point)
 *  Row 5  rounded    - orthogonal with rounded corners (pair with orth router)
 *  Row 6  smooth     - Catmull-Rom spline through waypoints
 *
 * Demonstrates:
 *   - `endMarker` spec (preferred over deprecated `endArrow`)
 *   - `startMarker` spec
 *   - `vertices` field (preferred over deprecated `waypoints`)
 *   - `label` on a connector
 *   - `style` (PathStyle: stroke, strokeWidth)
 *   - `router: 'orth'` on the rounded connector
 */
import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
} from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/canvas-core/Plugins/ElementPlugin' };
export default meta;
type Story = StoryObj;

const NODE_R  = 26;
const COL_GAP = 340;
const ROW_GAP = 120;
const ANCHOR_STYLE = { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 };

interface RowDef {
  id: string;
  connType: string;
  label: string;
  color: string;
  /** Extra Y offset for the target node (creates a bend for orth-style). */
  dy: number;
  router?: string;
  /** Relative waypoint offsets from the midpoint. */
  wverts?: Array<{ xOff: number; yOff: number }>;
}

const ROWS: RowDef[] = [
  { id: 'straight',   connType: 'straight',   label: 'straight',              color: '#4fc3f7', dy: 0  },
  { id: 'bezier',     connType: 'bezier',      label: 'bezier',                color: '#81c784', dy: 0  },
  { id: 'orthogonal', connType: 'orthogonal',  label: 'orthogonal',            color: '#ffb74d', dy: 60 },
  { id: 'quadratic',  connType: 'quadratic',   label: 'quadratic',             color: '#f06292', dy: 0  },
  { id: 'rounded',    connType: 'rounded',     label: 'rounded + orth router', color: '#ce93d8', dy: 60, router: 'orth' },
  { id: 'smooth',     connType: 'smooth',      label: 'smooth (Catmull-Rom)',  color: '#4dd0e1', dy: 0,
    wverts: [{ xOff: -50, yOff: -60 }, { xOff: 50, yOff: 60 }] },
];

export const Connectors: Story = {
  name: 'Connectors',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();

    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'grid',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1, spacing: 40,
    }));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 80 });
    await canvas.plugins.register(elements);

    const startY = -((ROWS.length - 1) * ROW_GAP) / 2;

    ROWS.forEach((row, i) => {
      const rowY = startY + i * ROW_GAP;
      const lx   = -COL_GAP / 2;
      const rx   =  COL_GAP / 2;

      elements.addSolid('circle', {
        id: `${row.id}-l`, x: lx, y: rowY,
        radius: NODE_R, style: ANCHOR_STYLE,
      } as CircleElementSpec);

      elements.addSolid('circle', {
        id: `${row.id}-r`, x: rx, y: rowY + row.dy,
        radius: NODE_R, style: ANCHOR_STYLE,
      } as CircleElementSpec);

      const midX = (lx + rx) / 2;
      const verts = row.wverts?.map(v => ({ x: midX + v.xOff, y: rowY + v.yOff }));

      const spec: Record<string, unknown> = {
        id:        row.id,
        from:      { x: lx + NODE_R, y: rowY },
        to:        { x: rx - NODE_R, y: rowY + row.dy },
        label:     row.label,
        endMarker: { type: 'triangle', size: 11 },
        style:     { stroke: row.color, strokeWidth: 2.5 },
      };
      if (verts?.length) spec['vertices'] = verts;
      if (row.router)    spec['router']   = row.router;

      elements.addConnector(row.connType, spec as never);
    });

    elements.fit();
  },
};
