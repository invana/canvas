import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

/** Narrower than the public `BadgePlacement` union — these stories only use the
 *  eight named anchors, so we can also reuse the values as node ids. */
type NamedPlacement =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

const meta: Meta = { title: 'canvas/graph/Nodes/Badges/Placements' };
export default meta;
type Story = StoryObj;

/**
 * Every named {@link BadgePlacement} on `NodeStyle.badges`. Eight rectangle
 * hosts arranged in a 3×3 grid (centre cell left intentionally blank — no
 * `'center'` placement on the named enum; use `origin: 'center'` on any
 * named placement for the half-overhang look).
 *
 * Each badge sits at the placement named on the host, with its own short
 * label so you can confirm corners vs. edge midpoints at a glance. The
 * `'top-right'` host additionally uses `origin: 'center'` to demonstrate
 * the half-overhang variant; every other host uses the default mirror
 * origin (badge sits fully outside the host edge).
 */
export const Placements: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-placements' }),

  play: async ({ canvasElement }) => {
    const named: NamedPlacement[] = [
      'top-left', 'top', 'top-right',
      'left', /* centre cell empty */ 'right',
      'bottom-left', 'bottom', 'bottom-right',
    ];

    const colGap = 240;
    const rowGap = 200;

    const nodes: NodeData[] = named.map((placement, i) => {
      // 3-col × 3-row grid with the centre cell skipped — `placement` cycles
      // through 8 named anchors, `i` 0..7 maps to grid indices 0..3, 5..8.
      const gridIndex = i >= 4 ? i + 1 : i;
      const col = gridIndex % 3;
      const row = Math.floor(gridIndex / 3);
      return {
        id: placement,
        position: {
          x: (col - 1) * colGap,
          y: (row - 1) * rowGap,
        },
        style: {
          shape: { kind: 'rect', width: 110, height: 70, cornerRadius: 10 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: placement,
          labelColor: 0xffffff,
          labelFontSize: 11,
          labelPlacement: 'center',
          badges: [
            {
              id: 'demo',
              placement,
              // Highlight one cell with the half-overhang origin so the
              // viewer can compare it against the mirror-default neighbours.
              ...(placement === 'top-right' ? { origin: 'center' as const } : {}),
              shape: { kind: 'circle', radius: 10 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 2,
            },
          ],
        },
      };
    });

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-placements',
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
