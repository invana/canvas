/**
 * Edge Stroke Styles
 *
 * Renders several connector types (straight, bezier, orthogonal) and exposes a
 * lil-gui panel to tweak stroke properties in real time.
 *
 * Controls:
 *   - Stroke colour
 *   - Stroke width
 *   - Stroke alpha
 *   - Stroke cap (butt / round / square)
 *   - Stroke join (miter / round / bevel)
 *   - Stroke alignment (0 = inner … 1 = outer)
 *   - Stroke miter limit
 *
 * API used:
 *   ShapesPlugin.updateConnector(id, { style: { … } })
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import {
  ShapesPlugin,
  type CircleShapeSpec,
  type BaseConnectorSpec,
} from '@invana/plugins-shapes';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Edges/Styling/Stroke' };
export default meta;
type Story = StoryObj;

const NODE_R  = 26;
const COL_GAP = 340;
const ROW_GAP = 120;

const ANCHOR_STYLE = { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 };
const BG_OPTS = {
  key: 'bg', type: 'pattern', patternType: 'grid',
  color: '#1e293b', backgroundColor: '#0f172a', size: 1, spacing: 40,
} as const;

interface RowDef {
  id:       string;
  connType: string;
  label:    string;
  color:    string;
  dy:       number;
  router?:  string;
}

const ROWS: RowDef[] = [
  { id: 'straight',   connType: 'straight',   label: 'straight',   color: '#4fc3f7', dy: 0  },
  { id: 'bezier',     connType: 'bezier',     label: 'bezier',     color: '#81c784', dy: 0  },
  { id: 'orthogonal', connType: 'orthogonal', label: 'orthogonal', color: '#ffb74d', dy: 60 },
];

export const EdgeStroke: Story = {
  name: 'Stroke',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin(BG_OPTS));

    const shapes = new ShapesPlugin({ key: 'shapes' });
    await canvas.plugins.register(shapes);

    // ── Build anchors and connectors ────────────────────────────────────────
    const ids: string[] = [];
    const startY = -((ROWS.length - 1) * ROW_GAP) / 2;

    ROWS.forEach((row, i) => {
      const rowY = startY + i * ROW_GAP;
      const lx   = -COL_GAP / 2;
      const rx   =  COL_GAP / 2;

      shapes.addShape('circle', {
        id: `${row.id}-l`, x: lx, y: rowY,
        radius: NODE_R, style: ANCHOR_STYLE,
      } as CircleShapeSpec);

      shapes.addShape('circle', {
        id: `${row.id}-r`, x: rx, y: rowY + row.dy,
        radius: NODE_R, style: ANCHOR_STYLE,
      } as CircleShapeSpec);

      const connId = `${row.id}-conn`;
      shapes.addConnector(row.connType, {
        id:           connId,
        from:         { x: lx, y: rowY },
        to:           { x: rx, y: rowY + row.dy },
        sourceRadius: NODE_R,
        targetRadius: NODE_R,
        label:        row.label,
        endMarker:    { type: 'triangle', size: 11 },
        style:        { stroke: row.color, strokeWidth: 3 },
        router:       row.router,
      } as BaseConnectorSpec);
      ids.push(connId);
    });

    shapes.fitContent();

    // ── lil-gui panel ───────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Edge Stroke Styles', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    const params = {
      stroke: '#f97316',
      strokeWidth: 3,
      strokeAlpha: 1,
      strokeCap: 'round' as 'butt' | 'round' | 'square',
      strokeJoin: 'miter' as 'miter' | 'round' | 'bevel',
      strokeAlignment: 0.5,
      strokeMiterLimit: 10,
    };

    function applyToAll() {
      for (const id of ids) {
        const obj = shapes.getConnector(id);
        if (!obj) continue;
        const base = obj.element.spec.style ?? {};
        shapes.updateConnector(id, {
          style: {
            ...base,
            stroke: params.stroke,
            strokeWidth: params.strokeWidth,
            strokeAlpha: params.strokeAlpha,
            strokeCap: params.strokeCap,
            strokeJoin: params.strokeJoin,
            strokeAlignment: params.strokeAlignment,
            strokeMiterLimit: params.strokeMiterLimit,
          },
        } as Partial<BaseConnectorSpec>);
      }
    }

    gui.addColor(params, 'stroke').name('Stroke colour').onChange(applyToAll);
    gui.add(params, 'strokeWidth', 0, 10, 0.5).name('Stroke width').onChange(applyToAll);
    gui.add(params, 'strokeAlpha', 0, 1, 0.05).name('Stroke alpha').onChange(applyToAll);
    gui.add(params, 'strokeCap', ['butt', 'round', 'square']).name('Stroke cap').onChange(applyToAll);
    gui.add(params, 'strokeJoin', ['miter', 'round', 'bevel']).name('Stroke join').onChange(applyToAll);
    gui.add(params, 'strokeAlignment', 0, 1, 0.05).name('Stroke alignment').onChange(applyToAll);
    gui.add(params, 'strokeMiterLimit', 0, 30, 1).name('Stroke miter limit').onChange(applyToAll);

    gui.add({ reset: () => {
      params.stroke = '#f97316';
      params.strokeWidth = 3;
      params.strokeAlpha = 1;
      params.strokeCap = 'round';
      params.strokeJoin = 'miter';
      params.strokeAlignment = 0.5;
      params.strokeMiterLimit = 10;
      gui.controllers.forEach(c => c.updateDisplay());
      applyToAll();
    } }, 'reset').name('Reset');
  },
};
