/**
 * Node Styles — Halos
 *
 * Shows every shape type with a halo ring.
 * GUI controls update all shapes simultaneously — visual regression
 * test for halo radius, alpha, color, and animation across all shape types.
 *
 * Rows: Radius · Alpha · Color · Animated
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec, HaloSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Halos' };
export default meta;
type Story = StoryObj;

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const wb = { color: '#ffffff', width: 1.5, alpha: 0.6 };

function haloRow(rowId: string, y: number, makeHalo: (i: number) => HaloSpec): ShapeSpec[] {
  const configs = [
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-circle-${i}`,  type: 'circle',  x, y, radius: 38, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-ellipse-${i}`, type: 'ellipse', x, y, radiusX: 55, radiusY: 26, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-rect-${i}`,    type: 'rect',    x: x-38, y: y-36, width: 76, height: 72, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-hex-${i}`,     type: 'polygon', x, y, radius: 38, sides: 6, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-star-${i}`,    type: 'star',    x, y, radius: 38, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
    (x: number, i: number, h: HaloSpec) => ({ id: `${rowId}-tri-${i}`,     type: 'polygon', x, y, radius: 38, sides: 3, fill: { type: 'solid' as const, color: COLORS[i]! }, border: wb, halo: h }),
  ];
  return configs.map((fn, i) => fn(startX + i * GAP, i, makeHalo(i)) as ShapeSpec);
}

function rowIds(rowId: string): string[] {
  return ['circle','ellipse','rect','hex','star','tri'].map((t, i) => `${rowId}-${t}-${i}`);
}

const radii = [5, 10, 16, 22, 28, 34];
const alphas = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
const haloColors = ['#0ea5e9','#10b981','#fbbf24','#ef4444','#a855f7','#ec4899'];
const durations = [600, 900, 1200, 1500, 1800, 2200];

export const NodeHalos: Story = {
  name: 'Node Halos',
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

    const ROW_Y = [-280, -100, 80, 260];
    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, i) => ({
      id: `hhdr-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[0]! - 80, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = [
      { id: 'hrhdr-0', type: 'label', x: startX - 110, y: ROW_Y[0]!, text: 'Radius',    color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'hrhdr-1', type: 'label', x: startX - 110, y: ROW_Y[1]!, text: 'Alpha',     color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'hrhdr-2', type: 'label', x: startX - 110, y: ROW_Y[2]!, text: 'Color',     color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'hrhdr-3', type: 'label', x: startX - 110, y: ROW_Y[3]!, text: 'Animated',  color: '#555', fontSize: 10 } as ShapeSpec,
    ];
    const subLabels: ShapeSpec[] = [
      ...radii.map((r, i) => ({ id: `rsub-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[0]! + 58, text: `r=${r}`, color: '#555', fontSize: 9 } as ShapeSpec)),
      ...alphas.map((a, i) => ({ id: `asub-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[1]! + 58, text: `α=${a}`, color: '#555', fontSize: 9 } as ShapeSpec)),
      ...durations.map((d, i) => ({ id: `dsub-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[3]! + 58, text: `${d}ms`, color: '#555', fontSize: 9 } as ShapeSpec)),
    ];

    const allRows: ShapeSpec[] = [
      ...haloRow('hr', ROW_Y[0]!, i => ({ color: COLORS[i]!, radius: radii[i]!, alpha: 0.6 })),
      ...haloRow('ha', ROW_Y[1]!, i => ({ color: COLORS[i]!, radius: 18, alpha: alphas[i]! })),
      ...haloRow('hc', ROW_Y[2]!, i => ({ color: haloColors[i]!, radius: 18, alpha: 0.55 })),
      ...haloRow('hanim', ROW_Y[3]!, i => ({ color: COLORS[i]!, radius: 22, alpha: 0.5, animated: true, duration: durations[i]! })),
    ];

    shapes.setData([...colHeaders, ...rowHeaders, ...subLabels, ...allRows]);

    const gui = new GUI({ title: 'Node Halos', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      haloColor: '#0ea5e9',
      haloRadius: 18,
      haloAlpha: 0.55,
      animated: false,
      duration: 1200,
      devInfo: false,
    };

    const applyToAll = () => {
      const halo: HaloSpec = { color: state.haloColor, radius: state.haloRadius, alpha: state.haloAlpha, animated: state.animated, duration: state.duration };
      ['hr','ha','hc','hanim'].forEach(rowId => rowIds(rowId).forEach(id => shapes.update(id, { halo })));
    };

    const lf = gui.addFolder('Live Controls (all shapes)');
    lf.addColor(state, 'haloColor').name('Color').onChange(applyToAll);
    lf.add(state, 'haloRadius', 2, 60, 1).name('Radius').onChange(applyToAll);
    lf.add(state, 'haloAlpha', 0, 1, 0.05).name('Alpha').onChange(applyToAll);
    lf.add(state, 'animated').name('Animated').onChange(applyToAll);
    lf.add(state, 'duration', 300, 3000, 100).name('Duration ms').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
