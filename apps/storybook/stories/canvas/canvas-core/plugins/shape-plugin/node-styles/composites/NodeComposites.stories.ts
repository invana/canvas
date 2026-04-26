/**
 * Node Styles — Composites
 *
 * Every shape type with combined styles: gradient fill + border + halo.
 * GUI controls update all shapes simultaneously — visual regression test
 * for complex multi-property combos across all shape types.
 *
 * Rows: Gradient+Halo · Gradient+Border · Solid+Halo+Border · Status combos
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec, FillSpec, HaloSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Composites' };
export default meta;
type Story = StoryObj;

const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const R = 38;

function buildShape(
  id: string, si: number, x: number, y: number,
  fill: FillSpec, border: ShapeSpec['border'], halo?: HaloSpec
): ShapeSpec {
  const base = { fill, border, ...(halo ? { halo } : {}) };
  switch (si) {
    case 0: return { id, type: 'circle',  x, y, radius: R, ...base };
    case 1: return { id, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, ...base };
    case 2: return { id, type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, ...base };
    case 3: return { id, type: 'polygon', x, y, radius: R, sides: 6, ...base };
    case 4: return { id, type: 'star',    x, y, radius: R, ...base };
    default: return { id, type: 'polygon', x, y, radius: R, sides: 3, ...base };
  }
}

function compositeRow(
  rowId: string, y: number,
  getFill: (si: number) => FillSpec,
  getBorder: (si: number) => ShapeSpec['border'],
  getHalo: (si: number) => HaloSpec | undefined
): ShapeSpec[] {
  return Array.from({ length: N }, (_, si) =>
    buildShape(`${rowId}-${si}`, si, startX + si * GAP, y, getFill(si), getBorder(si), getHalo(si))
  );
}

function rowIds(rowId: string): string[] {
  return Array.from({ length: N }, (_, i) => `${rowId}-${i}`);
}

// Preset combos
const GRADIENT_PAIRS = [
  ['#ff006e','#0ea5e9'],['#fbbf24','#10b981'],['#a855f7','#f59e0b'],
  ['#06b6d4','#ef4444'],['#10b981','#0ea5e9'],['#ec4899','#a855f7'],
];
const HALO_COLORS = ['#0ea5e9','#10b981','#fbbf24','#ef4444','#a855f7','#ec4899'];

export const NodeComposites: Story = {
  name: 'Node Composites',
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
    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, si) => ({
      id: `compchdr-${si}`, type: 'label', x: startX + si * GAP, y: ROW_Y[0]! - 80, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = [
      { id: 'comprhdr-0', type: 'label', x: startX - 110, y: ROW_Y[0]!, text: 'Gradient+Halo',     color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'comprhdr-1', type: 'label', x: startX - 110, y: ROW_Y[1]!, text: 'Gradient+Thick Brdr',color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'comprhdr-2', type: 'label', x: startX - 110, y: ROW_Y[2]!, text: 'Solid+Halo+Dash',   color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'comprhdr-3', type: 'label', x: startX - 110, y: ROW_Y[3]!, text: 'Radial+Halo+Anim',  color: '#555', fontSize: 10 } as ShapeSpec,
      { id: 'comprhdr-4', type: 'label', x: startX - 110, y: ROW_Y[4]!, text: 'Radial+Double Ring', color: '#555', fontSize: 10 } as ShapeSpec,
    ];

    const allRows: ShapeSpec[] = [
      // Row 0: Gradient fill + soft halo
      ...compositeRow('r0', ROW_Y[0]!,
        si => ({ type: 'linear', angle: 45, stops: [{ offset: 0, color: GRADIENT_PAIRS[si]![0] }, { offset: 1, color: GRADIENT_PAIRS[si]![1] }] } as FillSpec),
        _ => ({ color: '#ffffff', width: 1.5, alpha: 0.5 }),
        si => ({ color: HALO_COLORS[si]!, radius: 16, alpha: 0.35 })
      ),
      // Row 1: Gradient fill + thick colored border
      ...compositeRow('r1', ROW_Y[1]!,
        si => ({ type: 'linear', angle: 0, stops: [{ offset: 0, color: GRADIENT_PAIRS[si]![0] }, { offset: 1, color: GRADIENT_PAIRS[si]![1] }] } as FillSpec),
        si => ({ color: GRADIENT_PAIRS[si]![0], width: 4, alpha: 0.9 }),
        _ => undefined
      ),
      // Row 2: Solid fill + halo + dashed border
      ...compositeRow('r2', ROW_Y[2]!,
        si => ({ type: 'solid', color: HALO_COLORS[si]! } as FillSpec),
        si => ({ color: '#ffffff', width: 2, alpha: 0.7, dash: { length: 6, gap: 3 } }),
        si => ({ color: HALO_COLORS[si]!, radius: 18, alpha: 0.4 })
      ),
      // Row 3: Radial + animated halo
      ...compositeRow('r3', ROW_Y[3]!,
        si => ({ type: 'radial', stops: [{ offset: 0, color: '#ffffff' }, { offset: 0.5, color: HALO_COLORS[si]! }, { offset: 1, color: '#0f172a' }] } as FillSpec),
        _ => ({ color: '#ffffff', width: 1.5, alpha: 0.5 }),
        si => ({ color: HALO_COLORS[si]!, radius: 20, alpha: 0.45, animated: true, duration: 1200 })
      ),
      // Row 4: Radial fill + two-ring outline
      ...Array.from({ length: N }, (_, si) => {
        const x = startX + si * GAP;
        const y = ROW_Y[4]!;
        const color = HALO_COLORS[si]!;
        const fill: FillSpec = { type: 'radial', stops: [{ offset: 0, color: '#ffffff' }, { offset: 1, color }] };
        return [
          { id: `r4-ring-${si}`, type: 'circle', x, y, radius: R + 10, fill: { type: 'solid', color, alpha: 0 }, border: { color, width: 2, alpha: 0.4 }, zIndex: 0 } as ShapeSpec,
          buildShape(`r4-${si}`, si, x, y, fill, { color: '#ffffff', width: 1.5, alpha: 0.6 }, undefined),
        ];
      }).flat(),
    ];

    shapes.setData([...colHeaders, ...rowHeaders, ...allRows]);

    const gui = new GUI({ title: 'Node Composites', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      gradientAngle: 45,
      colorA: '#ff006e',
      colorB: '#0ea5e9',
      haloRadius: 16,
      haloAlpha: 0.35,
      devInfo: true,
    };

    const applyToAll = () => {
      const fill: FillSpec = { type: 'linear', angle: state.gradientAngle, stops: [{ offset: 0, color: state.colorA }, { offset: 1, color: state.colorB }] };
      const halo: HaloSpec = { color: state.colorA, radius: state.haloRadius, alpha: state.haloAlpha };
      rowIds('r0').forEach(id => shapes.update(id, { fill, halo }));
      rowIds('r1').forEach(id => shapes.update(id, { fill }));
    };

    const lf = gui.addFolder('Live Controls (rows 0 & 1)');
    lf.add(state, 'gradientAngle', 0, 360, 5).name('Gradient angle').onChange(applyToAll);
    lf.addColor(state, 'colorA').name('Color A').onChange(applyToAll);
    lf.addColor(state, 'colorB').name('Color B').onChange(applyToAll);
    lf.add(state, 'haloRadius', 4, 50, 1).name('Halo radius').onChange(applyToAll);
    lf.add(state, 'haloAlpha', 0, 1, 0.05).name('Halo alpha').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
