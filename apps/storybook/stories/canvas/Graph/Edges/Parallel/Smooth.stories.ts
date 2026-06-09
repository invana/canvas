import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeAnchor,
  type EdgeData,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Parallel/Smooth' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `smooth`-routed edges between two circle nodes. The
 * `smooth` pathStyle is a Catmull-Rom spline through every input point, so
 * the single perpendicular midpoint waypoint the behaviour writes pulls
 * each edge into a clean arc. The bundle visually resembles a leaf with
 * the chord as its midrib.
 *
 * Replaces the previous top-level `Graph/Edges/ParallelEdges` story —
 * same scene, now sitting alongside the other per-pathType variants. All
 * bundling logic lives in `ParallelEdgeBehaviour`; this story is the
 * minimum amount of code needed to seed the demo.
 */
export const Smooth: Story = {
  render: () => createContainer({ id: 'graph-parallel-smooth' }),

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
      spacing: 26,
    };

    const nodeStyle = () => ({ bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: SHAPES[settings.nodeKind]! });
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -260, y: -180 }, style: nodeStyle() },
      { id: 'b', position: { x:  260, y:  180 }, style: nodeStyle() },
    ];

    const edgeStyle = (): EdgeData['style'] => ({
      shape: {
        pathType: 'smooth',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
      },
    });

    const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle(),
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-smooth')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const parallel = new ParallelEdgeBehaviour({ id: 'parallel-edges', targetLayerId: 'graph' });
    canvas.behaviours.register(parallel);
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: { edge: { style: { strokeColor: 0x64748b, strokeWidth: 2, strokeCap: 'round' } } },
      },
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
          graph.store.addEdge({ id: `e${i}`, source: 'a', target: 'b', style });
        }
      }
      for (let i = settings.count; i <= COUNT_MAX; i++) {
        if (graph.store.getEdge(`e${i}`)) graph.store.removeEdge(`e${i}`);
      }
    };

    const gui = new GUI({ title: 'Parallel · smooth' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 80, 1).onChange((v: number) => canvas.update({ behaviours: { 'parallel-edges': { spacing: v } } }));

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
