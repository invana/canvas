/**
 * Node Styles — Solid Colors
 *
 * Demonstrates every built-in node shape filled with a solid color.
 * Imports `allNodeShapes` as the base node set and passes the array directly
 * to `ElementPlugin.setData()`. A single lil-gui panel lets you change
 * the fill color and opacity across all shapes at once.
 *
 * Shapes shown (grid, 4 columns):
 *   circle · ellipse · rect · rounded-rect
 *   diamond · hexagon · triangle · pentagon
 *   star-5pt · star-6pt
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin, ElementPlugin } from '@invana/canvas';
import { createContainer } from '../../../../src/div-utils.js';
import { allNodeShapes } from '../../all-nodes-shapes.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Solid Colors' };
export default meta;
type Story = StoryObj;

export const SolidColors: Story = {
  name: 'Solid Colors',
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

    const elements = new ElementPlugin({ key: 'elements' });
    await canvas.plugins.register(elements);

    // Build node list from allNodeShapes, applying initial style
    const params = { fill: '#3fcbeb', opacity: 1 };

    const nodes = allNodeShapes.map(entry => ({
      ...entry,
      spec: {
        ...entry.spec,
        style:  { ...entry.spec.style, fill: params.fill, fillAlpha: params.opacity },
        states: {
          hovered:  { strokeWidth: 3.5, fillAlpha: 0.8 },
          selected: { stroke: '#ffffff', strokeWidth: 4 },
        },
      },
    }));

    elements.setData(nodes);
    elements.fitContent();

    // ── lil-gui ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Node style', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    function applyStyle(): void {
      allNodeShapes.forEach(entry => {
        elements.updateSolid(entry.spec.id!, {
          style: { fill: params.fill, fillAlpha: params.opacity },
        } as never);
      });
    }

    gui.addColor(params, 'fill').name('fill color').onChange(applyStyle);
    gui.add(params, 'opacity', 0, 1, 0.01).name('opacity').onChange(applyStyle);
  },
};
