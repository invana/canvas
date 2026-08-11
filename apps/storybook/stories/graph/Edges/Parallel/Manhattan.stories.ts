import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeAnchor,
  type GraphEdge,
  type GraphNode,
  type NodeShapeOptions
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Parallel/Manhattan' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `manhattan`-routed edges between two rect nodes.
 *
 * The story is a thin demo around `ParallelEdgeBehaviour`: it seeds the
 * data and registers the behaviour, then leaves bundling — rank
 * distribution, side derivation, waypoint placement — entirely to the
 * behaviour. Compare this file with its history before May 2026 (a 160-line
 * file containing a `patchAllEdges` helper that derived `srcSide` /
 * `tgtSide`, computed centered ranks, and patched each edge by hand) to
 * see what the behaviour absorbed.
 *
 * Drag node `a` or `b` to confirm the fan re-balances live as endpoints
 * move (the behaviour listens to `node:update`).
 */
export const Manhattan: Story = {
  render: () => createContainer({ id: 'graph-parallel-manhattan' }),

  play: async ({ canvasElement }) => {
    const SHAPES: Record<string, NodeShapeOptions> = {
      rect:    { kind: 'rect', width: 80, height: 80 },
      circle:  { kind: 'circle', radius: 40 },
      pill:    { kind: 'rect', width: 100, height: 50, cornerRadius: 25 },
      ellipse: {
        kind: 'polygon',
        vertices: Array.from({ length: 32 }, (_, i) => ({
          x: Math.cos((i / 32) * Math.PI * 2) * 50,
          y: Math.sin((i / 32) * Math.PI * 2) * 30
        }))
      }
    };
    const ANCHORS: readonly EdgeAnchor[] = [
      'silhouette-port',
      'edge-port',
      'boundary',
      'center',
    ];
    const COUNT_MAX = 15;
    const settings = {
      nodeKind: 'rect',
      anchor: 'silhouette-port' as EdgeAnchor,
      count: 7,
      spacing: 12
    };

    const nodeStyle = () => ({ bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: SHAPES[settings.nodeKind]! });
    const nodes: GraphNode[] = [
      { type: 'node', id: 'a', position: { x: -240, y: -160 }, style: nodeStyle() },
      { type: 'node', id: 'b', position: { x:  240, y:  160 }, style: nodeStyle() },
    ];

    const edgeStyle = (): GraphEdge['style'] => ({
      shape: {
        pathType: 'manhattan',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor
      }
    });

    const edges: GraphEdge[] = Array.from({ length: settings.count }, (_, i) => ({ type: 'edge',
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle()
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-manhattan')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Seed nodes/edges as content via initData; the per-edge manhattan style
    // rides on the data, the literal stroke template lives in config below.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    const parallel = new ParallelEdgeBehaviour({ id: 'parallel-edges', targetLayerId: 'graph' });
    canvas.behaviours.register(parallel);
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: { graph: { edge: { style: { strokeColor: 0x64748b, strokeWidth: 2, strokeCap: 'round' } } } },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'parallel-edges': { enabled: true, spacing: settings.spacing },
        'drag-node': { enabled: true }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const applyShape = () => {
      const style = nodeStyle();
      for (const n of graph.store.nodes()) graph.store.updateNode(n.id, { style });
      parallel.recompute();
    };
    const applyEdgeStyle = () => {
      const style = edgeStyle();
      for (const e of graph.store.edges()) graph.store.updateEdge(e.id, { style });
      parallel.recompute();
    };
    const applyCount = () => {
      const style = edgeStyle();
      for (let i = 0; i < settings.count; i++) {
        if (!graph.store.getEdge(`e${i}`)) {
          graph.store.addEdge({ type: 'edge', id: `e${i}`, source: 'a', target: 'b', style });
        }
      }
      for (let i = settings.count; i <= COUNT_MAX; i++) {
        if (graph.store.getEdge(`e${i}`)) graph.store.removeEdge(`e${i}`);
      }
    };

    const gui = new GUI({ title: 'Parallel · manhattan' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 30, 1).onChange((v: number) => canvas.update({ behaviours: { 'parallel-edges': { spacing: v } } }));

    canvas.camera.fitContent(graph.getBounds(), 100);
  }
};
