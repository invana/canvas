/**
 * Node Styles — Outlines
 *
 * Shows every shape type with a concentric outline ring (drawn as a
 * slightly larger shape behind the main node).
 * GUI controls update all shapes simultaneously — visual regression test.
 *
 * Rows: Thin · Medium · Thick · Dashed · Double
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Outlines' };
export default meta;
type Story = StoryObj;

const FILL_COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const wb = { color: '#ffffff', width: 1.5, alpha: 0.6 };
const R = 38;
const OW = 5;   // default outline width
const OG = 3;   // gap between node and outline ring

/** Build a pair: outline ring + node */
function outlinePair(
  id: string, si: number, x: number, y: number,
  outlineColor: string, outlineWidth: number,
  outlineAlpha = 0.85,
  dash?: { length: number; gap: number }
): ShapeSpec[] {
  const fill = { type: 'solid' as const, color: FILL_COLORS[si]! };
  const outerR = R + outlineWidth + OG;
  const outlineBorder: ShapeSpec['border'] = { color: outlineColor, width: outlineWidth, alpha: outlineAlpha, ...(dash ? { dash } : {}) };
  const transparentFill = { type: 'solid' as const, color: outlineColor, alpha: 0 };

  const ring: ShapeSpec = { id: `${id}-ring`, type: 'circle', x, y, radius: outerR, fill: transparentFill, border: outlineBorder, zIndex: 0 };
  const node: ShapeSpec = (() => {
    switch (si) {
      case 0: return { id, type: 'circle',  x, y, radius: R, fill, border: wb, zIndex: 1 } as ShapeSpec;
      case 1: return { id, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, fill, border: wb, zIndex: 1 } as ShapeSpec;
      case 2: return { id, type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border: wb, zIndex: 1 } as ShapeSpec;
      case 3: return { id, type: 'polygon', x, y, radius: R, sides: 6, fill, border: wb, zIndex: 1 } as ShapeSpec;
      case 4: return { id, type: 'star',    x, y, radius: R, fill, border: wb, zIndex: 1 } as ShapeSpec;
      default: return { id, type: 'polygon', x, y, radius: R, sides: 3, fill, border: wb, zIndex: 1 } as ShapeSpec;
    }
  })();
  return [ring, node];
}

function outlineRow(
  rowId: string, y: number,
  outlineColor: string, outlineWidth: number,
  outlineAlpha = 0.85,
  dash?: { length: number; gap: number }
): ShapeSpec[] {
  return Array.from({ length: N }, (_, si) =>
    outlinePair(`${rowId}-${si}`, si, startX + si * GAP, y, outlineColor, outlineWidth, outlineAlpha, dash)
  ).flat();
}

function allRingIds(rowId: string): string[] {
  return Array.from({ length: N }, (_, si) => `${rowId}-${si}-ring`);
}

export const NodeOutlines: Story = {
  name: 'Node Outlines',
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

    const ROW_Y = [-280, -100, 80, 260, 440];
    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, i) => ({
      id: `ochdr-${i}`, type: 'label', x: startX + i * GAP, y: ROW_Y[0]! - 80, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = [
      { id: 'orhdr-0', type: 'label', x: startX - 110, y: ROW_Y[0]!, text: 'Thin (w=2)',   color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'orhdr-1', type: 'label', x: startX - 110, y: ROW_Y[1]!, text: 'Medium (w=5)', color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'orhdr-2', type: 'label', x: startX - 110, y: ROW_Y[2]!, text: 'Thick (w=10)', color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'orhdr-3', type: 'label', x: startX - 110, y: ROW_Y[3]!, text: 'Dashed',       color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'orhdr-4', type: 'label', x: startX - 110, y: ROW_Y[4]!, text: 'Double ring',  color: '#555', fontSize: 10 } as ShapeSpec,
    ];

    const allRows: ShapeSpec[] = [
      ...outlineRow('ot', ROW_Y[0]!, '#fbbf24', 2),
      ...outlineRow('om', ROW_Y[1]!, '#fbbf24', 5),
      ...outlineRow('ok', ROW_Y[2]!, '#fbbf24', 10),
      ...outlineRow('od', ROW_Y[3]!, '#60a5fa', 3, 0.9, { length: 6, gap: 3 }),
      // Double ring row — inner + outer
      ...Array.from({ length: N }, (_, si) => {
        const x = startX + si * GAP;
        const y = ROW_Y[4]!;
        const fill = { type: 'solid' as const, color: FILL_COLORS[si]! };
        return [
          { id: `odb-outer-${si}`, type: 'circle', x, y, radius: R + 14, fill: { type: 'solid', color: '#c084fc', alpha: 0 }, border: { color: '#c084fc', width: 2, alpha: 0.4 }, zIndex: 0 } as ShapeSpec,
          { id: `odb-inner-${si}`, type: 'circle', x, y, radius: R + 6,  fill: { type: 'solid', color: '#fbbf24', alpha: 0 }, border: { color: '#fbbf24', width: 2, alpha: 0.7 }, zIndex: 1 } as ShapeSpec,
          { id: `odb-node-${si}`,  type: 'circle', x, y, radius: R, fill, border: wb, zIndex: 2 } as ShapeSpec,
        ];
      }).flat(),
    ];

    shapes.setData([...colHeaders, ...rowHeaders, ...allRows]);

    const gui = new GUI({ title: 'Node Outlines', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      outlineColor: '#fbbf24',
      outlineWidth: 5,
      outlineAlpha: 0.85,
      dashed: false,
      dashLength: 6,
      dashGap: 3,
      devInfo: true,
    };

    const applyToAll = () => {
      const border: ShapeSpec['border'] = {
        color: state.outlineColor,
        width: state.outlineWidth,
        alpha: state.outlineAlpha,
        ...(state.dashed ? { dash: { length: state.dashLength, gap: state.dashGap } } : {}),
      };
      const newRadius = R + state.outlineWidth + OG;
      ['ot','om','ok','od'].forEach(rowId =>
        allRingIds(rowId).forEach(id => shapes.update(id, { border, radius: newRadius }))
      );
    };

    const lf = gui.addFolder('Live Controls (all rings)');
    lf.addColor(state, 'outlineColor').name('Color').onChange(applyToAll);
    lf.add(state, 'outlineWidth', 1, 20, 0.5).name('Width').onChange(applyToAll);
    lf.add(state, 'outlineAlpha', 0, 1, 0.05).name('Alpha').onChange(applyToAll);
    lf.add(state, 'dashed').name('Dashed').onChange(applyToAll);
    lf.add(state, 'dashLength', 1, 30, 1).name('Dash length').onChange(applyToAll);
    lf.add(state, 'dashGap', 1, 20, 1).name('Dash gap').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
