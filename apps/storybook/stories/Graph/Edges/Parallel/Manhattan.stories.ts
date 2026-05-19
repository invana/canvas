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

const meta: Meta = { title: 'Graph/Edges/Parallel/Manhattan' };
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
    const ANCHORS: readonly EdgeAnchor[] = [
      'silhouette-port',
      'edge-port',
      'boundary',
      'center',
    ];
    const COUNT_MAX = 15;
    const settings = {
      anchor: 'silhouette-port' as EdgeAnchor,
      count: 7,
      spacing: 12,
    };

    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y: -160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'rect', width: 80, height: 80 } } },
      { id: 'b', position: { x:  240, y:  160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155, shape: { kind: 'rect', width: 80, height: 80 } } },
    ];

    const edgeStyle = (): EdgeData['style'] => ({
      shape: {
        pathType: 'manhattan',
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
      },
    });

    const edges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
      id: `e${i}`, source: 'a', target: 'b', style: edgeStyle(),
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-manhattan')!;
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

    const gui = new GUI({ title: 'Parallel · manhattan' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 30, 1).onChange((v: number) => parallel.setOptions({ spacing: v }));

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
