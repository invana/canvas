/**
 * Node Styles — Icon Fill
 *
 * Demonstrates icon fills via ShapePlugin.registerTexture() with inline SVG
 * data-URLs. Every shape type is shown with each icon.
 * GUI tint color updates all shapes simultaneously.
 *
 * Icons: person · star · heart · bolt · home · gear
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import type { ShapeSpec } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Icon' };
export default meta;
type Story = StoryObj;

// ── Inline SVG icons as data-URLs ─────────────────────────────────────────────
const svgToUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const ICONS: Record<string, string> = {
  person: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`),
  star:   svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`),
  heart:  svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`),
  bolt:   svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`),
  home:   svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`),
  gear:   svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`),
};

const ICON_KEYS = Object.keys(ICONS);
const SHAPE_COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const R = 42;
const wb = { color: '#ffffff', width: 1.5, alpha: 0.6 };

function buildIconNode(rowId: string, si: number, x: number, y: number, iconKey: string, tint?: string): ShapeSpec {
  const fill = { type: 'icon' as const, src: iconKey, ...(tint ? { tint } : {}) };
  const border = { ...wb, color: SHAPE_COLORS[si]! };
  switch (si) {
    case 0: return { id: `${rowId}-circle`,  type: 'circle',  x, y, radius: R, fill, border };
    case 1: return { id: `${rowId}-ellipse`, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, fill, border };
    case 2: return { id: `${rowId}-rect`,    type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border };
    case 3: return { id: `${rowId}-hex`,     type: 'polygon', x, y, radius: R, sides: 6, fill, border };
    case 4: return { id: `${rowId}-star`,    type: 'star',    x, y, radius: R, fill, border };
    default: return { id: `${rowId}-tri`,    type: 'polygon', x, y, radius: R, sides: 3, fill, border };
  }
}

function shapeIds(rowId: string): string[] {
  return ['circle','ellipse','rect','hex','star','tri'].map(t => `${rowId}-${t}`);
}

export const NodeIcons: Story = {
  name: 'Node Icon Fill',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // Register all icons before canvas init
    await Promise.all(ICON_KEYS.map(key => ShapePlugin.registerTexture(key, ICONS[key]!)));

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

    const ROW_GAP = 140;
    const startY = -(ICON_KEYS.length - 1) / 2 * ROW_GAP;

    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, si) => ({
      id: `iconchdr-${si}`, type: 'label', x: startX + si * GAP, y: startY - 100, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));
    const rowHeaders: ShapeSpec[] = ICON_KEYS.map((key, ri) => ({
      id: `iconrhdr-${ri}`, type: 'label', x: startX - 110, y: startY + ri * ROW_GAP, text: key.charAt(0).toUpperCase() + key.slice(1), color: '#555', fontSize: 10,
    } as ShapeSpec));

    const allNodes: ShapeSpec[] = ICON_KEYS.flatMap((iconKey, ri) =>
      Array.from({ length: N }, (_, si) =>
        buildIconNode(`${iconKey}-${si}`, si, startX + si * GAP, startY + ri * ROW_GAP, iconKey)
      )
    );

    shapes.setData([...colHeaders, ...rowHeaders, ...allNodes]);

    const gui = new GUI({ title: 'Node Icons', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const state = {
      tint: '#ffffff',
      iconKey: ICON_KEYS[0]!,
      devInfo: true,
    };

    const applyToAll = () => {
      ICON_KEYS.forEach((iconKey, ri) => {
        shapeIds(`${iconKey}-${0}`).concat(
          ...ICON_KEYS.map(k => shapeIds(`${k}-0`))
        );
        for (let si = 0; si < N; si++) {
          shapeIds(`${iconKey}-${si}`).forEach(id => {
            shapes.update(id, { fill: { type: 'icon', src: iconKey, tint: state.tint } });
          });
        }
      });
    };

    const lf = gui.addFolder('Live Controls (all icons)');
    lf.addColor(state, 'tint').name('Tint color').onChange(applyToAll);
    gui.add(state, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
