/**
 * Node Styles — Z-Index
 *
 * Overlapping groups of all shape types demonstrating z-index layering.
 * GUI sliders change the z-index of each shape in a group live — watch
 * the stacking order update in real time across all shape types.
 *
 * Group A: z 1→2→3  |  Group B: z 3→2→1  |  Group C: Mixed
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Z-Index' };
export default meta;
type Story = StoryObj;

const LAYER_COLORS = ['#ef4444', '#f59e0b', '#10b981'];
const SHAPE_TYPES = ['circle','ellipse','rect','hex','star','tri'];
const N_SHAPES = SHAPE_TYPES.length;

const GAP = 180;
const startX = -(N_SHAPES - 1) / 2 * GAP;
const wb = (color: string) => ({ color, width: 2.5, alpha: 0.9 });
const OVERLAP = 32;
const R = 44;

/** Build one shape at position with given layer (0=back, 2=front) */
function buildLayerShape(shapeType: string, si: number, x: number, y: number, layer: number, zIndex: number): ShapeSpec {
  const fill = { type: 'solid' as const, color: LAYER_COLORS[layer]! };
  const border = wb(LAYER_COLORS[layer]!);
  const dx = (layer - 1) * OVERLAP;
  const id = `z-${shapeType}-layer${layer}`;
  switch (shapeType) {
    case 'circle':  return { id, type: 'circle',  x: x + dx, y, radius: R, fill, border, zIndex };
    case 'ellipse': return { id, type: 'ellipse', x: x + dx, y, radiusX: R + 14, radiusY: R - 12, fill, border, zIndex };
    case 'rect':    return { id, type: 'rect',    x: x + dx - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border, zIndex };
    case 'hex':     return { id, type: 'polygon', x: x + dx, y, radius: R, sides: 6, fill, border, zIndex };
    case 'star':    return { id, type: 'star',    x: x + dx, y, radius: R, fill, border, zIndex };
    default:        return { id: `z-${shapeType}-layer${layer}`, type: 'polygon', x: x + dx, y, radius: R, sides: 3, fill, border, zIndex };
  }
}

/** Build 3-node overlapping cluster for one shape type */
function buildCluster(si: number, y: number, zOrder: number[]): ShapeSpec[] {
  const shapeType = SHAPE_TYPES[si]!;
  const x = startX + si * GAP;
  return [0, 1, 2].map(layer => buildLayerShape(shapeType, si, x, y, layer, zOrder[layer]));
}

export const NodeZIndex: Story = {
  name: 'Node Z-Index',
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
    const devInfo = new DevInfoPlugin({ key: 'dev-info', enabled: false });
    await canvas.plugins.register(devInfo);
    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const ROW_Y = [-180, 0, 180];
    const colHeaders: ShapeSpec[] = SHAPE_TYPES.map((t, i) => ({
      id: `zchdr-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[0]! - 100,
      text: t.charAt(0).toUpperCase() + t.slice(1), color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = [
      { id: 'zrhdr-0', type: 'label', x: startX - 130, y: ROW_Y[0]!, text: 'z: 1→2→3\n(Front=green)', color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'zrhdr-1', type: 'label', x: startX - 130, y: ROW_Y[1]!, text: 'z: 3→2→1\n(Front=red)',   color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'zrhdr-2', type: 'label', x: startX - 130, y: ROW_Y[2]!, text: 'z: 2→3→1\n(Front=amber)', color: '#555', fontSize: 10 } as ShapeSpec,
    ];

    const colorLegend: ShapeSpec[] = LAYER_COLORS.map((color, i) => [
      { id: `legend-node-${i}`, type: 'circle', x: -460 + i * 50, y: -300, radius: 10, fill: { type: 'solid', color }, border: { color, width: 1.5, alpha: 0.8 } } as ShapeSpec,
      { id: `legend-lbl-${i}`, type: 'label', x: -430 + i * 50, y: -300, text: ['Back','Mid','Front'][i]!, color: '#888', fontSize: 9 } as ShapeSpec,
    ]).flat();

    const allNodes: ShapeSpec[] = [
      // Row 0: z 1→2→3 (back=red stays behind)
      ...Array.from({ length: N_SHAPES }, (_, si) => buildCluster(si, ROW_Y[0]!, [1, 2, 3])).flat(),
      // Row 1: z 3→2→1 (back=red comes to front)
      ...Array.from({ length: N_SHAPES }, (_, si) => buildCluster(si, ROW_Y[1]!, [3, 2, 1])).flat(),
      // Row 2: z 2→3→1
      ...Array.from({ length: N_SHAPES }, (_, si) => buildCluster(si, ROW_Y[2]!, [2, 3, 1])).flat(),
    ];

    shapes.setData([...colHeaders, ...rowHeaders, ...colorLegend, ...allNodes]);

    const gui = new GUI({ title: 'Node Z-Index', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = { zRed: 1, zAmber: 2, zGreen: 3, devInfo: false };

    const applyZOrder = () => {
      const zOrder: number[] = [state.zRed, state.zAmber, state.zGreen];
      // Update all rows
      [ROW_Y[0]!, ROW_Y[1]!, ROW_Y[2]!].forEach(y => {
        SHAPE_TYPES.forEach((shapeType, si) => {
          const x = startX + si * GAP;
          [0, 1, 2].forEach(layer => {
            const node = buildLayerShape(shapeType, si, x, y, layer, zOrder[layer]!);
            shapes.update(node.id, { zIndex: zOrder[layer] });
          });
        });
      });
    };

    const zf = gui.addFolder('Z-index (all shape types)');
    zf.add(state, 'zRed', 0, 10, 1).name('Red z-index').onChange(applyZOrder);
    zf.add(state, 'zAmber', 0, 10, 1).name('Amber z-index').onChange(applyZOrder);
    zf.add(state, 'zGreen', 0, 10, 1).name('Green z-index').onChange(applyZOrder);
    gui.add({ bringRedFront: () => { state.zRed = 10; applyZOrder(); } }, 'bringRedFront').name('Bring red to front');
    gui.add({ reset: () => { state.zRed = 1; state.zAmber = 2; state.zGreen = 3; applyZOrder(); } }, 'reset').name('Reset order');
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
