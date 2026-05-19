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

const meta: Meta = { title: 'Graph/Edges/Parallel/Orth' };
export default meta;
type Story = StoryObj;

/**
 * `count` parallel `orth` edges between two nodes. Router `orth` +
 * pathStyle `normal` — only horizontal / vertical segments, 2-corner
 * Z-route per edge.
 *
 * Each parallel edge gets its own perimeter anchor via the engine's
 * `silhouette-port` anchor with `{ side, offset: k × spacing }`. The
 * anchor walks each shape's analytical silhouette via `boundaryIntersect`
 * so endpoints land flush on `rect`, `circle`, `pill`, and `ellipse`
 * alike — `silhouette-port` is the silhouette-aware sibling of
 * `edge-port` (which only works on AABB faces).
 *
 * The single per-edge waypoint sits at `(midX + k × spacing, midY)` for
 * horizontal-dominant layouts (mirror for vertical-dominant). Pinning the
 * non-bend axis to the centres' midpoint guarantees `wp` is always
 * between the source and target silhouette exits, so orth's pair-1 and
 * pair-2 L-bends go toward tgt with no direction reversal — no
 * "up-then-back" overshoot for shapes where the silhouette exit
 * compresses the offset (circles, ellipses).
 *
 * `nodeKind` swaps the shape between `circle` / `rect` / `pill` /
 * `ellipse`; `count` adds / removes parallel edges incrementally. Both
 * GUI knobs mutate the store via `updateNode` / `addEdge` / `removeEdge`
 * rather than re-running `setData`, because `GraphStore.clear()` is
 * silent — `setData` after the initial seed would leave the renderer's
 * old `RectShape` instance alive across a `circle` swap.
 */
export const Orth: Story = {
  render: () => createContainer({ id: 'graph-parallel-orth' }),

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

    const settings = { nodeKind: 'rect', count: 7, spacing: 11 };
    const COUNT_MAX = 15;

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-parallel-orth')!;
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
      for (let i = 0; i < settings.count; i++) {
        const k = i - half;
        const off = k * settings.spacing;
        const wp = horizontal
          ? { x: midX + off, y: midY }
          : { x: midX,       y: midY + off };
        graph.store.updateEdge(`e${i}`, {
          style: {
            shape: {
              pathType: 'orth',
              sourceAnchor: 'silhouette-port',
              sourceAnchorOpts: { side: srcSide, offset: off },
              targetAnchor: 'silhouette-port',
              targetAnchorOpts: { side: tgtSide, offset: off },
              waypoints: [wp],
            },
          },
        });
      }
    };

    // Initial one-time seed via `setData`. Subsequent GUI changes mutate
    // the store directly to dodge the silent-`clear()` trap.
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

    // `updateNode` fires `node:update`, which routes to
    // `GraphLayer.updateNodeShape`. That handler detects the kind change
    // (`currentKind !== spec.kind`) and does `removeShape` + `addShape`
    // on the renderer — the only path that actually swaps the rendered
    // shape instance.
    const applyShape = () => {
      const shape = SHAPES[settings.nodeKind];
      for (const n of nodes) {
        graph.store.updateNode(n.id, { style: { ...n.style, shape } });
      }
    };

    // Diff the desired edge id set against the store; add missing,
    // remove extras. `node:update` listener re-patches waypoints for
    // every visible edge after each store mutation.
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

    const gui = new GUI({ title: 'Orth · parallel edges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeKind', Object.keys(SHAPES)).onChange(applyShape);
    gui.add(settings, 'count', 1, COUNT_MAX, 1).onChange(applyCount);
    gui.add(settings, 'spacing', 0, 18, 1).onChange(patchAllEdges);

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
