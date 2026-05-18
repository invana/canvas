import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Placements/CenterVsInsideCenter' };
export default meta;
type Story = StoryObj;

/**
 * `'center'` and `'inside-center'` share the geometric anchor (shape
 * centre) but differ in **containment**:
 *
 * - `'center'` is an anchor-only placement — the label may overflow the
 *   host bounds when it doesn't fit.
 * - `'inside-center'` carries the containment contract — the shrink →
 *   truncate → hide cascade kicks in to keep the label inside.
 *
 * Two identical small rects side-by-side, one of each placement. Use the
 * GUI to grow `text` length and watch only the `center` label spill out.
 */
export const CenterVsInsideCenter: Story = {
  render: () => createContainer({ id: 'graph-label-center-vs-inside-center' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'n-center',
        position: { x: -120, y: 0 },
        style: {
          labelText: 'center',
          labelPlacement: 'center',
        },
      },
      {
        id: 'n-inside-center',
        position: { x: 120, y: 0 },
        style: {
          labelText: 'inside-center',
          labelPlacement: 'inside-center',
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-center-vs-inside-center')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'rect', width: 90, height: 50, cornerRadius: 8 },
            bgFill: 0xf1f5f9,
            bgStrokeColor: 0x475569,
            bgStrokeWidth: 1,
            labelFontSize: 13,
            labelFontWeight: 600,
            labelColor: 0x454545,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 200);

    const settings = {
      text: 'a moderately long label',
      shapeWidth: 90,
      shapeHeight: 50,
    };
    const apply = (): void => {
      // `updateNode` replaces `style` wholesale — pin each node's
      // distinguishing `labelPlacement` here so the GUI tweak doesn't drop
      // it back to the field default ('bottom').
      const shape = { kind: 'rect' as const, width: settings.shapeWidth, height: settings.shapeHeight, cornerRadius: 8 };
      graph.store.updateNode('n-center',        { style: { labelText: settings.text, labelPlacement: 'center',        shape } });
      graph.store.updateNode('n-inside-center', { style: { labelText: settings.text, labelPlacement: 'inside-center', shape } });
    };
    const gui = new GUI({ title: 'center vs inside-center' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'shapeWidth', 40, 200, 5).onChange(apply);
    gui.add(settings, 'shapeHeight', 30, 120, 5).onChange(apply);
  },
};
