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

const meta: Meta = { title: 'Graph/Edges/Parallel/Manhattan' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `manhattan` edges between two nodes. Router
 * `manhattan` (obstacle-aware A* on top of orth) + pathStyle `normal`.
 * With no obstacles in the way the routes look identical to `orth`;
 * the variant lives here so the comparison is one click away.
 *
 * Same per-edge `silhouette-port` anchor + midpoint-pinned waypoint
 * scheme as `Parallel/Orth`. See that story's header for the rationale.
 */
export const Manhattan: Story = {
  render: () => createContainer({ id: 'graph-parallel-manhattan' }),

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

    const settings = { nodeKind: 'rect', anchor: 'silhouette-port', count: 7, spacing: 11 };
    const ANCHORS = ['silhouette-port', 'edge-port', 'boundary', 'center'];
    const COUNT_MAX = 15;

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-manhattan')!;
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

    const patchAllEdges = () => {
      const src = graph.store.getPosition('a');
      const tgt = graph.store.getPosition('b');
      if (!src || !tgt) return;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const horizontal = Math.abs(dx) >= Math.abs(dy);
      const srcSide = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
      const tgtSide = horizontal ? (dx > 0 ? 'left' : 'right') : (dy > 0 ? 'top' : 'bottom');
      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2;
      const half = (settings.count - 1) / 2;
      const isPort = settings.anchor === 'silhouette-port' || settings.anchor === 'edge-port';
      for (let i = 0; i < settings.count; i++) {
        const k = i - half;
        const off = k * settings.spacing;
        const wp = horizontal
          ? { x: midX + off, y: midY }
          : { x: midX,       y: midY + off };
        const portOpts = isPort
          ? {
              sourceAnchorOpts: { side: srcSide, offset: off },
              targetAnchorOpts: { side: tgtSide, offset: off },
            }
          : {};
        graph.store.updateEdge(`e${i}`, {
          style: {
            shape: {
              pathType: 'manhattan',
              sourceAnchor: settings.anchor,
              targetAnchor: settings.anchor,
              ...portOpts,
              waypoints: [wp],
            },
          },
        });
      }
    };

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

    const gui = new GUI({ title: 'Manhattan · parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'anchor', ANCHORS).onChange(patchAllEdges);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 18, 1).onChange(patchAllEdges);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
