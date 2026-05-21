import type { Meta, StoryObj } from '@storybook/react-vite';
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
 * Row of six shapes, each with a long wrapped label that fans the same
 * `align` value over every silhouette. Flip the picker to compare; a
 * single-line label would look identical for all three values since
 * alignment only matters when there is slack.
 */
export const Alignment: Story = {
  render: () => createContainer({ id: 'graph-label-alignment' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A multi-line label that wraps to demonstrate horizontal alignment';

    const nodes: NodeData[] = [
      {
        id: 'circle',
        position: { x: -280, y: -150 },
        style: {
          shape: { kind: 'circle', radius: 24 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
      {
        id: 'rect',
        position: { x: 0, y: -150 },
        style: {
          shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
      {
        id: 'arc',
        position: { x: 280, y: -150 },
        style: {
          shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
      {
        id: 'regular-polygon',
        position: { x: -280, y: 150 },
        style: {
          shape: { kind: 'regular-polygon', sides: 5, radius: 26 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
      {
        id: 'star',
        position: { x: 0, y: 150 },
        style: {
          shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 },
          },
        },
      },
      {
        id: 'polygon',
        position: { x: 280, y: 150 },
        style: {
          shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545, align: 'center' },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
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
          style: { bgFill: 0xfb923c, bgStrokeColor: 0xea580c },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = { align: 'center' as 'left' | 'center' | 'right' };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        const prevLs = prev.labelStyle;
        if (!prevLs || prevLs.content.kind !== 'text') continue;
        graph.store.updateNode(id, {
          style: {
            ...prev,
            labelStyle: { ...prevLs, content: { ...prevLs.content, align: settings.align } },
          },
        });
      }
    };
    const gui = new GUI({ title: 'labelAlign' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'align', ['left', 'center', 'right']).onChange(apply);
  },
};
