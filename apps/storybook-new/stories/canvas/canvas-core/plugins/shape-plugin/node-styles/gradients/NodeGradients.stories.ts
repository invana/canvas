/**
 * Node Styles — Gradients
 *
 * Shows every shape type with gradient fills.
 * GUI controls update all shapes simultaneously — visual regression
 * test for linear / radial gradients across all shape types.
 *
 * Rows: Linear H · Linear V · Linear 45° · Multi-stop · Radial
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec, FillSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Gradients' };
export default meta;
type Story = StoryObj;

const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const wb = { color: '#ffffff', width: 1.5, alpha: 0.55 };

function shapeAt(si: number, x: number, y: number, fill: FillSpec): ShapeSpec {
  switch (si) {
    case 0: return { id: `g-circle-${y}`,  type: 'circle',  x, y, radius: 45, fill, border: wb };
    case 1: return { id: `g-ellipse-${y}`, type: 'ellipse', x, y, radiusX: 60, radiusY: 28, fill, border: wb };
    case 2: return { id: `g-rect-${y}`,    type: 'rect',    x: x - 42, y: y - 40, width: 84, height: 80, fill, border: wb };
    case 3: return { id: `g-hex-${y}`,     type: 'polygon', x, y, radius: 45, sides: 6, fill, border: wb };
    case 4: return { id: `g-star-${y}`,    type: 'star',    x, y, radius: 45, fill, border: wb };
    default: return { id: `g-tri-${y}`,    type: 'polygon', x, y, radius: 45, sides: 3, fill, border: wb };
  }
}

function gradientRow(y: number, fill: FillSpec): ShapeSpec[] {
  return Array.from({ length: N }, (_, si) =>
    shapeAt(si, startX + si * GAP, y, fill)
  );
}

export const NodeGradients: Story = {
  name: 'Node Gradients',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#0f172a' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: '#0f172a', size: 1.5, spacing: 30,
    }));
    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const ROW_Y = [-280, -120, 40, 200, 360];
    const COL_LABELS = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'];

    const colHeaders: ShapeSpec[] = COL_LABELS.map((lbl, i) => ({
      id: `ghdr-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[0]! - 80, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));

    const rowDefs: { label: string; fill: FillSpec }[] = [
      { label: 'Linear 0°',  fill: { type: 'linear', angle: 0,   stops: [{ offset: 0, color: '#ff006e' }, { offset: 1, color: '#0ea5e9' }] } },
      { label: 'Linear 90°', fill: { type: 'linear', angle: 90,  stops: [{ offset: 0, color: '#fbbf24' }, { offset: 1, color: '#10b981' }] } },
      { label: 'Linear 45°', fill: { type: 'linear', angle: 45,  stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#f59e0b' }] } },
      { label: 'Multi-stop', fill: { type: 'linear', angle: 0,   stops: [{ offset: 0, color: '#ff006e' }, { offset: 0.5, color: '#fbbf24' }, { offset: 1, color: '#0ea5e9' }] } },
      { label: 'Radial',     fill: { type: 'radial',             stops: [{ offset: 0, color: '#ffffff' }, { offset: 0.5, color: '#86efac' }, { offset: 1, color: '#10b981' }] } },
    ];

    const rowHeaders: ShapeSpec[] = rowDefs.map(({ label }, ri) => ({
      id: `grhdr-${ri}`, type: 'label', x: startX - 110, y: ROW_Y[ri]!, text: label, color: '#555', fontSize: 10,
    } as ShapeSpec));

    const allRows: ShapeSpec[] = rowDefs.flatMap(({ fill }, ri) => gradientRow(ROW_Y[ri]!, fill));

    shapes.setData([...colHeaders, ...rowHeaders, ...allRows]);

    const gui = new GUI({ title: 'Node Gradients', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      type: 'linear' as 'linear' | 'radial',
      angle: 0,
      colorA: '#ff006e',
      colorB: '#0ea5e9',
      threeStop: false,
      colorMid: '#fbbf24',
      devInfo: true,
    };

    const applyToAll = () => {
      const stops = state.threeStop
        ? [{ offset: 0, color: state.colorA }, { offset: 0.5, color: state.colorMid }, { offset: 1, color: state.colorB }]
        : [{ offset: 0, color: state.colorA }, { offset: 1, color: state.colorB }];
      const fill: FillSpec = state.type === 'linear'
        ? { type: 'linear', angle: state.angle, stops }
        : { type: 'radial', stops };
      // Update every shape across all rows
      allRows.forEach(n => shapes.update(n.id, { fill }));
    };

    const lf = gui.addFolder('Live Gradient (all shapes)');
    lf.add(state, 'type', ['linear', 'radial']).name('Type').onChange(applyToAll);
    lf.add(state, 'angle', 0, 360, 5).name('Angle').onChange(applyToAll);
    lf.addColor(state, 'colorA').name('Color A').onChange(applyToAll);
    lf.addColor(state, 'colorB').name('Color B').onChange(applyToAll);
    lf.add(state, 'threeStop').name('3-stop').onChange(applyToAll);
    lf.addColor(state, 'colorMid').name('Mid color').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
