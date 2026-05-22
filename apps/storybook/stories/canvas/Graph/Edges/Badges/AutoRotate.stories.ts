import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/AutoRotate' };
export default meta;
type Story = StoryObj;

/**
 * `EdgeBadge.autoRotate` rotates the badge to follow the path tangent.
 * Three bezier curves with a wide-rectangle badge ("flow") at the
 * midpoint — same data, three rotation behaviours:
 *
 * - **`autoRotate: false`** (default) — badge stays axis-aligned, so it
 *   reads horizontally regardless of the local tangent direction.
 * - **`autoRotate: true`** with `keepUpright: true` (default) — badge
 *   rotates to align with the tangent, but flips by 180° on the
 *   "downward" half so text never reads upside-down.
 * - **`autoRotate: true, keepUpright: false`** — badge rotates strictly
 *   with the tangent, including upside-down on the bottom half.
 *
 * Drag the target nodes around to swing the bezier through different
 * orientations and confirm the keepUpright flip kicks in at the ±90°
 * threshold.
 */
export const AutoRotate: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-autorotate' }),

  play: async ({ canvasElement }) => {
    const variants = [
      { id: 'off',     label: 'autoRotate: false',                   autoRotate: false, keepUpright: true },
      { id: 'upright', label: 'autoRotate: true, keepUpright: true', autoRotate: true,  keepUpright: true },
      { id: 'raw',     label: 'autoRotate: true, keepUpright: false', autoRotate: true,  keepUpright: false },
    ] as const;

    const nodes: NodeData[] = variants.flatMap((v, i) => [
      {
        id: `${v.id}-src`,
        position: { x: -260, y: (i - 1) * 160 - 60 },
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
        // Stagger the target by +120 px so the bezier bends visibly.
        position: { x: 260, y: (i - 1) * 160 + 60 },
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
        shape: { pathType: 'bezier' },
        badges: [
          {
            id: 'flow',
            placement: 'middle',
            shape: { kind: 'rect', width: 70, height: 20, cornerRadius: 4 },
            fill: 0x7c3aed,
            strokeColor: 0xffffff,
            strokeWidth: 1,
            labelText: 'flow',
            labelColor: 0xffffff,
            labelFontSize: 11,
            autoRotate: v.autoRotate,
            keepUpright: v.keepUpright,
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-autorotate',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'triangle' } },
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
