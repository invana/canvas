/**
 * DevInfoPlugin — developer debug overlay
 *
 * Displays a live-updating panel showing:
 *   - Canvas display size
 *   - Camera position (x, y) and zoom level
 *   - Visible world bounds
 *   - Pointer position in screen and world coordinates
 *   - FPS counter
 *
 * Use lil-gui to switch corner, toggle visibility, and adjust appearance.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, DrawingPlugin, DevInfoPlugin } from '@invana/canvas';
import type { DevInfoCorner } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = {
  title: 'Canvas/Plugins',
};
export default meta;
type Story = StoryObj;

// ─── helpers ─────────────────────────────────────────────────────────────────
const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#aed581', '#ff8a65',
];
const rng = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;

// ─── story ───────────────────────────────────────────────────────────────────
export const DevInfoOverlay: Story = {
  name: 'DevInfoOverlay',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // ── canvas setup ─────────────────────────────────────────────────────────
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
      backgroundColor: '#12121e',
    });
    await canvas.init();

    // ── background ───────────────────────────────────────────────────────────
    const bg = new BackgroundPlugin({
      key: 'bg',
      type: 'pattern',
      patternType: 'dots',
      backgroundColor: '#12121e',
      color: '#3a3a5c',
      size: 1.5,
      spacing: 28,
      alpha: 0.7,
      followCamera: true,
    });
    await canvas.plugins.register(bg);

    // ── drawing ──────────────────────────────────────────────────────────────
    const draw = new DrawingPlugin({ key: 'draw' });
    await canvas.plugins.register(draw);

    // Scatter shapes across a large world so panning is interesting
    const WORLD_W = 3000;
    const WORLD_H = 2000;
    const types = ['circle', 'rect', 'polygon', 'star'] as const;

    for (let i = 0; i < 60; i++) {
      const x = rng(60, WORLD_W - 60);
      const y = rng(60, WORLD_H - 60);
      const r = rng(20, 48);
      const color = pick(PALETTE);
      const stroke = 'rgba(0,0,0,0.45)';
      const type = pick(types);

      switch (type) {
        case 'circle':
          draw.circle(x, y, r, { fill: color, stroke, strokeWidth: 2 });
          break;
        case 'rect':
          draw.rect(x - r, y - r * 0.65, r * 2, r * 1.3, {
            fill: color, stroke, strokeWidth: 2, cornerRadius: 8,
          });
          break;
        case 'polygon':
          draw.polygon(x, y, r, pick([3, 5, 6]), { fill: color, stroke, strokeWidth: 2 });
          break;
        case 'star':
          draw.star(x, y, r, { fill: color, stroke, strokeWidth: 2 });
          break;
      }
    }

    // Fit the initial view
    canvas.camera.fitTo({ x: 0, y: 0, width: WORLD_W, height: WORLD_H }, 60);

    // ── dev-info plugin ──────────────────────────────────────────────────────
    const devInfo = new DevInfoPlugin({
      key: 'dev-info',
      corner: 'bottom-left',
      enabled: true,
    });
    await canvas.plugins.register(devInfo);

    // ── GUI ──────────────────────────────────────────────────────────────────
    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;';

    const state = {
      corner: 'bottom-left' as DevInfoCorner,
      enabled: true,
      fontSize: 11,
      opacity: 0.92,
    };

    const corners: DevInfoCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    gui
      .add(state, 'corner', corners)
      .name('Corner')
      .onChange((v: DevInfoCorner) => devInfo.setOptions({ corner: v }));

    gui
      .add(state, 'enabled')
      .name('Enabled')
      .onChange((v: boolean) => devInfo.setEnabled(v));

    gui
      .add(state, 'fontSize', 9, 16, 1)
      .name('Font size')
      .onChange((v: number) => devInfo.setOptions({ fontSize: v }));

    gui
      .add(state, 'opacity', 0.1, 1, 0.05)
      .name('Opacity')
      .onChange((v: number) => devInfo.setOptions({ opacity: v }));

    const cameraActions = {
      fitAll: () => canvas.camera.fitTo({ x: 0, y: 0, width: WORLD_W, height: WORLD_H }, 60),
      zoomIn: () => canvas.camera.zoom(1.3),
      zoomOut: () => canvas.camera.zoom(0.77),
    };

    const camFolder = gui.addFolder('Camera');
    camFolder.add(cameraActions, 'fitAll').name('Fit All (center content)');
    camFolder.add(cameraActions, 'zoomIn').name('Zoom In ×1.3');
    camFolder.add(cameraActions, 'zoomOut').name('Zoom Out ×0.77');
    camFolder.open();
  },
};
