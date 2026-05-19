import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
  type NodeShapeOptions,
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
 * `nodeKind` swaps the source / target shape between `circle`, `rect`,
 * `pill`, and `ellipse`. Straight uses the default `boundary` anchor,
 * which trims at the actual silhouette of any shape — so endpoints stay
 * glued to the node regardless of kind.
 */
export const Straight: Story = {
  render: () => createContainer({ id: 'graph-parallel-straight' }),

  play: async ({ canvasElement }) => {
    const SHAPES: Record<string, NodeShapeOptions> = {
      circle: { kind: 'circle', radius: 40 },
      rect: { kind: 'rect', width: 80, height: 80 },
      pill: { kind: 'rect', width: 100, height: 50, cornerRadius: 25 },
      ellipse: {
        kind: 'polygon',
        vertices: Array.from({ length: 32 }, (_, i) => ({
          x: Math.cos((i / 32) * Math.PI * 2) * 50,
          y: Math.sin((i / 32) * Math.PI * 2) * 30,
        })),
      },
    };

    const nodes: NodeData[] = [
      { id: 'a', position: { x: -260, y: -180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
      { id: 'b', position: { x:  260, y:  180 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
    ];

    const settings = { nodeKind: 'circle', count: 7, spacing: 26 };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-straight')!;
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

    const centerOf = (pos: { x: number; y: number }) => {
      const s = SHAPES[settings.nodeKind] as { kind: string; width?: number; height?: number };
      if (s.kind === 'rect' && s.width !== undefined && s.height !== undefined) {
        return { x: pos.x + s.width / 2, y: pos.y + s.height / 2 };
      }
      return { x: pos.x, y: pos.y };
    };

    const patchAllEdges = () => {
      const srcPos = graph.store.getPosition('a');
      const tgtPos = graph.store.getPosition('b');
      if (!srcPos || !tgtPos) return;
      const src = centerOf(srcPos);
      const tgt = centerOf(tgtPos);
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

    const COUNT_MAX = 15;

    // Initial one-time seed via `setData`. Subsequent GUI changes mutate
    // the store directly — `GraphStore.clear()` is silent, so re-running
    // `setData` after the first time would leave the renderer's old
    // shape instance alive across a `nodeKind` swap.
    const initialSeed = () => {
      const shape = SHAPES[settings.nodeKind];
      const liveNodes: NodeData[] = nodes.map((n) => ({
        ...n,
        style: { ...n.style, shape },
      }));
      const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
        id: `e${i}`, source: 'a', target: 'b',
      }));
      graph.setData({ nodes: liveNodes, edges });
      patchAllEdges();
    };

    const applyShape = () => {
      const shape = SHAPES[settings.nodeKind];
      for (const n of nodes) {
        graph.store.updateNode(n.id, { style: { ...n.style, shape } });
      }
    };

    const applyCount = () => {
      const desired = settings.count;
      for (let i = 0; i < desired; i++) {
        if (!graph.store.getEdge(`e${i}`)) {
          graph.store.addEdge({ id: `e${i}`, source: 'a', target: 'b' });
        }
      }
      for (let i = desired; i <= COUNT_MAX; i++) {
        if (graph.store.getEdge(`e${i}`)) {
          graph.store.removeEdge(`e${i}`);
        }
      }
      patchAllEdges();
    };

    initialSeed();

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    graph.store.events.on('node:update', () => patchAllEdges());

    const gui = new GUI({ title: 'Straight · parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 80, 1).onChange(patchAllEdges);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
