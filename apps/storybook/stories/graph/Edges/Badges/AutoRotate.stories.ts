import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Badges/AutoRotate' };
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
export const AutoRotateStory: Story = {
  name: 'AutoRotate',
  render: () => createContainer({ id: 'graph-edges-badges-autorotate' }),

  play: async ({ canvasElement }) => {
    const variants = [
      { id: 'off',     label: 'autoRotate: false',                   autoRotate: false, keepUpright: true },
      { id: 'upright', label: 'autoRotate: true, keepUpright: true', autoRotate: true,  keepUpright: true },
      { id: 'raw',     label: 'autoRotate: true, keepUpright: false', autoRotate: true,  keepUpright: false },
    ] as const;

    const nodes: GraphNode[] = variants.flatMap((v, i) => [
      {
        id: `${v.id}-src`,
        type: 'node',
        position: { x: -260, y: (i - 1) * 160 - 60 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10
        }
      },
      {
        id: `${v.id}-tgt`,
        type: 'node',
        // Stagger the target by +120 px so the bezier bends visibly.
        position: { x: 260, y: (i - 1) * 160 + 60 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x34d399
        }
      },
    ]);

    const edges: GraphEdge[] = variants.map((v) => ({ type: 'edge',
      id: v.id,
      source: `${v.id}-src`,
      target: `${v.id}-tgt`,
      style: {
        shape: { pathType: 'bezier' },
        badges: [
          {
            id: 'flow',
            type: 'node',
            placement: 'middle',
            shape: { kind: 'rect', width: 70, height: 20, cornerRadius: 4 },
            fill: 0x7c3aed,
            strokeColor: 0xffffff,
            strokeWidth: 1,
            labelText: 'flow',
            labelColor: 0xffffff,
            labelFontSize: 11,
            autoRotate: v.autoRotate,
            keepUpright: v.keepUpright
          },
        ]
      }
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-autorotate',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'triangle' } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true }
      }
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
