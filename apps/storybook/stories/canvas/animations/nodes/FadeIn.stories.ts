/**
 * FadeIn animation — alpha 0 → 1 (once)
 *
 * Three shapes fading in at different durations.
 * A lil-gui button lets you replay the fade-in at runtime.
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

export const FadeIn: Story = {
  name: 'FadeIn',
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

    const elements = new ElementPlugin({ key: 'elements', fitOnRender: true });
    await canvas.plugins.register(elements);

    const addAll = () => {
      elements.addSolid('circle',  { id: 'fa1', x: -GAP, y: 0, radius: 50, label: '500ms',  style: { fill: '#1e3a5f', stroke: '#60a5fa', strokeWidth: 2 } });
      elements.addSolid('rect',    { id: 'fa2', x:     0, y: 0, width: 90, height: 90, label: '1000ms', style: { fill: '#1f2d3d', stroke: '#a78bfa', strokeWidth: 2 } });
      elements.addSolid('ellipse', { id: 'fa3', x:  GAP, y: 0, radiusX: 65, radiusY: 40, label: '2000ms', style: { fill: '#1f2d3d', stroke: '#f472b6', strokeWidth: 2 } });
      elements.animate('fa1', { fadeIn: { duration: 500 } });
      elements.animate('fa2', { fadeIn: { duration: 1000 } });
      elements.animate('fa3', { fadeIn: { duration: 2000 } });
    };

    addAll();
    elements.fit();

    const gui = new GUI({ container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px';
    const params = { replay: () => { elements.clear(); addAll(); elements.fit(); } };
    gui.add(params, 'replay').name('Replay fade-in');
  },
};
