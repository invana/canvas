/**
 * Node Stroke Styles
 *
 * Renders every shape from the `allNodeShapes` catalogue and exposes a lil-gui
 * panel to tweak border/stroke properties in real time.
 *
 * Controls:
 *   - Stroke colour
 *   - Stroke width
 *   - Stroke alpha
 *
 * API used:
 *   ShapesPlugin.updateShape(id, { style: { … } })
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { ShapesPlugin, type BaseShapeSpec } from '@invana/plugins-shapes';
import { allNodeShapes } from '../../all-nodes-shapes.js';
import { createContainer } from '../../../../src/div-utils.js';

const meta: Meta = { title: 'Canvas/Nodes/Styling/Stroke' };
export default meta;
type Story = StoryObj;

export const Stroke: Story = {
  name: 'Stroke',
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

    const shapes = new ShapesPlugin({ key: 'shapes' });
    await canvas.plugins.register(shapes);

    // ── Add every shape from the catalogue ────────────────────────────────
    const shapeIds: string[] = [];
    for (const { type, spec } of allNodeShapes) {
      shapes.addShape(type, spec as BaseShapeSpec);
      shapeIds.push(spec.id);
    }

    shapes.fitContent(60);

    // ── lil-gui panel ───────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Stroke Styles', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    const params = {
      stroke: '#f97316',
      strokeWidth: 4,
      strokeAlpha: 1,
      strokeCap: 'round' as 'butt' | 'round' | 'square',
      strokeJoin: 'miter' as 'miter' | 'round' | 'bevel',
      strokeAlignment: 0.5,
      strokeMiterLimit: 10,
    };

    function applyToAll() {
      for (const id of shapeIds) {
        const obj = shapes.getShape(id);
        if (!obj) continue;
        const base = obj.element.spec.style ?? {};
        shapes.updateShape(id, {
          style: {
            ...base,
            stroke: params.stroke,
            strokeWidth: params.strokeWidth,
            strokeAlpha: params.strokeAlpha,
            strokeCap: params.strokeCap,
            strokeJoin: params.strokeJoin,
            strokeAlignment: params.strokeAlignment,
            strokeMiterLimit: params.strokeMiterLimit,
          },
        } as Partial<BaseShapeSpec>);
      }
    }

    gui.addColor(params, 'stroke').name('Stroke colour').onChange(applyToAll);
    gui.add(params, 'strokeWidth', 0, 10, 0.5).name('Stroke width').onChange(applyToAll);
    gui.add(params, 'strokeAlpha', 0, 1, 0.05).name('Stroke alpha').onChange(applyToAll);
    gui.add(params, 'strokeCap', ['butt', 'round', 'square']).name('Stroke cap').onChange(applyToAll);
    gui.add(params, 'strokeJoin', ['miter', 'round', 'bevel']).name('Stroke join').onChange(applyToAll);
    gui.add(params, 'strokeAlignment', 0, 1, 0.05).name('Stroke alignment').onChange(applyToAll);
    gui.add(params, 'strokeMiterLimit', 0, 30, 1).name('Stroke miter limit').onChange(applyToAll);

    gui.add({ reset: () => {
      params.stroke = '#f97316';
      params.strokeWidth = 4;
      params.strokeAlpha = 1;
      params.strokeCap = 'round';
      params.strokeJoin = 'miter';
      params.strokeAlignment = 0.5;
      params.strokeMiterLimit = 10;
      gui.controllers.forEach(c => c.updateDisplay());
      applyToAll();
    } }, 'reset').name('Reset');
  },
};
