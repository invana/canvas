/**
 * ColorCycle animation — cycles fill colour through a palette
 *
 * Three circles cycling through different colour palettes at different speeds.
 * A lil-gui toggle lets you start / stop the animation at runtime.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, ElementPlugin } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Animations/Nodes' };
export default meta;
type Story = StoryObj;

const DARK_BG = '#0f172a';
const GAP = 180;

export const ColorCycle: Story = {
  name: 'ColorCycle',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({ container, backgroundColor: DARK_BG });
    await canvas.init();
    await canvas.plugins.register(new BackgroundPlugin({
      key: 'bg', type: 'pattern', patternType: 'dots',
      color: '#1e293b', backgroundColor: DARK_BG, size: 1.5, spacing: 30,
    }));

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    elements.addSolid('circle', {
      id: 'cc1', x: -GAP, y: 0, radius: 50, label: 'fire',
      style: { fill: '#7f1d1d', stroke: '#fca5a5', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'cc2', x: 0, y: 0, radius: 50, label: 'ocean',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'cc3', x: GAP, y: 0, radius: 50, label: 'rainbow',
      style: { fill: '#1a1a2e', stroke: '#a78bfa', strokeWidth: 2 },
    });

    elements.fitContent();

    elements.animate('cc1', { colorCycle: { colors: ['#dc2626', '#f97316', '#fbbf24'], period: 1200 } });
    elements.animate('cc2', { colorCycle: { colors: ['#0284c7', '#06b6d4', '#0891b2'], period: 2000 } });
    elements.animate('cc3', { colorCycle: { colors: ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'], period: 3000 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      if (v) {
        elements.animate('cc1', { colorCycle: { colors: ['#dc2626', '#f97316', '#fbbf24'], period: 1200 } });
        elements.animate('cc2', { colorCycle: { colors: ['#0284c7', '#06b6d4', '#0891b2'], period: 2000 } });
        elements.animate('cc3', { colorCycle: { colors: ['#f43f5e', '#a855f7', '#3b82f6', '#10b981'], period: 3000 } });
      } else {
        elements.clearAnimation('cc1', 'colorCycle');
        elements.clearAnimation('cc2', 'colorCycle');
        elements.clearAnimation('cc3', 'colorCycle');
      }
    });
  },
};
