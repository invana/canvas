import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ParallelEdgeBehaviour,
  type EdgeAnchor,
  type EdgeData,
  type EdgePathType,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/ParallelEdges/ParallelEdge' };
export default meta;
type Story = StoryObj;

/**
 * `ParallelEdgeBehaviour` — `N` edges that share the same `(source, target)`
 * pair stack on top of each other unless something fans them out. This
 * behaviour groups parallel edges and writes one midpoint waypoint plus
 * port-anchor offsets per edge so the bundle fans symmetrically around
 * rank zero.
 *
 * The story registers the behaviour once and lets the GUI tweak its inputs:
 *
 *  - **`pathType`** — drives both the visual style and the bow axis. Axis-
 *    aligned routers (`manhattan` / `orth` / `rounded`) bow along the
 *    non-dominant axis; curve-through-control-point styles (`straight` /
 *    `smooth` / `bundle`) bow perpendicular to the chord. The behaviour's
 *    `basis: 'auto'` derives this per edge.
 *  - **`anchor`** — port anchors (`silhouette-port` / `edge-port`) fan the
 *    *endpoints* along the host's face via `{ side: 'auto', offset }`;
 *    `boundary` / `center` only fan the midpoint waypoint.
 *  - **`count`** / **`spacing`** — group size and rank step.
 *
 * Drag node `a` or `b` to confirm the behaviour re-fans live as endpoints
 * move.
 */
export const ParallelEdge: Story = {
  render: () => createContainer({ id: 'graph-behaviour-parallel-edge' }),

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

    const PATH_TYPES: readonly EdgePathType[] = [
      'manhattan',
      'orth',
      'rounded',
      'straight',
      'smooth',
      'bundle',
    ];

    const ANCHORS: readonly EdgeAnchor[] = [
      'silhouette-port',
      'edge-port',
      'boundary',
      'center',
    ];

    const COUNT_MAX = 15;

    const settings = {
      nodeKind: 'rect',
      pathType: 'manhattan' as EdgePathType,
      anchor: 'silhouette-port' as EdgeAnchor,
      count: 7,
      spacing: 12,
      radius: 14,
      beta: 0.85,
    };

    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y: -160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
      { id: 'b', position: { x:  240, y:  160 }, style: { bgFill: 0x64748b, bgStrokeColor: 0x334155 } },
    ];

    // Per-edge style: only the structural shape fields the behaviour cares
    // about reading (pathType, sourceAnchor, targetAnchor, pathStyleOpts).
    // The behaviour adds `waypoints` + anchor offsets on top — those stay
    // out of the seed so the data shape reads cleanly.
    const edgeStyleForCurrentSettings = (): EdgeData['style'] => ({
      shape: {
        pathType: settings.pathType,
        sourceAnchor: settings.anchor,
        targetAnchor: settings.anchor,
        pathStyleOpts:
          settings.pathType === 'rounded'
            ? { radius: settings.radius }
            : settings.pathType === 'bundle'
              ? { beta: settings.beta }
              : undefined,
      },
    });

    // Build the initial content (data is content, not config): seed the
    // chosen node shape and `count` parallel edges into `initData`.
    const initShape = SHAPES[settings.nodeKind]!;
    const initNodes: NodeData[] = nodes.map((n) => ({
      ...n,
      style: { ...n.style, shape: initShape },
    }));
    const initEdgeStyle = edgeStyleForCurrentSettings();
    const initEdges: EdgeData[] = Array.from({ length: settings.count }, (_, i) => ({
      id: `e${i}`,
      source: 'a',
      target: 'b',
      style: initEdgeStyle,
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-behaviour-parallel-edge')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes: initNodes, edges: initEdges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const parallel = new ParallelEdgeBehaviour({ id: 'parallel-edges', targetLayerId: 'graph' });
    canvas.behaviours.register(parallel);

    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          edge: { style: { strokeColor: 0x64748b, strokeWidth: 2, strokeCap: 'round' } },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'parallel-edges': {
          enabled: true,
          spacing: settings.spacing,
          basis: 'auto',
          anchorOffset: true,
        },
        'drag-node': { enabled: true },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const applyShape = () => {
      const shape = SHAPES[settings.nodeKind]!;
      for (const n of nodes) {
        const node = graph.store.getNode(n.id);
        if (!node) continue;
        const prior = (node.style as Record<string, unknown> | undefined) ?? {};
        graph.store.updateNode(n.id, { style: { ...prior, shape } });
      }
    };

    // Re-stamp every edge's structural shape (pathType / anchor /
    // pathStyleOpts) when the GUI changes any of those. The behaviour
    // preserves the new values when it next writes `waypoints` /
    // `*AnchorOpts` because it spreads the prior `style.shape` before
    // overlaying.
    const applyEdgeStyle = () => {
      const style = edgeStyleForCurrentSettings();
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style });
      }
      parallel.recompute();
    };

    const applyCount = () => {
      const style = edgeStyleForCurrentSettings();
      for (let i = 0; i < settings.count; i++) {
        if (!graph.store.getEdge(`e${i}`)) {
          graph.store.addEdge({ id: `e${i}`, source: 'a', target: 'b', style });
        }
      }
      for (let i = settings.count; i <= COUNT_MAX; i++) {
        if (graph.store.getEdge(`e${i}`)) {
          graph.store.removeEdge(`e${i}`);
        }
      }
    };

    const gui = new GUI({ title: 'Parallel edges (behaviour)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'pathType', [...PATH_TYPES]).onChange(applyEdgeStyle);
    gui.add(settings, 'anchor', [...ANCHORS]).onChange(applyEdgeStyle);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 30, 1).onChange((v: number) => {
      canvas.update({ behaviours: { 'parallel-edges': { spacing: v } } });
    });
    gui.add(settings, 'radius', 0, 40, 1).onChange(applyEdgeStyle);
    gui.add(settings, 'beta', 0, 1, 0.01).onChange(applyEdgeStyle);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
