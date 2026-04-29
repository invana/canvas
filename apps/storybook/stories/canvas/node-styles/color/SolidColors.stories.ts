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
import { createContainer } from '../../../../src/div-utils.js';
import { allNodeShapeData } from '../../all-nodes-shapes.js';

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

    const graph = new GraphDataPlugin({ fitOnRender: true, fitPadding: 60 });
    await canvas.plugins.register(graph);

    const params = { fill: '#3fcbeb', opacity: 1 };

    graph.setData({ nodes: allNodeShapeData, edges: [] });
    graph.setStyles({
      node: { fill: params.fill, opacity: params.opacity, stroke: '#ffffff', strokeWidth: 2 },
    });

    // ── lil-gui ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Node style', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';

    function applyStyle(): void {
      graph.setStyles({
        node: { fill: params.fill, opacity: params.opacity },
      });
    }

    gui.addColor(params, 'fill').name('fill color').onChange(applyStyle);
    gui.add(params, 'opacity', 0, 1, 0.01).name('opacity').onChange(applyStyle);
  },
};
