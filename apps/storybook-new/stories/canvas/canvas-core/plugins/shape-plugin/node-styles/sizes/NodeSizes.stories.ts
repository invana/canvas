/**
 * Node Styles — Sizes & Scaling
 *
 * Shows every shape type at different sizes.
 * GUI size slider rescales all shapes simultaneously — visual regression
 * test for radius / width / height across all shape types.
 *
 * Columns: Circle · Ellipse · Rect · Hexagon · Star · Triangle
 * Rows: XS → XL sizes
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Sizes' };
export default meta;
type Story = StoryObj;

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const COL_LABELS = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'];
const SIZE_LABELS = ['XS','S','M','L','XL'];
const BASE_SIZES = [12, 22, 35, 50, 68];
const COL_GAP = 160;
const ROW_GAP = 160;
const N_COLS = 6;
const N_ROWS = 5;
const startX = -(N_COLS - 1) / 2 * COL_GAP;
const startY = -(N_ROWS - 1) / 2 * ROW_GAP;

const wb = { color: '#ffffff', width: 1.5, alpha: 0.55 };

function buildAllNodes(sizeMultiplier = 1): ShapeSpec[] {
  const nodes: ShapeSpec[] = [];
  for (let ri = 0; ri < N_ROWS; ri++) {
    const r = BASE_SIZES[ri]! * sizeMultiplier;
    const y = startY + ri * ROW_GAP;
    for (let ci = 0; ci < N_COLS; ci++) {
      const x = startX + ci * COL_GAP;
      const fill = { type: 'solid' as const, color: COLORS[ci]! };
      switch (ci) {
        case 0: nodes.push({ id: `sz-c-${ri}`,  type: 'circle',  x, y, radius: r, fill, border: wb }); break;
        case 1: nodes.push({ id: `sz-e-${ri}`,  type: 'ellipse', x, y, radiusX: r * 1.4, radiusY: r * 0.65, fill, border: wb }); break;
        case 2: nodes.push({ id: `sz-r-${ri}`,  type: 'rect',    x: x - r, y: y - r * 0.95, width: r * 2, height: r * 1.9, fill, border: wb }); break;
        case 3: nodes.push({ id: `sz-h-${ri}`,  type: 'polygon', x, y, radius: r, sides: 6, fill, border: wb }); break;
        case 4: nodes.push({ id: `sz-s-${ri}`,  type: 'star',    x, y, radius: r, fill, border: wb }); break;
        case 5: nodes.push({ id: `sz-t-${ri}`,  type: 'polygon', x, y, radius: r, sides: 3, fill, border: wb }); break;
      }
    }
  }
  return nodes;
}

export const NodeSizes: Story = {
  name: 'Node Sizes & Scaling',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'grid',
      color: '#2a2a3e', backgroundColor: '#1a1a2e', size: 3, spacing: 40,
    }));
    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const colHeaders: ShapeSpec[] = COL_LABELS.map((lbl, ci) => ({
      id: `szchdr-${ci}`, type: 'label', x: startX + ci * COL_GAP, y: startY - 110, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = SIZE_LABELS.map((lbl, ri) => ({
      id: `szrhdr-${ri}`, type: 'label', x: startX - 110, y: startY + ri * ROW_GAP, text: lbl, color: '#666', fontSize: 10,
    } as ShapeSpec));
    const sizeLabels: ShapeSpec[] = BASE_SIZES.map((r, ri) => ({
      id: `szrlbl-${ri}`, type: 'label', x: startX - 110, y: startY + ri * ROW_GAP + 18, text: `r=${r}`, color: '#444', fontSize: 9,
    } as ShapeSpec));

    shapes.setData([...colHeaders, ...rowHeaders, ...sizeLabels, ...buildAllNodes()]);

    const gui = new GUI({ title: 'Node Sizes', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = { sizeMultiplier: 1.0, showBorder: true, devInfo: true };

    const applyToAll = () => {
      const allNodes = buildAllNodes(state.sizeMultiplier);
      allNodes.forEach(n => {
        const border = state.showBorder ? wb : undefined;
        shapes.update(n.id, { ...(n as Record<string, unknown>), border });
      });
    };

    gui.add(state, 'sizeMultiplier', 0.3, 2.5, 0.05).name('Size ×').onChange(applyToAll);
    gui.add(state, 'showBorder').name('Show border').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
