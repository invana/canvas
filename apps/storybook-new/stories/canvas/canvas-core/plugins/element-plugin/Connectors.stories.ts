/**
 * ElementPlugin — Connectors
 *
 * All three built-in connector types between pairs of circle anchors:
 *
 *  Row 1  Straight connector
 *  Row 2  Bezier connector (auto-curve)
 *  Row 3  Orthogonal connector (L-shape routing)
 *
 * Also shows:
 *   - `endArrow` spec  (triangle arrowhead)
 *   - `label` on a connector
 *   - `style` (PathStyle: stroke, strokeWidth)
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

const NODE_R = 30;
const ANCHOR_FILL = '#334155';
const ANCHOR_STROKE = '#94a3b8';

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

    const COL_GAP = 300;   // horizontal gap between anchor pairs
    const ROW_GAP = 130;   // vertical spacing between rows
    const ROWS = [
      { id: 'straight',    connType: 'straight',    label: 'Straight',    color: '#4fc3f7', y: -ROW_GAP },
      { id: 'bezier',      connType: 'bezier',      label: 'Bezier',      color: '#81c784', y: 0 },
      { id: 'orthogonal',  connType: 'orthogonal',  label: 'Orthogonal',  color: '#ffb74d', y: ROW_GAP },
    ];

    for (const row of ROWS) {
      const lx = -COL_GAP / 2;
      const rx =  COL_GAP / 2;
      const { y } = row;

      // Left anchor node
      elements.addSolid('circle', {
        id: `${row.id}-left`, x: lx, y,
        radius: NODE_R,
        style: { fill: ANCHOR_FILL, stroke: ANCHOR_STROKE, strokeWidth: 1.5 },
      } as CircleElementSpec);
      // Right anchor node
      elements.addSolid('circle', {
        id: `${row.id}-right`, x: rx, y,
        radius: NODE_R,
        style: { fill: ANCHOR_FILL, stroke: ANCHOR_STROKE, strokeWidth: 1.5 },
      } as CircleElementSpec);

      // Connector
      elements.addConnector(row.connType, {
        id: row.id,
        from: { x: lx + NODE_R, y },
        to:   { x: rx - NODE_R, y },
        label: row.label,
        endArrow: { type: 'triangle', size: 12 },
        style: { stroke: row.color, strokeWidth: 2.5 },
      });
    }

    elements.fit();
  },
};
