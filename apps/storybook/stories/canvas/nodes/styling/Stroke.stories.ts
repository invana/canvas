/**
 * Node Stroke Styles
 *
 * Renders every shape from the `allNodeShapeData` catalogue and exposes a lil-gui
 * panel to tweak border/stroke properties in real time.
 *
 * Controls:
 *   - Stroke colour
 *   - Stroke width
 *   - Stroke alpha
 *   - Stroke cap
 *   - Stroke join
 *   - Stroke alignment
 *   - Stroke miter limit
 *
 * API used:
 *   Canvas.registerPlugin() — manual plugin registration
 *   CanvasOptions.plugins   — declarative plugin instantiation
 *   GraphDataPlugin.setStyles({ node: { … } }) — runtime style updates via lil-gui
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { allNodeShapeData } from '../../all-nodes-shapes.js';
import { createContainer } from '../../../../src/div-utils.js';

// Manual registration — required before declarative use in CanvasOptions
Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Nodes/Styling/Stroke' };
export default meta;
type Story = StoryObj;

export const Stroke: Story = {
  name: 'Stroke',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    // ── lil-gui defaults (used for initial node styles) ─────────────────────
    const params = {
      stroke: '#f97316',
      strokeWidth: 4,
      strokeAlpha: 1,
      strokeCap: 'round' as 'butt' | 'round' | 'square',
      strokeJoin: 'miter' as 'miter' | 'round' | 'bevel',
      strokeAlignment: 0.5,
      strokeMiterLimit: 10,
    };

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
            styles: { node: { fill: '#3fcbeb', ...params } },
          },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;
    const applyStyles = () => graph.setStyles({ node: { fill: '#3fcbeb', ...params } });

    // ── lil-gui panel ───────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Stroke Styles', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    gui.addColor(params, 'stroke').name('Stroke colour').onChange(applyStyles);
    gui.add(params, 'strokeWidth', 0, 10, 0.5).name('Stroke width').onChange(applyStyles);
    gui.add(params, 'strokeAlpha', 0, 1, 0.05).name('Stroke alpha').onChange(applyStyles);
    gui.add(params, 'strokeCap', ['butt', 'round', 'square']).name('Stroke cap').onChange(applyStyles);
    gui.add(params, 'strokeJoin', ['miter', 'round', 'bevel']).name('Stroke join').onChange(applyStyles);
    gui.add(params, 'strokeAlignment', 0, 1, 0.05).name('Stroke alignment').onChange(applyStyles);
    gui.add(params, 'strokeMiterLimit', 0, 30, 1).name('Stroke miter limit').onChange(applyStyles);

    gui.add({ reset: () => {
      params.stroke = '#f97316';
      params.strokeWidth = 4;
      params.strokeAlpha = 1;
      params.strokeCap = 'round';
      params.strokeJoin = 'miter';
      params.strokeAlignment = 0.5;
      params.strokeMiterLimit = 10;
      gui.controllers.forEach(c => c.updateDisplay());
      applyStyles();
    } }, 'reset').name('Reset');
  },
};
