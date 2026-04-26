/**
 * Node Styles — States
 *
 * Shows every shape type in each visual state side-by-side.
 * GUI state-switcher applies the selected state to all shapes simultaneously.
 *
 * Rows: Default · Hover · Selected · Disabled · Error · Warning · Success
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec, HaloSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / States' };
export default meta;
type Story = StoryObj;

const BASE_COLORS   = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const BRIGHT_COLORS = ['#38bdf8','#34d399','#fbbf24','#f87171','#c084fc','#f0abfc'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const R = 38;

interface StateStyle { border: ShapeSpec['border']; halo?: HaloSpec; alpha?: number; outlineColor?: string; }

const STATE_STYLES: Record<string, (si: number) => StateStyle> = {
  default:  si => ({ border: { color: '#ffffff', width: 1.5, alpha: 0.55 } }),
  hover:    si => ({ border: { color: BRIGHT_COLORS[si]!, width: 2.5, alpha: 0.9 }, halo: { color: BRIGHT_COLORS[si]!, radius: 16, alpha: 0.4 } }),
  selected: si => ({ border: { color: '#ffffff', width: 3, alpha: 0.9 }, outlineColor: '#fbbf24' }),
  disabled: si => ({ border: { color: '#94a3b8', width: 1.5, alpha: 0.4 }, alpha: 0.45 }),
  error:    si => ({ border: { color: '#ef4444', width: 2.5, alpha: 0.9 }, halo: { color: '#ef4444', radius: 12, alpha: 0.3 } }),
  warning:  si => ({ border: { color: '#f59e0b', width: 2.5, alpha: 0.9 }, halo: { color: '#f59e0b', radius: 12, alpha: 0.3 } }),
  success:  si => ({ border: { color: '#10b981', width: 2.5, alpha: 0.9 }, halo: { color: '#10b981', radius: 12, alpha: 0.35 } }),
};

function buildNode(rowId: string, si: number, y: number, style: StateStyle): ShapeSpec {
  const x = startX + si * GAP;
  const fill = { type: 'solid' as const, color: style.alpha !== undefined ? '#64748b' : BASE_COLORS[si]!, ...(style.alpha ? { alpha: style.alpha } : {}) };
  const base = { fill, border: style.border, ...(style.halo ? { halo: style.halo } : {}) };
  switch (si) {
    case 0: return { id: `${rowId}-circle`,  type: 'circle',  x, y, radius: R, ...base };
    case 1: return { id: `${rowId}-ellipse`, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, ...base };
    case 2: return { id: `${rowId}-rect`,    type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, ...base };
    case 3: return { id: `${rowId}-hex`,     type: 'polygon', x, y, radius: R, sides: 6, ...base };
    case 4: return { id: `${rowId}-star`,    type: 'star',    x, y, radius: R, ...base };
    default: return { id: `${rowId}-tri`,    type: 'polygon', x, y, radius: R, sides: 3, ...base };
  }
}

function shapeIds(rowId: string): string[] {
  return ['circle','ellipse','rect','hex','star','tri'].map(t => `${rowId}-${t}`);
}

export const NodeStates: Story = {
  name: 'Node States',
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

    const stateKeys = Object.keys(STATE_STYLES);
    const ROW_GAP = 160;
    const totalRows = stateKeys.length;
    const startY = -(totalRows - 1) / 2 * ROW_GAP;

    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, i) => ({
      id: `stchdr-${i}`, type: 'label', x: startX + i * GAP, y: startY - 100, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));

    const allNodes: ShapeSpec[] = [];
    const rowHeaders: ShapeSpec[] = [];

    stateKeys.forEach((stateKey, ri) => {
      const y = startY + ri * ROW_GAP;
      rowHeaders.push({ id: `strhdr-${ri}`, type: 'label', x: startX - 110, y, text: stateKey.charAt(0).toUpperCase() + stateKey.slice(1), color: '#555', fontSize: 10 } as ShapeSpec);
      for (let si = 0; si < N; si++) {
        const style = STATE_STYLES[stateKey]!(si);
        allNodes.push(buildNode(`${stateKey}-${si}`, si, y, style));
      }
    });

    shapes.setData([...colHeaders, ...rowHeaders, ...allNodes]);

    const gui = new GUI({ title: 'Node States', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = { applyState: 'default', devInfo: true };

    gui.add(params, 'applyState', stateKeys).name('Apply state to all').onChange((key: string) => {
      stateKeys.forEach((stateKey, ri) => {
        const y = startY + ri * ROW_GAP;
        for (let si = 0; si < N; si++) {
          const style = STATE_STYLES[key]!(si);
          const node = buildNode(`${stateKey}-${si}`, si, y, style);
          const { id, ...rest } = node as { id: string } & Record<string, unknown>;
          shapes.update(id, rest);
        }
      });
    });

    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
