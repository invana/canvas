/**
 * ShapePlugin — Fill Styles
 *
 * Demonstrates all three fill types on circles and rects:
 *   - Solid color
 *   - Linear gradient
 *   - Radial gradient (approximated as linear in PixiJS 8)
 *
 * Use the lil-gui panel to tweak colors live.
 */
import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin, ShapePlugin, DevInfoPlugin } from '@invana/canvas-core-new';
import { createContainer } from '../../../../../src/div-utils.js';
import GUI from 'lil-gui';

const meta: Meta = { title: '2. Node Styles' };
export default meta;
type Story = StoryObj;

export const ShapeFillStyles: Story = {
  name: 'Fill Styles',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: '#1a1a2e' });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'solid', backgroundColor: '#1a1a2e',
    }));

    const devInfo = new DevInfoPlugin({ key: 'dev-info' });
    await canvas.plugins.register(devInfo);

    const shapes = new ShapePlugin({ key: 'shapes', zIndex: 10, fitOnRender: true });
    await canvas.plugins.register(shapes);

    const wb = { color: '#ffffff', width: 2, alpha: 0.5 };

    shapes.setData([
      // ── Row 1: circles ───────────────────────────────────────────────────
      { id: 'solid-c', type: 'circle', x: -240, y: -70, radius: 65,
        fill: { type: 'solid', color: '#4fc3f7' }, border: wb },
      { id: 'linear-c', type: 'circle', x: 0, y: -70, radius: 65,
        fill: { type: 'linear', angle: 135, stops: [
          { offset: 0, color: '#f06292' },
          { offset: 1, color: '#ce93d8' },
        ]}, border: wb },
      { id: 'radial-c', type: 'circle', x: 240, y: -70, radius: 65,
        fill: { type: 'radial', stops: [
          { offset: 0,   color: '#ffffff' },
          { offset: 0.4, color: '#4dd0e1' },
          { offset: 1,   color: '#0d2137' },
        ]}, border: wb },

      // ── Row 2: rects ─────────────────────────────────────────────────────
      { id: 'solid-r', type: 'rect', x: -310, y: 60, width: 140, height: 90,
        fill: { type: 'solid', color: '#81c784' }, border: wb },
      { id: 'linear-r', type: 'rect', x: -70, y: 60, width: 140, height: 90,
        fill: { type: 'linear', stops: [
          { offset: 0, color: '#ffb74d' },
          { offset: 1, color: '#f06292' },
        ]}, border: wb },
      { id: 'radial-r', type: 'rect', x: 170, y: 60, width: 140, height: 90,
        fill: { type: 'radial', stops: [
          { offset: 0, color: '#fffde7' },
          { offset: 1, color: '#ce93d8' },
        ]}, border: wb },

      // ── Row 3: polygons ───────────────────────────────────────────────────
      { id: 'solid-p', type: 'polygon', x: -240, y: 220, radius: 55, sides: 6,
        fill: { type: 'solid', color: '#ff8a65' }, border: wb },
      { id: 'linear-p', type: 'polygon', x: 0, y: 220, radius: 55, sides: 6,
        fill: { type: 'linear', stops: [
          { offset: 0, color: '#4dd0e1' },
          { offset: 1, color: '#81c784' },
        ]}, border: wb },
      { id: 'radial-p', type: 'polygon', x: 240, y: 220, radius: 55, sides: 6,
        fill: { type: 'radial', stops: [
          { offset: 0, color: '#fff9c4' },
          { offset: 1, color: '#ff8a65' },
        ]}, border: wb },
    ] as never[]);

    // GUI
    const gui = new GUI({ title: 'Fill Styles', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    const params = { devInfo: true, solidColor: '#4fc3f7', gradStart: '#f06292', gradEnd: '#ce93d8' };

    gui.add(params, 'devInfo').name('DevInfo overlay').onChange((v: boolean) => devInfo.setEnabled(v));
    gui.addColor(params, 'solidColor').name('Solid color').onChange((v: string) => {
      shapes.update('solid-c', { fill: { type: 'solid', color: v } });
      shapes.update('solid-r', { fill: { type: 'solid', color: v } });
      shapes.update('solid-p', { fill: { type: 'solid', color: v } });
    });
    gui.addColor(params, 'gradStart').name('Gradient start').onChange((v: string) => {
      const stops = [{ offset: 0, color: v }, { offset: 1, color: params.gradEnd }];
      shapes.update('linear-c', { fill: { type: 'linear', stops } });
      shapes.update('linear-r', { fill: { type: 'linear', stops } });
      shapes.update('linear-p', { fill: { type: 'linear', stops } });
    });
    gui.addColor(params, 'gradEnd').name('Gradient end').onChange((v: string) => {
      const stops = [{ offset: 0, color: params.gradStart }, { offset: 1, color: v }];
      shapes.update('linear-c', { fill: { type: 'linear', stops } });
      shapes.update('linear-r', { fill: { type: 'linear', stops } });
      shapes.update('linear-p', { fill: { type: 'linear', stops } });
    });
  },
};
