import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeData,
  type NodeData,
  type ParallelEdgeDistribute,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/ParallelEdges/ParallelEdgeCustomPolicy' };
export default meta;
type Story = StoryObj;

/**
 * `ParallelEdgeBehaviour` accepts a pluggable `distribute` policy. The
 * default centres `N` ranks symmetrically around zero — but any function
 * that takes a `ParallelEdgeGroup` and returns one
 * `ParallelEdgePatch` per edge is fair game.
 *
 * This story plugs in an **asymmetric fanout** policy: all ranks are
 * non-negative (`0, 1, 2, …, N−1`) so the bundle pushes off one side of
 * the chord instead of bowing around it. Useful for things like
 * directed-edge stacks or "stripe" visualisations where the second-and-
 * later edges should peel off the first.
 *
 * The flip toggle inverts the offset sign so you can watch the same policy
 * fan to the opposite side.
 */
export const ParallelEdgeCustomPolicy: Story = {
  render: () => createContainer({ id: 'graph-behaviour-parallel-edge-custom' }),

  play: async ({ canvasElement }) => {
    const settings = { flip: false, spacing: 14 };

    const nodes: NodeData[] = [
      { id: 'a', position: { x: -220, y: 0 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'circle', radius: 30 } } },
      { id: 'b', position: { x:  220, y: 0 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'circle', radius: 30 } } },
    ];

    const edges: EdgeData[] = Array.from({ length: 6 }, (_, i) => ({
      id: `e${i}`,
      source: 'a',
      target: 'b',
      style: {
        shape: {
          pathType: 'smooth',
          sourceAnchor: 'boundary',
          targetAnchor: 'boundary',
        },
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviour-parallel-edge-custom')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edge: {
          style: {
            strokeColor: 0x64748b,
            strokeWidth: 2,
            strokeCap: 'round',
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    // Asymmetric one-sided fanout: rank `i` maps to offset `i × spacing`
    // (or its negative when `flip` is on). Edges peel off one side of the
    // straight chord instead of bowing around it.
    const oneSidedFanout: ParallelEdgeDistribute = (group, ctx) => {
      const { sourceCenter: src, targetCenter: tgt, edges: groupEdges } = group;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.hypot(dx, dy) || 1;
      const sign = settings.flip ? -1 : 1;
      // Perpendicular unit vector — same convention as the default policy.
      const nx = -dy / len * sign;
      const ny =  dx / len * sign;
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;

      return groupEdges.map((edge, i) => {
        const off = i * ctx.spacing;
        return {
          edgeId: edge.id,
          waypoints: [{ x: mx + nx * off, y: my + ny * off }],
        };
      });
    };

    const parallel = new ParallelEdgeBehaviour({
      id: 'parallel-edges',
      layerId: 'graph',
      enabled: true,
      spacing: settings.spacing,
      anchorOffset: false,
      distribute: oneSidedFanout,
    });
    canvas.behaviours.register(parallel);

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const gui = new GUI({ title: 'Custom policy · one-sided fanout' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'flip').onChange(() => parallel.recompute());
    gui.add(settings, 'spacing', 0, 40, 1).onChange((v: number) => {
      parallel.setOptions({ spacing: v });
    });

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
