import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeShapeOptions } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Nodes/Badges/Shapes' };
export default meta;
type Story = StoryObj;

/**
 * `NodeBadge.shape` accepts the full {@link NodeShapeOptions} discriminated
 * union — every shape kind a node body can use, a badge can use too. Six
 * hosts, one badge each, demonstrating the six built-in shape kinds:
 *
 * - `circle` — classic notification dot.
 * - `rect` — pill / chip plate (with `cornerRadius`).
 * - `regular-polygon` — hex / pentagon stamp.
 * - `star` — flair / featured marker.
 * - `polygon` — arbitrary tag silhouette.
 * - `arc` — partial-ring badge (rare but expressive).
 */
export const Shapes: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-shapes' }),

  play: async ({ canvasElement }) => {
    type Variant = {
      readonly id: string;
      readonly label: string;
      readonly shape: NodeShapeOptions;
    };
    const variants: Variant[] = [
      { id: 'circle',          label: 'circle',          shape: { kind: 'circle', radius: 10 } },
      { id: 'rect',            label: 'rect',            shape: { kind: 'rect', width: 22, height: 18, cornerRadius: 5 } },
      { id: 'regular-polygon', label: 'regular-polygon', shape: { kind: 'regular-polygon', sides: 6, radius: 12 } },
      { id: 'star',            label: 'star',            shape: { kind: 'star', points: 5, outerRadius: 12, innerRadius: 5 } },
      { id: 'polygon',         label: 'polygon',         shape: { kind: 'polygon', vertices: [
        { x: 0, y: -12 }, { x: 12, y: 0 }, { x: 0, y: 12 }, { x: -12, y: 0 },
      ] } },
      { id: 'arc',             label: 'arc',             shape: { kind: 'arc', innerR: 7, outerR: 13, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 } },
    ];

    const colGap = 180;
    const rowGap = 160;
    const nodes: NodeData[] = variants.map((v, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        id: v.id,
        position: { x: (col - 1) * colGap, y: (row - 0.5) * rowGap },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'demo',
              placement: 'top-right',
              origin: 'center',
              shape: v.shape,
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
            },
          ],
        },
      };
    });

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-shapes',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
