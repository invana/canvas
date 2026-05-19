import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeAnchor,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Parallel/Straight' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `straight`-routed edges between two circle nodes. With
 * the perpendicular midpoint waypoint the behaviour writes per edge, each
 * `straight` route becomes a two-segment polyline bowed outward by
 * `rank × spacing` — the bundle visually resembles a leaf with the chord
 * as its midrib.
 *
 * `boundary` is the natural anchor for `straight` so endpoints sit on each
 * circle's silhouette regardless of fan width; switch to a port anchor to
 * see endpoints fan along the host face instead.
 */
export const Straight: Story = {
  render: () => createContainer({ id: 'graph-parallel-straight' }),

  play: async ({ canvasElement }) => {
    const ANCHORS: readonly EdgeAnchor[] = [
      'boundary',
      'silhouette-port',
      'edge-port',
      'center',
    ];
    const COUNT_MAX = 15;
    const settings = {
      anchor: 'boundary' as EdgeAnchor,
      count: 7,
      spacing: 22,
    };

    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y: -160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'circle', radius: 30 } } },
      { id: 'b', position: { x:  240, y:  160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'circle', radius: 30 } } },
    ];

    const edgeStyle = (): EdgeData['style'] => ({
      shape: {
        pathType: 'straight',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
      },
    });

    const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle(),
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-straight')!;
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

    const gui = new GUI({ title: 'Parallel · straight' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 60, 1).onChange((v: number) => parallel.setOptions({ spacing: v }));

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
