import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/Shapes' };
export default meta;
type Story = StoryObj;

/**
 * `EdgeBadge.shape` accepts the same {@link NodeShapeOptions} discriminated
 * union node badges use — the surface is identical because under the hood
 * every badge is just a shape registered as a follower of its host. Six
 * rows, one per built-in shape kind, each anchored at the midpoint of the
 * edge.
 */
export const Shapes: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-shapes' }),

  play: async ({ canvasElement }) => {
    type Variant = { id: string; label: string; shape: NodeShapeOptions };
    const variants: Variant[] = [
      { id: 'circle',          label: 'circle',          shape: { kind: 'circle', radius: 10 } },
      { id: 'rect',            label: 'rect',            shape: { kind: 'rect', width: 28, height: 18, cornerRadius: 5 } },
      { id: 'regular-polygon', label: 'regular-polygon', shape: { kind: 'regular-polygon', sides: 6, radius: 12 } },
      { id: 'star',            label: 'star',            shape: { kind: 'star', points: 5, outerRadius: 12, innerRadius: 5 } },
      { id: 'polygon',         label: 'polygon',         shape: { kind: 'polygon', vertices: [
        { x: 0, y: -12 }, { x: 12, y: 0 }, { x: 0, y: 12 }, { x: -12, y: 0 },
      ] } },
      { id: 'arc',             label: 'arc',             shape: { kind: 'arc', innerR: 7, outerR: 13, startAngle: 0, endAngle: Math.PI } },
    ];

    const nodes: NodeData[] = variants.flatMap((v, i) => [
      {
        id: `${v.id}-src`,
        position: { x: -260, y: (i - 2.5) * 80 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10,
        },
      },
      {
        id: `${v.id}-tgt`,
        position: { x: 260, y: (i - 2.5) * 80 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x34d399,
        },
      },
    ]);

    const edges: EdgeData[] = variants.map((v) => ({
      id: v.id,
      source: `${v.id}-src`,
      target: `${v.id}-tgt`,
      style: {
        badges: [
          {
            id: 'demo',
            placement: 'middle',
            shape: v.shape,
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 1.5,
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-shapes',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'none' } },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
