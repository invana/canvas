import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Wrap' };
export default meta;
type Story = StoryObj;

/**
 * `wrap` controls word-wrap and truncation — `maxWidth`, `maxLines`,
 * `wordWrap`, and `overflow: 'clip' | 'ellipsis'`. Wrap config has no
 * matching flat field on `NodeStyle`, so this story uses the
 * `labelStyle` escape hatch (full `ShapeLabelStyle` payload).
 *
 * One node with a long label. Sweep `maxWidth` to trigger wrap, then
 * `maxLines` + `overflow` to control truncation. `wordWrap` toggles
 * wrap entirely — when off, the label renders on one line regardless of
 * `maxWidth`.
 */
export const Wrap: Story = {
  render: () => createContainer({ id: 'graph-label-wrap' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A long descriptive label that wraps onto multiple lines and is eventually truncated with an ellipsis';

    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-wrap')!;
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
            shape: { kind: 'circle', radius: 22 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 240);

    const settings = {
      text: LONG,
      maxWidth: 160,
      maxLines: 3,
      wordWrap: true,
      overflow: 'ellipsis' as 'clip' | 'ellipsis',
    };
    const apply = (): void => {
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      const prevLs = prev.labelStyle;
      if (!prevLs || prevLs.content.kind !== 'text') return;
      const nextLs: ShapeLabelStyle = {
        ...prevLs,
        content: { ...prevLs.content, text: settings.text },
        wrap: {
          maxWidth: settings.maxWidth,
          maxLines: settings.maxLines,
          wordWrap: settings.wordWrap,
          overflow: settings.overflow,
        },
      };
      graph.store.updateNode('n', { style: { ...prev, labelStyle: nextLs } });
    };
    const gui = new GUI({ title: 'Wrap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'maxWidth', 40, 360, 10).onChange(apply);
    gui.add(settings, 'maxLines', 1, 6, 1).onChange(apply);
    gui.add(settings, 'wordWrap').onChange(apply);
    gui.add(settings, 'overflow', ['clip', 'ellipsis']).onChange(apply);
  },
};
