/**
 * Node Styles — Borders & Stroke
 *
 * Shows all shape types with the same border settings.
 * GUI controls update every shape simultaneously — visual regression
 * test for border width, color, alpha, and dash on all shape types.
 *
 * Rows: Solid widths · Dashed · Dotted · Colored · Alpha
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Borders' };
export default meta;
type Story = StoryObj;

// ── All shape types with shared builder ───────────────────────────────────────
const SHAPE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function buildRow(rowId: string, y: number, getBorder: (i: number) => ShapeSpec['border']): ShapeSpec[] {
  const GAP = 160;
  const N = 6;
  const startX = -(N - 1) / 2 * GAP;
  const specs: ShapeSpec[] = [];

  const shapeConfigs = [
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-circle-${i}`,  type: 'circle',  x, y, radius: 45, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-ellipse-${i}`, type: 'ellipse', x, y, radiusX: 60, radiusY: 28, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-rect-${i}`,    type: 'rect',    x: x - 42, y: y - 40, width: 84, height: 80, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-hex-${i}`,     type: 'polygon', x, y, radius: 45, sides: 6, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-star-${i}`,    type: 'star',    x, y, radius: 45, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
    (x: number, i: number, border: ShapeSpec['border']) => ({ id: `${rowId}-tri-${i}`,     type: 'polygon', x, y, radius: 45, sides: 3, fill: { type: 'solid' as const, color: SHAPE_COLORS[i]! }, border }),
  ];

  for (let i = 0; i < N; i++) {
    const x = startX + i * GAP;
    specs.push(shapeConfigs[i]!(x, i, getBorder(i)) as ShapeSpec);
  }
  return specs;
}

// Track all node IDs per row for bulk updates
function rowIds(rowId: string): string[] {
  const types = ['circle', 'ellipse', 'rect', 'hex', 'star', 'tri'];
  return types.map((t, i) => `${rowId}-${t}-${i}`);
}

export const NodeBorders: Story = {
  name: 'Node Borders',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#2a2a3e', backgroundColor: '#1a1a2e', size: 1.5, spacing: 30,
    }));
    const devInfo = new DevInfoPlugin({ key: 'dev-info', enabled: false });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    // Row configs
    const widths = [1, 2, 4, 6, 8, 10];
    const dashPatterns = [
      { length: 4, gap: 2 }, { length: 6, gap: 3 }, { length: 8, gap: 4 },
      { length: 12, gap: 6 }, { length: 16, gap: 8 }, { length: 2, gap: 2 },
    ];
    const borderColors = ['#ef4444','#f59e0b','#22c55e','#0ea5e9','#a855f7','#ec4899'];
    const alphaValues = [0.15, 0.3, 0.5, 0.7, 0.85, 1.0];

    const GAP_Y = 160;
    const rows: ShapeSpec[] = [
      ...buildRow('w', -320, i => ({ color: '#ffffff', width: widths[i]!, alpha: 0.8 })),
      ...buildRow('d', -320 + GAP_Y, i => ({ color: '#ffffff', width: 2, dash: dashPatterns[i] })),
      ...buildRow('c', -320 + GAP_Y * 2, i => ({ color: borderColors[i]!, width: 3, alpha: 0.9 })),
      ...buildRow('a', -320 + GAP_Y * 3, i => ({ color: '#ffffff', width: 4, alpha: alphaValues[i]! })),
    ];

    const GAP = 160;
    const N = 6;
    const startX = -(N - 1) / 2 * GAP;
    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, i) => ({
      id: `chdr-${i}`, type: 'label', x: startX + i * GAP, y: -400, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = [
      { id: 'rhdr-w', type: 'label', x: startX - 110, y: -320,           text: 'Solid widths', color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'rhdr-d', type: 'label', x: startX - 110, y: -320 + GAP_Y,   text: 'Dashed',       color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'rhdr-c', type: 'label', x: startX - 110, y: -320 + GAP_Y*2, text: 'Colors',       color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'rhdr-a', type: 'label', x: startX - 110, y: -320 + GAP_Y*3, text: 'Alpha',        color: '#555', fontSize: 10 } as ShapeSpec,
    ];

    // Sub-labels under row 1
    const subLabels: ShapeSpec[] = widths.map((w, i) => ({
      id: `wlbl-${i}`, type: 'label', x: startX + i * GAP, y: -320 + 60, text: `w=${w}`, color: '#666', fontSize: 9,
    } as ShapeSpec));

    shapes.setData([...colHeaders, ...rowHeaders, ...rows, ...subLabels]);

    const gui = new GUI({ title: 'Node Borders', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      borderColor: '#ffffff',
      borderWidth: 2,
      borderAlpha: 0.8,
      dashed: false,
      dashLength: 8,
      dashGap: 4,
      devInfo: false,
    };

    const applyToAll = () => {
      const border: ShapeSpec['border'] = {
        color: state.borderColor,
        width: state.borderWidth,
        alpha: state.borderAlpha,
        ...(state.dashed ? { dash: { length: state.dashLength, gap: state.dashGap } } : {}),
      };
      // Apply to ALL rows simultaneously
      ['w','d','c','a'].forEach(rowId => {
        rowIds(rowId).forEach(id => shapes.update(id, { border }));
      });
    };

    const lf = gui.addFolder('Live Controls (all shapes)');
    lf.addColor(state, 'borderColor').name('Color').onChange(applyToAll);
    lf.add(state, 'borderWidth', 0.5, 16, 0.5).name('Width').onChange(applyToAll);
    lf.add(state, 'borderAlpha', 0, 1, 0.05).name('Alpha').onChange(applyToAll);
    lf.add(state, 'dashed').name('Dashed').onChange(applyToAll);
    lf.add(state, 'dashLength', 1, 30, 1).name('Dash length').onChange(applyToAll);
    lf.add(state, 'dashGap', 1, 20, 1).name('Dash gap').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
