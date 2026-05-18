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

const meta: Meta = { title: 'Graph/Edges/Parallel/Rounded' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `rounded` edges between two nodes. Router `orth` +
 * pathStyle `rounded` — H/V segments with a quadratic fillet at every
 * corner (`radius` is the fillet length along each incoming segment).
 *
 * Waypoint scheme auto-switches per layout (same logic as `Parallel/Orth`):
 *
 *  - **Diagonal endpoints** → 1 waypoint, 2-corner Z per edge.
 *  - **Near-collinear endpoints** → 2 waypoints at 25 % / 75 %, 4-corner
 *    train-tracks with a parallel lane.
 *
 * Drag the nodes to swap layouts; tweak `radius` to soften the corners.
 */
export const Rounded: Story = {
  render: () => createContainer({ id: 'graph-parallel-rounded' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -260, y: -180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
      { id: 'b', position: { x:  260, y:  180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
    ];

    const settings = { count: 7, spacing: 20, radius: 12 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-rounded')!;
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
      const fanHalfWidth = half * settings.spacing;
      const useLane = Math.min(Math.abs(dx), Math.abs(dy)) < fanHalfWidth;
      for (let i = 0; i < settings.count; i++) {
        const k = i - half;
        const offX = nx * k * settings.spacing;
        const offY = ny * k * settings.spacing;
        const waypoints = useLane
          ? [
              { x: src.x + dx * 0.25 + offX, y: src.y + dy * 0.25 + offY },
              { x: src.x + dx * 0.75 + offX, y: src.y + dy * 0.75 + offY },
            ]
          : [
              { x: src.x + dx * 0.5 + offX, y: src.y + dy * 0.5 + offY },
            ];
        graph.store.updateEdge(`e${i}`, {
          style: {
            shape: {
              pathType: 'rounded',
              pathStyleOpts: { radius: settings.radius },
              waypoints,
            },
          },
        });
      }
    };

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

    const gui = new GUI({ title: 'Rounded · parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'count', 1, 15, 1).onChange(reseed);
    gui.add(settings, 'spacing', 0, 60, 1).onChange(patchAllEdges);
    gui.add(settings, 'radius', 0, 40, 1).onChange(patchAllEdges);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
