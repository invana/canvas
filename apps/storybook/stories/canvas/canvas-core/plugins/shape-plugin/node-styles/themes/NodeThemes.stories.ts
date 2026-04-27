/**
 * Node Styles — Theme Presets
 *
 * Every shape type rendered side-by-side in each theme palette.
 * GUI theme-switcher applies a full color palette to all shapes simultaneously.
 *
 * Themes: Pastel · Dark · Material · High-Contrast · Monochrome · Cyberpunk · Nature
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas';
import type { ShapeSpec } from '@invana/canvas';
import { createContainer } from '../../../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles / Themes' };
export default meta;
type Story = StoryObj;

const THEMES: Record<string, { name: string; colors: string[]; border: string }> = {
  pastel:       { name: 'Pastel',       colors: ['#FFB3D9','#B3E5FC','#FFCCBC','#C8E6C9','#F0F4C3','#D1C4E9'], border: '#ffffff' },
  dark:         { name: 'Dark',         colors: ['#1e3c72','#2a5298','#0f3460','#16213e','#0d1f2d','#1a1a2e'], border: '#4a90e2' },
  material:     { name: 'Material',     colors: ['#2196F3','#4CAF50','#FF9800','#E91E63','#673AB7','#00BCD4'], border: '#ffffff' },
  highContrast: { name: 'Hi-Contrast',  colors: ['#FF0000','#FFFF00','#00FF00','#00FFFF','#FF00FF','#FFFFFF'], border: '#000000' },
  monochrome:   { name: 'Monochrome',   colors: ['#1a1a1a','#404040','#666666','#999999','#cccccc','#e5e5e5'], border: '#ffffff' },
  cyberpunk:    { name: 'Cyberpunk',    colors: ['#00ff41','#00d4ff','#ff006e','#a000ff','#ffbe0b','#fb5607'], border: '#00ffff' },
  nature:       { name: 'Nature',       colors: ['#2d5016','#6ba3a6','#a89968','#8b4513','#228b22','#696969'], border: '#c2b280' },
};

const N = 6;
const GAP = 160;
const startX = -(N - 1) / 2 * GAP;
const R = 38;

function buildThemeRow(themeKey: string, y: number): ShapeSpec[] {
  const { colors, border } = THEMES[themeKey]!;
  const wb = { color: border, width: 1.5, alpha: 0.7 };
  const row: ShapeSpec[] = [];
  for (let si = 0; si < N; si++) {
    const x = startX + si * GAP;
    const fill = { type: 'solid' as const, color: colors[si]! };
    switch (si) {
      case 0: row.push({ id: `${themeKey}-circle`,  type: 'circle',  x, y, radius: R, fill, border: wb }); break;
      case 1: row.push({ id: `${themeKey}-ellipse`, type: 'ellipse', x, y, radiusX: R + 14, radiusY: R - 12, fill, border: wb }); break;
      case 2: row.push({ id: `${themeKey}-rect`,    type: 'rect',    x: x - R, y: y - R + 2, width: R * 2, height: (R - 2) * 2, fill, border: wb }); break;
      case 3: row.push({ id: `${themeKey}-hex`,     type: 'polygon', x, y, radius: R, sides: 6, fill, border: wb }); break;
      case 4: row.push({ id: `${themeKey}-star`,    type: 'star',    x, y, radius: R, fill, border: wb }); break;
      case 5: row.push({ id: `${themeKey}-tri`,     type: 'polygon', x, y, radius: R, sides: 3, fill, border: wb }); break;
    }
  }
  return row;
}

function shapeIds(themeKey: string): string[] {
  return ['circle','ellipse','rect','hex','star','tri'].map(t => `${themeKey}-${t}`);
}

export const NodeThemes: Story = {
  name: 'Node Themes',
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

    const themeKeys = Object.keys(THEMES);
    const ROW_GAP = 140;
    const startY = -(themeKeys.length - 1) / 2 * ROW_GAP;

    const colHeaders: ShapeSpec[] = ['Circle','Ellipse','Rect','Hexagon','Star','Triangle'].map((lbl, si) => ({
      id: `thchdr-${si}`, type: 'label', x: startX + si * GAP, y: startY - 100, text: lbl, color: '#888', fontSize: 10,
    } as ShapeSpec));

    const allNodes: ShapeSpec[] = [];
    const rowHeaders: ShapeSpec[] = [];

    themeKeys.forEach((themeKey, ri) => {
      const y = startY + ri * ROW_GAP;
      rowHeaders.push({
        id: `thrhdr-${ri}`, type: 'label', x: startX - 110, y, text: THEMES[themeKey]!.name, color: '#555', fontSize: 10,
      } as ShapeSpec);
      allNodes.push(...buildThemeRow(themeKey, y));
    });

    shapes.setData([...colHeaders, ...rowHeaders, ...allNodes]);

    const gui = new GUI({ title: 'Node Themes', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = {
      applyTheme: 'material',
      haloHighlight: false,
      devInfo: false,
    };

    gui.add(params, 'applyTheme', themeKeys).name('Apply theme to all').onChange((key: string) => {
      const { colors, border } = THEMES[key]!;
      const wb = { color: border, width: 1.5, alpha: 0.7 };
      themeKeys.forEach(themeKey => {
        shapeIds(themeKey).forEach((id, si) => {
          shapes.update(id, { fill: { type: 'solid', color: colors[si]! }, border: wb });
        });
      });
    });

    gui.add(params, 'haloHighlight').name('Halo highlight').onChange((v: boolean) => {
      const theme = THEMES[params.applyTheme]!;
      themeKeys.forEach(themeKey => {
        shapeIds(themeKey).forEach((id, si) => {
          shapes.update(id, {
            halo: v ? { color: theme.colors[si]!, radius: 14, alpha: 0.35 } : undefined,
          });
        });
      });
    });

    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
  },
};
