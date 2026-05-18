import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Alignment' };
export default meta;
type Story = StoryObj;

/**
 * `labelAlign` controls horizontal alignment **inside** the label's text
 * box once `wrap` has produced multiple lines — `'left' | 'center' | 'right'`.
 *
 * One node with a long label, wrap forced via `labelStyle.wrap.maxWidth`,
 * so multiple lines exist for alignment to act on. Flip the picker to
 * compare the three values; a single-line label looks identical for all
 * three because alignment only matters when there's slack.
 */
export const Alignment: Story = {
  render: () => createContainer({ id: 'graph-label-alignment' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A multi-line label that wraps to demonstrate horizontal alignment';

    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 180, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-alignment')!;
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
            bgFill: 0xfb923c,
            bgStrokeColor: 0xea580c,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 200);

    // Alignment is on `LabelContent.align` (the canvas surface). The graph
    // adapter forwards `labelAlign` into the same field, but we drive the
    // escape-hatch `labelStyle` here because `wrap` is required to make
    // multi-line happen — and you can't mix flat label fields with
    // `labelStyle` (the adapter ignores flat when `labelStyle` is set).
    const settings = { align: 'center' as 'left' | 'center' | 'right' };
    const apply = (): void => {
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      const prevLs = prev.labelStyle;
      if (!prevLs || prevLs.content.kind !== 'text') return;
      graph.store.updateNode('n', {
        style: {
          ...prev,
          labelStyle: {
            ...prevLs,
            content: { ...prevLs.content, align: settings.align },
          },
        },
      });
    };
    const gui = new GUI({ title: 'labelAlign' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'align', ['left', 'center', 'right']).onChange(apply);
  },
};
