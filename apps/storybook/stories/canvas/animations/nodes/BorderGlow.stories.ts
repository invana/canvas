/**
 * BorderGlow animation — pulsing border width / colour
 *
 * Three shapes with glowing borders at different speeds and intensities.
 * A lil-gui toggle lets you start / stop the animation at runtime.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { ElementPlugin, type CircleElementSpec, type RectElementSpec, type HexagonElementSpec } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Animations/Nodes' };
export default meta;
type Story = StoryObj;

const DARK_BG = '#0f172a';
const GAP = 180;

export const BorderGlow: Story = {
  name: 'BorderGlow',
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

    elements.addNode('circle', {
      id: 'bg1', x: -GAP, y: 0, radius: 50, label: 'width only',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    } as CircleElementSpec);
    elements.addNode('rect', {
      id: 'bg2', x: 0, y: 0, width: 100, height: 80, label: 'colour',
      style: { fill: '#1f2937', stroke: '#f59e0b', strokeWidth: 2 },
    } as RectElementSpec);
    elements.addNode('hexagon', {
      id: 'bg3', x: GAP, y: 0, radius: 55, label: 'both',
      style: { fill: '#1a0033', stroke: '#a78bfa', strokeWidth: 2 },
    } as HexagonElementSpec);

    elements.fitContent();

    elements.animate('bg1', { borderGlow: { minWidth: 1, maxWidth: 6, duration: 1200 } });
    elements.animate('bg2', { borderGlow: { minWidth: 1, maxWidth: 5, duration: 900, color: '#fbbf24' } });
    elements.animate('bg3', { borderGlow: { minWidth: 2, maxWidth: 8, duration: 1600, color: '#c084fc' } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      ['bg1', 'bg2', 'bg3'].forEach(id => {
        if (v) elements.animate(id, { borderGlow: { minWidth: 2, maxWidth: 6, duration: 1200 } });
        else elements.clearAnimation(id, 'borderGlow');
      });
    });
  },
};
