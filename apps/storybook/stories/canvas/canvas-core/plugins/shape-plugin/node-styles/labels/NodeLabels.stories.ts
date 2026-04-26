/**
 * Node Styles — Labels
 *
 * Shows labels placed near every shape type.
 * GUI controls update all label specs simultaneously — visual regression
 * test for font size, color, and positioning across all shape types.
 *
 * Rows: Name below · Name above · Font sizes · Colors
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Labels' };
export default meta;
type Story = StoryObj;

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const NAMES  = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const wb = { color: '#ffffff', width: 1.5, alpha: 0.55 };
const R = 38;

function baseNode(colId: string, si: number, x: number, y: number): ShapeSpec {
  const fill = { type: 'solid' as const, color: COLORS[si]! };
  switch (si) {
    case 0: return { id: `${colId}-circle`,  type: 'circle',  x, y, radius: R, fill, border: wb };
    case 1: return { id: `${colId}-ellipse`, type: 'ellipse', x, y, radiusX: R + 16, radiusY: R - 12, fill, border: wb };
    case 2: return { id: `${colId}-rect`,    type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border: wb };
    case 3: return { id: `${colId}-hex`,     type: 'polygon', x, y, radius: R, sides: 6, fill, border: wb };
    case 4: return { id: `${colId}-star`,    type: 'star',    x, y, radius: R, fill, border: wb };
    default: return { id: `${colId}-tri`,    type: 'polygon', x, y, radius: R, sides: 3, fill, border: wb };
  }
}

function nodeIds(colId: string): string[] {
  return ['circle','ellipse','rect','hex','star','tri'].map(t => `${colId}-${t}`);
}

export const NodeLabels: Story = {
  name: 'Node Labels',
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
    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const ROW_Y = [-280, -120, 60, 220];
    const rowLabels = ['Name below','Name above','Font sizes','Label colors'];
    const fontSizes = [8, 10, 12, 14, 16, 20];
    const labelColors = ['#ffffff','#f87171','#fbbf24','#34d399','#60a5fa','#c084fc'];

    const colHeaders: ShapeSpec[] = NAMES.map((lbl, si) => ({
      id: `lblchdr-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[0]! - 80,
      text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = rowLabels.map((lbl, ri) => ({
      id: `lblrhdr-${ri}`, type: 'label', x: startX - 110, y: ROW_Y[ri]!,
      text: lbl, color: '#555', fontSize: 10,
    } as ShapeSpec));

    // Row 0: name label below node
    const row0Nodes: ShapeSpec[] = NAMES.map((name, si) => baseNode('r0', si, startX + si * GAP, ROW_Y[0]!));
    const row0Labels: ShapeSpec[] = NAMES.map((name, si) => ({
      id: `r0-lbl-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[0]! + R + 14,
      text: name, color: '#ccc', fontSize: 11,
    } as ShapeSpec));

    // Row 1: name label above node
    const row1Nodes: ShapeSpec[] = NAMES.map((name, si) => baseNode('r1', si, startX + si * GAP, ROW_Y[1]!));
    const row1Labels: ShapeSpec[] = NAMES.map((name, si) => ({
      id: `r1-lbl-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[1]! - R - 14,
      text: name, color: '#ccc', fontSize: 11,
    } as ShapeSpec));

    // Row 2: varying font sizes
    const row2Nodes: ShapeSpec[] = NAMES.map((name, si) => baseNode('r2', si, startX + si * GAP, ROW_Y[2]!));
    const row2Labels: ShapeSpec[] = NAMES.map((name, si) => ({
      id: `r2-lbl-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[2]! + R + 14,
      text: `${fontSizes[si]}px`, color: '#ccc', fontSize: fontSizes[si],
    } as ShapeSpec));

    // Row 3: label colors
    const row3Nodes: ShapeSpec[] = NAMES.map((name, si) => baseNode('r3', si, startX + si * GAP, ROW_Y[3]!));
    const row3Labels: ShapeSpec[] = NAMES.map((name, si) => ({
      id: `r3-lbl-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[3]! + R + 14,
      text: name, color: labelColors[si], fontSize: 11,
    } as ShapeSpec));

    const allLabelIds: string[] = [
      ...NAMES.map((_, si) => `r0-lbl-${si}`),
      ...NAMES.map((_, si) => `r1-lbl-${si}`),
      ...NAMES.map((_, si) => `r2-lbl-${si}`),
      ...NAMES.map((_, si) => `r3-lbl-${si}`),
    ];

    shapes.setData([
      ...colHeaders, ...rowHeaders,
      ...row0Nodes, ...row0Labels,
      ...row1Nodes, ...row1Labels,
      ...row2Nodes, ...row2Labels,
      ...row3Nodes, ...row3Labels,
    ]);

    const gui = new GUI({ title: 'Node Labels', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      fontSize: 11,
      labelColor: '#cccccc',
      labelText: 'Node',
      devInfo: true,
    };

    const applyToAll = () => {
      allLabelIds.forEach(id => shapes.update(id, { text: state.labelText, color: state.labelColor, fontSize: state.fontSize }));
    };

    const lf = gui.addFolder('Live Controls (all labels)');
    lf.add(state, 'fontSize', 6, 28, 1).name('Font size').onChange(applyToAll);
    lf.addColor(state, 'labelColor').name('Color').onChange(applyToAll);
    lf.add(state, 'labelText').name('Text').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
