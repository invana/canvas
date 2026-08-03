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
  type NodeShapeOptions,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Parallel/Bundle' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `bundle`-routed edges between two circle nodes.
 * `bundle` is d3-shape's `curveBundle` — a B-spline whose `beta` parameter
 * controls how tightly each curve pulls toward the straight chord between
 * its endpoints. `beta = 1` lets the perpendicular midpoint waypoint
 * dominate (max bow), `beta = 0` collapses every curve onto the chord
 * (the bundle disappears).
 *
 * `ParallelEdgeBehaviour` writes the bow waypoints; `beta` is a pure
 * pathStyle parameter and is re-stamped on every edge when the slider
 * moves.
 */
export const Bundle: Story = {
  render: () => createContainer({ id: 'graph-parallel-bundle' }),

  play: async ({ canvasElement }) => {
    const SHAPES: Record<string, NodeShapeOptions> = {
      circle:  { kind: 'circle', radius: 40 },
      rect:    { kind: 'rect', width: 80, height: 80 },
      pill:    { kind: 'rect', width: 100, height: 50, cornerRadius: 25 },
      ellipse: {
        kind: 'polygon',
        vertices: Array.from({ length: 32 }, (_, i) => ({
          x: Math.cos((i / 32) * Math.PI * 2) * 50,
          y: Math.sin((i / 32) * Math.PI * 2) * 30,
        })),
      },
    };
    const ANCHORS: readonly EdgeAnchor[] = [
      'boundary',
      'silhouette-port',
      'edge-port',
      'center',
    ];
    const COUNT_MAX = 15;
    const settings = {
      nodeKind: 'circle',
      anchor: 'boundary' as EdgeAnchor,
      count: 7,
      spacing: 22,
      beta: 0.85,
    };

    const nodeStyle = () => ({ bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: SHAPES[settings.nodeKind]! });
    const nodes: GraphNode[] = [
      { type: 'node', id: 'a', position: { x: -240, y: -160 }, style: nodeStyle() },
      { type: 'node', id: 'b', position: { x:  240, y:  160 }, style: nodeStyle() },
    ];

    const edgeStyle = (): GraphEdge['style'] => ({
      shape: {
        pathType: 'bundle',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
        pathStyleOpts: { beta: settings.beta },
      },
    });

    const edges: GraphEdge[] = Array.from({ length: settings.count }, (_, i) => ({ type: 'edge',
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle(),
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-bundle')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Seed nodes/edges as content via initData; the per-edge bundle style
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
        'drag-node': { enabled: true },
      },
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

    const gui = new GUI({ title: 'Parallel · bundle' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 60, 1).onChange((v: number) => canvas.update({ behaviours: { 'parallel-edges': { spacing: v } } }));
    gui.add(settings, 'beta', 0, 1, 0.01).onChange(applyEdgeStyle);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
