/**
 * Node Styles — Color
 *
 * Three stories covering every supported fill type:
 *   • Solid Fill      — flat color, alpha/opacity
 *   • Linear Gradient — angle, direction, multi-stop
 *   • Radial Gradient — center/edge, offset, multi-stop
 *
 * Texture and Icon fills have their own dedicated stories.
 *
 * Every story shows all 6 shape types in every row.
 * GUI controls update all shapes simultaneously.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec, FillSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Color' };
export default meta;
type Story = StoryObj;

// ── Shared layout ──────────────────────────────────────────────────────────────
const SHAPE_TYPES = ['circle', 'ellipse', 'rect', 'hex', 'star', 'tri'] as const;
const N = SHAPE_TYPES.length;
const GAP = 160;
const R = 40;
const startX = -(N - 1) / 2 * GAP;
const ROW_GAP = 140;
const COL_LABELS = ['Circle', 'Ellipse', 'Rect', 'Hexagon', 'Star', 'Triangle'];

function buildShape(rowId: string, si: number, x: number, y: number, fill: FillSpec): ShapeSpec {
  const id = `${rowId}-${SHAPE_TYPES[si]}`;
  const border = { color: '#ffffff', width: 1.5, alpha: 0.4 };
  switch (si) {
    case 0: return { id, type: 'circle',  x, y, radius: R, fill, border };
    case 1: return { id, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, fill, border };
    case 2: return { id, type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border };
    case 3: return { id, type: 'polygon', x, y, radius: R, sides: 6, fill, border };
    case 4: return { id, type: 'star',    x, y, radius: R, fill, border };
    default: return { id, type: 'polygon', x, y, radius: R, sides: 3, fill, border };
  }
}

function buildRow(rowId: string, y: number, fill: FillSpec): ShapeSpec[] {
  return Array.from({ length: N }, (_, si) =>
    buildShape(rowId, si, startX + si * GAP, y, fill)
  );
}

function shapeIds(rowId: string): string[] {
  return SHAPE_TYPES.map(t => `${rowId}-${t}`);
}

function colHeaderSpecs(topY: number): ShapeSpec[] {
  return COL_LABELS.map((lbl, si) => ({
    id: `hdr-col-${si}`, type: 'label', x: startX + si * GAP, y: topY,
    text: lbl, color: '#888', fontSize: 10,
  } as ShapeSpec));
}

async function initCanvas(container: HTMLElement) {
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
  return { devInfo, shapes };
}

// ── Story 1: Solid Fill ────────────────────────────────────────────────────────

const SOLID_ROWS = [
  { id: 's0', label: 'Sky Blue', color: '#0ea5e9', alpha: 1.0 },
  { id: 's1', label: 'Emerald',  color: '#10b981', alpha: 1.0 },
  { id: 's2', label: 'Amber',    color: '#f59e0b', alpha: 1.0 },
  { id: 's3', label: 'Rose',     color: '#ef4444', alpha: 1.0 },
  { id: 's4', label: 'Violet',   color: '#8b5cf6', alpha: 1.0 },
  { id: 's5', label: 'Pink',     color: '#ec4899', alpha: 1.0 },
];

export const SolidFill: Story = {
  name: 'Solid Fill',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const { devInfo, shapes } = await initCanvas(container);
    const totalRows = SOLID_ROWS.length;
    const startRowY = -(totalRows - 1) / 2 * ROW_GAP;

    const colHdrs = colHeaderSpecs(startRowY - 100);
    const rowHdrs: ShapeSpec[] = SOLID_ROWS.map((row, ri) => ({
      id: `shdr-${ri}`, type: 'label', x: startX - 110, y: startRowY + ri * ROW_GAP,
      text: row.label, color: '#555', fontSize: 10,
    } as ShapeSpec));
    const allNodes: ShapeSpec[] = SOLID_ROWS.flatMap((row, ri) =>
      buildRow(row.id, startRowY + ri * ROW_GAP, { type: 'solid', color: row.color, alpha: row.alpha })
    );

    shapes.setData([...colHdrs, ...rowHdrs, ...allNodes]);

    const gui = new GUI({ title: 'Solid Fill', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = { color: '#0ea5e9', alpha: 1.0, devInfo: false };

    const applyToAll = () => {
      const fill: FillSpec = { type: 'solid', color: state.color, alpha: state.alpha };
      SOLID_ROWS.forEach(row => shapeIds(row.id).forEach(id => shapes.update(id, { fill })));
    };

    gui.addColor(state, 'color').name('Fill color').onChange(applyToAll);
    gui.add(state, 'alpha', 0, 1, 0.05).name('Fill alpha').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};

// ── Story 2: Linear Gradient ───────────────────────────────────────────────────

type LinearRowDef = { id: string; label: string; angle: number; multiStop?: true };

const LINEAR_ROWS: LinearRowDef[] = [
  { id: 'l0', label: 'Angle 0°   (→)',   angle: 0 },
  { id: 'l1', label: 'Angle 45°  (↘)',   angle: 45 },
  { id: 'l2', label: 'Angle 90°  (↓)',   angle: 90 },
  { id: 'l3', label: 'Angle 135° (↙)',   angle: 135 },
  { id: 'l4', label: '3-stop',           angle: 45, multiStop: true },
];

export const LinearGradientFill: Story = {
  name: 'Linear Gradient',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const { devInfo, shapes } = await initCanvas(container);
    const totalRows = LINEAR_ROWS.length;
    const startRowY = -(totalRows - 1) / 2 * ROW_GAP;

    const state = { colorA: '#0ea5e9', colorB: '#8b5cf6', mid: '#10b981', devInfo: false };

    const getLinearFill = (row: LinearRowDef): FillSpec =>
      row.multiStop
        ? { type: 'linear', angle: row.angle, stops: [
            { offset: 0, color: state.colorA },
            { offset: 0.5, color: state.mid },
            { offset: 1, color: state.colorB },
          ] }
        : { type: 'linear', angle: row.angle, stops: [
            { offset: 0, color: state.colorA },
            { offset: 1, color: state.colorB },
          ] };

    const colHdrs = colHeaderSpecs(startRowY - 100);
    const rowHdrs: ShapeSpec[] = LINEAR_ROWS.map((row, ri) => ({
      id: `lhdr-${ri}`, type: 'label', x: startX - 120, y: startRowY + ri * ROW_GAP,
      text: row.label, color: '#555', fontSize: 10,
    } as ShapeSpec));
    const allNodes: ShapeSpec[] = LINEAR_ROWS.flatMap((row, ri) =>
      buildRow(row.id, startRowY + ri * ROW_GAP, getLinearFill(row))
    );

    shapes.setData([...colHdrs, ...rowHdrs, ...allNodes]);

    const gui = new GUI({ title: 'Linear Gradient', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const applyToAll = () => {
      LINEAR_ROWS.forEach(row => {
        const fill = getLinearFill(row);
        shapeIds(row.id).forEach(id => shapes.update(id, { fill }));
      });
    };

    gui.addColor(state, 'colorA').name('Color A (start)').onChange(applyToAll);
    gui.addColor(state, 'colorB').name('Color B (end)').onChange(applyToAll);
    gui.addColor(state, 'mid').name('Mid color (3-stop)').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};

// ── Story 3: Radial Gradient ───────────────────────────────────────────────────

type RadialRowDef = { id: string; label: string; invert?: true; multiStop?: true; offCenter?: true };

const RADIAL_ROWS: RadialRowDef[] = [
  { id: 'r0', label: 'Light center' },
  { id: 'r1', label: 'Dark center',  invert: true },
  { id: 'r2', label: 'Off-center',   offCenter: true },
  { id: 'r3', label: '3-stop',       multiStop: true },
];

export const RadialGradientFill: Story = {
  name: 'Radial Gradient',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const { devInfo, shapes } = await initCanvas(container);
    const totalRows = RADIAL_ROWS.length;
    const startRowY = -(totalRows - 1) / 2 * ROW_GAP;

    const state = { inner: '#ffffff', outer: '#0ea5e9', mid: '#8b5cf6', cx: 0.25, cy: 0.25, devInfo: false };

    const getRadialFill = (row: RadialRowDef): FillSpec => {
      if (row.multiStop) {
        return { type: 'radial', cx: 0.5, cy: 0.5, stops: [
          { offset: 0, color: state.inner },
          { offset: 0.5, color: state.mid },
          { offset: 1, color: state.outer },
        ] };
      }
      const cx = row.offCenter ? state.cx : 0.5;
      const cy = row.offCenter ? state.cy : 0.5;
      const stops = row.invert
        ? [{ offset: 0, color: state.outer }, { offset: 1, color: state.inner }]
        : [{ offset: 0, color: state.inner }, { offset: 1, color: state.outer }];
      return { type: 'radial', cx, cy, stops };
    };

    const colHdrs = colHeaderSpecs(startRowY - 100);
    const rowHdrs: ShapeSpec[] = RADIAL_ROWS.map((row, ri) => ({
      id: `rhdr-${ri}`, type: 'label', x: startX - 110, y: startRowY + ri * ROW_GAP,
      text: row.label, color: '#555', fontSize: 10,
    } as ShapeSpec));
    const allNodes: ShapeSpec[] = RADIAL_ROWS.flatMap((row, ri) =>
      buildRow(row.id, startRowY + ri * ROW_GAP, getRadialFill(row))
    );

    shapes.setData([...colHdrs, ...rowHdrs, ...allNodes]);

    const gui = new GUI({ title: 'Radial Gradient', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const applyToAll = () => {
      RADIAL_ROWS.forEach(row => {
        const fill = getRadialFill(row);
        shapeIds(row.id).forEach(id => shapes.update(id, { fill }));
      });
    };

    gui.addColor(state, 'inner').name('Inner color').onChange(applyToAll);
    gui.addColor(state, 'outer').name('Outer color').onChange(applyToAll);
    gui.addColor(state, 'mid').name('Mid color (3-stop)').onChange(applyToAll);
    gui.add(state, 'cx', 0, 1, 0.05).name('Off-center X').onChange(applyToAll);
    gui.add(state, 'cy', 0, 1, 0.05).name('Off-center Y').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
