import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Parallel/Straight' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `straight` edges between two nodes. Router `straight`
 * + pathStyle `normal` — the polyline passes through the per-edge
 * waypoint as a sharp vertex, so the fan reads as a stack of pointed
 * triangles.
 *
 * Each edge's mid-waypoint sits at `midpoint + perpendicular × k × spacing`
 * with `k = i − (N − 1)/2` so the bundle is centred on zero. Drag either
 * node — waypoints recompute on every `node:update`.
 */
export const Straight: Story = {
  render: () => createContainer({ id: 'graph-parallel-straight' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -260, y: -180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
      { id: 'b', position: { x:  260, y:  180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
    ];

    const settings = { count: 7, spacing: 26 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-straight')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: { style: { shape: { kind: 'circle', radius: 22 } } },
        edge: { style: { strokeColor: 0x64748b, strokeWidth: 2, strokeCap: 'round' } },
      },
    });
    canvas.layers.add(graph);

    const patchAllEdges = () => {
      const src = graph.store.getPosition('a');
      const tgt = graph.store.getPosition('b');
      if (!src || !tgt) return;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny =  dx / len;
      const half = (settings.count - 1) / 2;
      for (let i = 0; i < settings.count; i++) {
        const k = i - half;
        graph.store.updateEdge(`e${i}`, {
          style: {
            shape: {
              pathType: 'straight',
              waypoints: [{
                x: src.x + dx * 0.5 + nx * k * settings.spacing,
                y: src.y + dy * 0.5 + ny * k * settings.spacing,
              }],
            },
          },
        });
      }
    };

    // Edge count is mutable, so re-seed via `setData` when it changes —
    // pulling current positions from the store keeps drag state intact.
    const reseed = () => {
      const liveNodes = nodes.map((n) => ({
        ...n,
        position: graph.store.getPosition(n.id) ?? n.position!,
      }));
      const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
        id: `e${i}`, source: 'a', target: 'b',
      }));
      graph.setData({ nodes: liveNodes, edges });
      patchAllEdges();
    };

    reseed();

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    graph.store.events.on('node:update', () => patchAllEdges());

    const gui = new GUI({ title: 'Straight · parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'count', 1, 15, 1).onChange(reseed);
    gui.add(settings, 'spacing', 0, 80, 1).onChange(patchAllEdges);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
