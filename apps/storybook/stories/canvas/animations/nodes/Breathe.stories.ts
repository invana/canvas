/**
 * Breathe animation — scale pulse (inhale / exhale)
 *
 * Three circles breathing at different speeds and amplitudes.
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

export const Breathe: Story = {
  name: 'Breathe',
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
      id: 'n1', x: -GAP, y: 0, radius: 50, label: 'slow',
      style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'n2', x: 0, y: 0, radius: 50, label: 'default',
      style: { fill: '#1e3a5f', stroke: '#a78bfa', strokeWidth: 2 },
    });
    elements.addSolid('circle', {
      id: 'n3', x: GAP, y: 0, radius: 50, label: 'fast',
      style: { fill: '#1e3a5f', stroke: '#f472b6', strokeWidth: 2 },
    });

    elements.fitContent();

    elements.animate('n1', { breathe: { period: 3000, amplitude: 0.08 } });
    elements.animate('n2', { breathe: { period: 1500, amplitude: 0.15 } });
    elements.animate('n3', { breathe: { period: 600,  amplitude: 0.20 } });

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { running: true };
    gui.add(params, 'running').name('Breathe running').onChange((v: boolean) => {
      if (v) {
        elements.animate('n1', { breathe: { period: 3000, amplitude: 0.08 } });
        elements.animate('n2', { breathe: { period: 1500, amplitude: 0.15 } });
        elements.animate('n3', { breathe: { period: 600,  amplitude: 0.20 } });
      } else {
        elements.clearAnimation('n1', 'breathe');
        elements.clearAnimation('n2', 'breathe');
        elements.clearAnimation('n3', 'breathe');
      }
    });
  },
};
