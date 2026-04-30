/**
 * Node Styles — Solid Colors
 *
 * Demonstrates every built-in node shape filled with a solid color.
 * Uses GraphDataPlugin to manage nodes. A lil-gui panel lets you change
 * the fill color and opacity across all shapes at once.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { allNodeShapeData } from '../../../all-nodes-shapes.js';
import { createContainer } from '../../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Color/Solid Colors' };
export default meta;
type Story = StoryObj;

export const SolidColors: Story = {
  name: 'Solid Colors',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const params = { fill: '#3fcbeb', opacity: 1 };

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1.5,
            spacing: 30,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 60,
            data: { nodes: allNodeShapeData, edges: [] },
            styles: {
              node: {
                fill: params.fill,
                opacity: params.opacity,
                stroke: '#ffffff',
                strokeWidth: 2,
              },
            },
          },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;

    function applyStyle(): void {
      graph.setStyles({
        node: { fill: params.fill, opacity: params.opacity },
      });
    }

    // ── lil-gui ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Node style', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    gui.addColor(params, 'fill').name('fill color').onChange(applyStyle);
    gui.add(params, 'opacity', 0, 1, 0.01).name('opacity').onChange(applyStyle);

    gui.add({ reset: () => {
      params.fill = '#3fcbeb';
      params.opacity = 1;
      gui.controllers.forEach(c => c.updateDisplay());
      applyStyle();
    } }, 'reset').name('Reset');
  },
};
