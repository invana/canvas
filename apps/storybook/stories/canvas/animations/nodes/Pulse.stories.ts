/**
 * Pulse animation — expanding halo ring
 *
 * Three circles pulsing at different speeds and radii.
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

export const Pulse: Story = {
  name: 'Pulse',
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
      id: 'p1', x: -GAP, y: 0, radius: 40, label: 'slow',
      style: { fill: '#1e3a5f', stroke: '#3b82f6', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'p2', x: 0, y: 0, radius: 40, label: 'default',
      style: { fill: '#3b0764', stroke: '#a855f7', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'p3', x: GAP, y: 0, radius: 40, label: 'fast',
      style: { fill: '#450a0a', stroke: '#ef4444', strokeWidth: 2 },
    });

    elements.fitContent();

    elements.animate('p1', { pulse: { period: 3000, color: '#3b82f6', maxRadius: 90 } });
    elements.animate('p2', { pulse: { period: 1500, color: '#a855f7', maxRadius: 80 } });
    elements.animate('p3', { pulse: { period: 800,  color: '#ef4444', maxRadius: 75 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Running').onChange((v: boolean) => {
      ['p1', 'p2', 'p3'].forEach(id => {
        if (v) elements.animate(id, { pulse: { period: 1500, color: '#a855f7', maxRadius: 80 } });
        else elements.clearAnimation(id, 'pulse');
      });
    });
  },
};
