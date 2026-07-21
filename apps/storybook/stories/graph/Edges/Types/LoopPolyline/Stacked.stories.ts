import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas, DragNodeBehaviour, GraphLayer,
  type EdgeData, type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/LoopPolyline/Stacked' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopPolyline/Stacked`.
 *
 * `loop-polyline` rendered as **multiple nested self-edges on the same
 * placement** — orthogonal-bracket analogue of the curve stack. Every
 * ring's feet are anchored to the same silhouette edge; each successive
 * ring arches further out and spreads wider so the stack reads as
 * concentric U-brackets (cardinal) or concentric corner wraps (corner).
 *
 * Per-ring growth — each ring `i` (0-indexed) uses:
 *
 *   baseOffset   = halfW or halfH         (constant — feet stay on silhouette)
 *   gap_i        = innerGap  + i · gapStep
 *   stubLength_i = innerStub + i · stubStep
 *
 * Holding `baseOffset` fixed keeps every ring's feet on the host's
 * silhouette; growing `gap` spreads the feet laterally per ring; growing
 * `stubLength` lifts the cross further from the silhouette.
 *
 * lil-gui wiring: each edge carries its ring `index` and `color` in
 * `data`. The `shape` and `strokeColor` resolvers fire on every render
 * and read `settings` + the per-edge ring index. Changing `count` adds
 * or removes edges (which forces a fitContent rerun); other knobs just
 * call `rerenderAll()`.
 */
export const Stacked: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-polyline-stacked' }),

  play: async ({ canvasElement }) => {
    const NODE_W = 100;
    const NODE_H = 50;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    const NODE_ID = 'node';

    type Placement =
      | 'top' | 'right' | 'bottom' | 'left'
      | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
    const PLACEMENTS: ReadonlyArray<Placement> = [
      'top', 'right', 'bottom', 'left',
      'top-right', 'bottom-right', 'bottom-left', 'top-left',
    ];
    const isCorner = (p: Placement): boolean => p.includes('-');
    const cardinalBaseOffset = (p: Placement): number =>
      (p === 'top' || p === 'bottom') ? halfH : halfW;

    const STACK_COLORS = [
      0x2563eb, 0x059669, 0xd97706, 0xdc2626, 0x7c3aed,
      0x0ea5e9, 0x65a30d, 0xea580c, 0xdb2777, 0x6366f1,
    ];

    const settings = {
      placement: 'top' as Placement,
      count: 4,
      innerStubLength: 14,
      innerGap: 22,
      stubStep: 14,
      gapStep: 22,
    };

    interface EdgeMeta { index: number; }

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-polyline-stacked')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The per-edge `shape` / `strokeColor` resolvers read `settings` from the
    // closure, so they're non-serialisable and stay in the constructor.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes: [{ id: NODE_ID, position: { x: 0, y: 0 } }] as NodeData[], edges: [] },
        edge: {
          style: {
            // Per-edge ring index drives the geometric growth; `settings`
            // is read from the closure.
            shape: (edge) => {
              const { index } = edge.data as EdgeMeta;
              const gap = settings.innerGap + index * settings.gapStep;
              const stubLength = settings.innerStubLength + index * settings.stubStep;
              const corner = isCorner(settings.placement);
              return {
                pathType: 'loop-polyline',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: corner
                  ? {
                      side: settings.placement,
                      baseOffsetX: halfW, baseOffsetY: halfH,
                      stubLength, gap,
                    }
                  : {
                      side: settings.placement,
                      baseOffset: cardinalBaseOffset(settings.placement),
                      stubLength, gap,
                    },
              };
            },
            strokeColor: (edge) => {
              const { index } = edge.data as EdgeMeta;
              return STACK_COLORS[index % STACK_COLORS.length]!;
            },
            strokeWidth: 1.5,
            arrowTargetShape: 'triangle',
          },
        },
      },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'rect', width: NODE_W, height: NODE_H },
              bgFill: 0x4f7ff5, bgStrokeColor: 0x2563eb, bgStrokeWidth: 0,
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const MAX = 12;

    const syncEdgeCount = (): void => {
      graph.store.batch(() => {
        for (let i = 0; i < MAX; i++) {
          const id = `loop-${i}`;
          const exists = !!graph.store.getEdge(id);
          if (i < settings.count && !exists) {
            const e: EdgeData<EdgeMeta> = {
              id, source: NODE_ID, target: NODE_ID, data: { index: i },
            };
            graph.store.addEdge(e);
          } else if (i >= settings.count && exists) {
            graph.store.removeEdge(id);
          }
        }
      });
      canvas.camera.fitContent(graph.getBounds(), 80);
    };

    const rerenderAll = (): void => {
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style: edge.style });
      }
    };

    syncEdgeCount();

    const gui = new GUI({ title: 'loop-polyline · stacked' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'placement', PLACEMENTS as unknown as string[]).onChange(rerenderAll);
    gui.add(settings, 'count', 1, 10, 1).onChange(syncEdgeCount);
    gui.add(settings, 'innerStubLength', 0, 60, 1).name('innerStubLength').onChange(rerenderAll);
    gui.add(settings, 'innerGap', 0, 80, 1).name('innerGap').onChange(rerenderAll);
    gui.add(settings, 'stubStep', 0, 60, 1).name('stubStep (taller)').onChange(rerenderAll);
    gui.add(settings, 'gapStep', 0, 60, 1).name('gapStep (wider)').onChange(rerenderAll);
  },
};
