import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/InsideFitCascade' };
export default meta;
type Story = StoryObj;

/**
 * For `inside-*` placements the decoration runs a **shrink → truncate →
 * hide** cascade to honour the containment contract:
 *
 * 1. Shrink the font down toward `minFontSize`.
 * 2. If it still doesn't fit at the floor, truncate (ellipsis) to the
 *    width budget.
 * 3. If neither shrink nor truncate produces a renderable result, hide.
 *
 * One rect, one long label, `placement: 'inside-center'`. Use the GUI to
 * shrink the shape (`width` / `height`) and watch the cascade tick:
 * size drops → text truncates → label disappears. Raise `minFontSize` to
 * see the cascade hit the hide step sooner.
 */
export const InsideFitCascade: Story = {
  render: () => createContainer({ id: 'graph-label-inside-fit-cascade' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A long descriptive label that has to fit inside';

    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 180, height: 90, cornerRadius: 8 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 16, fontWeight: 600, fill: 0x454545 },
            placement: 'inside-center',
            minFontSize: 9,
          },
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-inside-fit-cascade')!;
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
            bgFill: 0xf1f5f9,
            bgStrokeColor: 0x475569,
            bgStrokeWidth: 1,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 200);

    const settings = {
      width: 180,
      height: 90,
      fontSize: 16,
      minFontSize: 9,
      text: LONG,
    };
    const apply = (): void => {
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      const prevLs = prev.labelStyle;
      if (!prevLs || prevLs.content.kind !== 'text') return;
      const nextLs: ShapeLabelStyle = {
        ...prevLs,
        content: { ...prevLs.content, text: settings.text, fontSize: settings.fontSize },
        minFontSize: settings.minFontSize,
      };
      graph.store.updateNode('n', {
        style: {
          ...prev,
          shape: { kind: 'rect', width: settings.width, height: settings.height, cornerRadius: 8 },
          labelStyle: nextLs,
        },
      });
    };
    const gui = new GUI({ title: 'Inside-fit cascade' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'width', 30, 240, 2).onChange(apply);
    gui.add(settings, 'height', 20, 180, 2).onChange(apply);
    gui.add(settings, 'fontSize', 9, 28, 1).onChange(apply);
    gui.add(settings, 'minFontSize', 6, 24, 1).onChange(apply);
  },
};
