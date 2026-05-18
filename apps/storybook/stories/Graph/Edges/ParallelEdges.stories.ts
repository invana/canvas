import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type EdgeData, type NodeData } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Edges/ParallelEdges' };
export default meta;
type Story = StoryObj;

/**
 * Seven edges sharing the same `source` / `target` fan out into a leaf
 * shape by shifting each edge's single mid-waypoint perpendicular to the
 * `source → target` line.
 *
 * Each edge's array index `i` maps to a rank `k = i − (N−1) / 2` centred
 * on zero — for `N = 7` the ranks are `[−3, −2, −1, 0, 1, 2, 3]`. The
 * waypoint sits at `midpoint + perpendicular × k × spacing`, so the
 * `k = 0` edge runs straight through and the rest bow outward
 * symmetrically. Widening `spacing` fattens the leaf.
 *
 * `pathType: 'smooth'` (Catmull-Rom) interpolates through both endpoints
 * and the waypoint, so one shifted control yields the clean arc.
 *
 * No engine primitive expresses "parallel edges" today — the bundle is
 * built inside the story by recomputing each edge's waypoint from its
 * index on every GUI tweak and re-feeding `graph.setData`.
 */
export const ParallelEdges: Story = {
  render: () => createContainer({ id: 'graph-parallel-edges' }),

  play: async ({ canvasElement }) => {
    // Two static nodes positioned diagonally so the perpendicular axis of
    // the fan is visibly tilted (matches the leaf-shape reference image).
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -260, y: -180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
      { id: 'b', position: { x:  260, y:  180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
    ];

    // Seven parallel edges between a and b. Each entry is just id +
    // endpoints; the per-edge waypoint is derived from the array index at
    // render time so it stays in sync with node positions and GUI.
    const edges: EdgeData[] = [
      { id: 'e0', source: 'a', target: 'b' },
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'a', target: 'b' },
      { id: 'e3', source: 'a', target: 'b' },
      { id: 'e4', source: 'a', target: 'b' },
      { id: 'e5', source: 'a', target: 'b' },
      { id: 'e6', source: 'a', target: 'b' },
    ];

    const settings = { spacing: 26 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-edges')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: { style: { shape: { kind: 'circle', radius: 22 } } },
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

    // For each edge: shift the source→target midpoint along the unit
    // perpendicular normal `(nx, ny) = (−dy, dx) / len` by `k × spacing`,
    // then hand the result back as that edge's single waypoint.
    const rebuild = () => {
      const src = nodes[0]!.position!;
      const tgt = nodes[1]!.position!;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny =  dx / len;
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2;
      const half = (edges.length - 1) / 2;

      const positioned: EdgeData[] = edges.map((e, i) => {
        const k = i - half;
        return {
          ...e,
          style: {
            shape: {
              pathType: 'smooth',
              waypoints: [{
                x: mx + nx * k * settings.spacing,
                y: my + ny * k * settings.spacing,
              }],
            },
          },
        };
      });

      graph.setData({ nodes, edges: positioned });
    };

    rebuild();

    const gui = new GUI({ title: 'Parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'spacing', 0, 80, 1).onChange(rebuild);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
