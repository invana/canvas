import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeAnchor,
  type EdgeData,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Parallel/Rounded' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel axis-aligned edges with rounded corner fillets between
 * two rect nodes. `pathStyle` `rounded` accepts a `radius` opt that controls
 * the fillet size at each bend.
 *
 * `ParallelEdgeBehaviour` distributes the ranks and writes the midpoint
 * waypoint per edge; the corner-fillet rendering is purely a pathStyle
 * concern and lives in the connector pipeline. Tweak `radius` to see only
 * the corners change without re-distributing the bundle.
 */
export const Rounded: Story = {
  render: () => createContainer({ id: 'graph-parallel-rounded' }),

  play: async ({ canvasElement }) => {
    const SHAPES: Record<string, NodeShapeOptions> = {
      rect:    { kind: 'rect', width: 80, height: 80 },
      circle:  { kind: 'circle', radius: 40 },
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
      spacing: 14,
      radius: 14,
    };

    const nodeStyle = () => ({ bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: SHAPES[settings.nodeKind]! });
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y: -160 }, style: nodeStyle() },
      { id: 'b', position: { x:  240, y:  160 }, style: nodeStyle() },
    ];

    const edgeStyle = (): EdgeData['style'] => ({
      shape: {
        pathType: 'rounded',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
        pathStyleOpts: { radius: settings.radius },
      },
    });

    const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle(),
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-rounded')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { edge: { style: { strokeColor: 0x64748b, strokeWidth: 2, strokeCap: 'round' } } },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    const parallel = new ParallelEdgeBehaviour({
      id: 'parallel-edges',
      layerId: 'graph',
      enabled: true,
      spacing: settings.spacing,
    });
    canvas.behaviours.register(parallel);
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }));

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

    const gui = new GUI({ title: 'Parallel · rounded' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 30, 1).onChange((v: number) => parallel.setOptions({ spacing: v }));
    gui.add(settings, 'radius', 0, 40, 1).onChange(applyEdgeStyle);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
