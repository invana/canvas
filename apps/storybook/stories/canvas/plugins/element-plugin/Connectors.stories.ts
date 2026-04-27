/**
 * ElementPlugin — Connectors
 *
 * All six built-in connector types shown between pairs of circle anchors.
 *
 * Stories:
 *   Connectors        — all six types with labels
 *   Connector Offset  — interactive sourceOffset / targetOffset controls via lil-gui
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import {
  Canvas, BackgroundPlugin, ElementPlugin,
  type CircleElementSpec,
} from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: '3. Edge Styles/Connectors' };
export default meta;
type Story = StoryObj;

// ── Shared constants ──────────────────────────────────────────────────────────

const NODE_R      = 26;
const COL_GAP     = 340;
const ROW_GAP     = 120;
const ANCHOR_STYLE = { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 };
const BG_OPTS     = { key: 'bg', type: 'pattern', patternType: 'grid',
                      color: '#1e293b', backgroundColor: '#0f172a', size: 1, spacing: 40 } as const;

interface RowDef {
  id:       string;
  connType: string;
  label:    string;
  color:    string;
  /** Extra Y offset for the target node (creates a bend for orth-style). */
  dy:       number;
  router?:  string;
  /** Relative waypoint offsets from the row midpoint. */
  wverts?:  Array<{ xOff: number; yOff: number }>;
}

const ROWS: RowDef[] = [
  { id: 'straight',   connType: 'straight',  label: 'straight',             color: '#4fc3f7', dy: 0  },
  { id: 'bezier',     connType: 'bezier',    label: 'bezier',               color: '#81c784', dy: 0  },
  { id: 'orthogonal', connType: 'orthogonal',label: 'orthogonal',           color: '#ffb74d', dy: 60 },
  { id: 'quadratic',  connType: 'quadratic', label: 'quadratic',            color: '#f06292', dy: 0  },
  { id: 'rounded',    connType: 'rounded',   label: 'rounded + orth router',color: '#ce93d8', dy: 60, router: 'orth' },
  { id: 'smooth',     connType: 'smooth',    label: 'smooth (Catmull-Rom)', color: '#4dd0e1', dy: 0,
    wverts: [{ xOff: -50, yOff: -60 }, { xOff: 50, yOff: 60 }] },
];

/** Build the shared element grid and return the connector id list for later updates. */
function buildScene(
  elements: ElementPlugin,
  prefix: string,
  sourceOffset: number,
  targetOffset: number,
): string[] {
  const ids: string[] = [];
  const startY = -((ROWS.length - 1) * ROW_GAP) / 2;

  ROWS.forEach((row, i) => {
    const rowY = startY + i * ROW_GAP;
    const lx   = -COL_GAP / 2;
    const rx   =  COL_GAP / 2;

    elements.addSolid('circle', {
      id: `${prefix}${row.id}-l`, x: lx, y: rowY,
      radius: NODE_R, style: ANCHOR_STYLE,
    } as CircleElementSpec);

    elements.addSolid('circle', {
      id: `${prefix}${row.id}-r`, x: rx, y: rowY + row.dy,
      radius: NODE_R, style: ANCHOR_STYLE,
    } as CircleElementSpec);

    const midX  = (lx + rx) / 2;
    const verts = row.wverts?.map(v => ({ x: midX + v.xOff, y: rowY + v.yOff }));

    const connId = `${prefix}${row.id}`;
    const spec: Record<string, unknown> = {
      id:           connId,
      from:         { x: lx, y: rowY },
      to:           { x: rx, y: rowY + row.dy },
      sourceRadius: NODE_R,
      targetRadius: NODE_R,
      sourceOffset,
      targetOffset,
      label:        row.label,
      endMarker:    { type: 'triangle', size: 11 },
      style:        { stroke: row.color, strokeWidth: 2.5 },
    };
    if (verts?.length) spec['vertices'] = verts;
    if (row.router)    spec['router']   = row.router;

    elements.addConnector(row.connType, spec as never);
    ids.push(connId);
  });

  return ids;
}

// ── Story: Connectors ─────────────────────────────────────────────────────────

export const Connectors: Story = {
  name: 'Connectors',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin(BG_OPTS));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 80 });
    await canvas.plugins.register(elements);

    buildScene(elements, '', 0, 0);
    elements.fit();
  },
};

// ── Story: Connector Offset ───────────────────────────────────────────────────

export const ConnectorOffset: Story = {
  name: 'Connector Offset',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin(BG_OPTS));

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true, fitPadding: 80 });
    await canvas.plugins.register(elements);

    const params = { sourceOffset: 8, targetOffset: 8 };
    const ids = buildScene(elements, 'off-', params.sourceOffset, params.targetOffset);
    elements.fit();

    const gui = new GUI({ title: 'Connector Offset', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const applyOffsets = () => {
      for (const id of ids) {
        elements.updateConnector(id, {
          sourceOffset: params.sourceOffset,
          targetOffset: params.targetOffset,
        } as never);
      }
    };

    gui.add(params, 'sourceOffset', 0, 40, 1).name('source offset').onChange(applyOffsets);
    gui.add(params, 'targetOffset', 0, 40, 1).name('target offset').onChange(applyOffsets);
  },
};
