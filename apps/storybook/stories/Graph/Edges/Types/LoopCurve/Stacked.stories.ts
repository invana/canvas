import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, WheelZoomBehaviour,
  LOOP_CURVE_PRESETS,
} from '@invana/canvas';
import type { LoopCurvePresetName } from '@invana/canvas';
import {
  DragNodeBehaviour, GraphLayer,
  type EdgeData, type NodeData,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Types/LoopCurve/Stacked' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopCurve/Stacked`.
 *
 * `loop-curve` rendered as **multiple stacked self-edges on the same
 * placement** — the AntV G6 "nested loop" idiom expressed as N edges
 * with `source === target` on a single node. All loops share the **same
 * two foot points** on the silhouette; only the petal's length (`radius`)
 * and belly (`bulge`) grow per ring, so successive loops arch over the
 * previous one without the neck spreading.
 *
 * Why hold `baseOffset` + `width` constant: those two opts control the
 * *foot* placement. Growing them would walk the feet across the
 * silhouette. Growing only `radius` + `bulge` keeps the feet pinned
 * and lifts the arch higher.
 *
 * lil-gui wiring follows the field-resolver pattern: per-edge `data`
 * carries the ring index; the `shape` and `strokeColor` resolvers read
 * `settings` from the closure. Changing `count` syncs the edge set;
 * other knobs just call `rerenderAll`.
 */
export const Stacked: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-curve-stacked' }),

  play: async ({ canvasElement }) => {
    const NODE_W = 80;
    const NODE_H = 30;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;
    const NODE_ID = 'node';

    type Placement =
      | 'top' | 'right' | 'bottom' | 'left'
      | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
    const PLACEMENTS: Record<Placement, { angle: number; dx: number; dy: number }> = {
      'top':          { angle: -Math.PI / 2,    dx:      0, dy: -halfH },
      'right':        { angle:  0,              dx:  halfW, dy:      0 },
      'bottom':       { angle:  Math.PI / 2,    dx:      0, dy:  halfH },
      'left':         { angle:  Math.PI,        dx: -halfW, dy:      0 },
      'top-right':    { angle: -Math.PI / 4,    dx:  halfW, dy: -halfH },
      'bottom-right': { angle:  Math.PI / 4,    dx:  halfW, dy:  halfH },
      'bottom-left':  { angle:  3 * Math.PI / 4, dx: -halfW, dy:  halfH },
      'top-left':     { angle: -3 * Math.PI / 4, dx: -halfW, dy: -halfH },
    };

    const STACK_COLORS = [
      0x2563eb, 0x059669, 0xd97706, 0xdc2626, 0x7c3aed,
      0x0ea5e9, 0x65a30d, 0xea580c, 0xdb2777, 0x6366f1,
    ];

    const settings = {
      preset: 'balloon' as LoopCurvePresetName,
      placement: 'top' as Placement,
      count: 5,
      radiusStep: 22,
      bulgeStep: 14,
    };

    interface EdgeMeta { index: number; }

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-curve-stacked')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'rect', width: NODE_W, height: NODE_H },
            bgFill: 0x4f7ff5, bgStrokeColor: 0x2563eb, bgStrokeWidth: 0,
          },
        },
        edge: {
          style: {
            shape: (edge) => {
              const { index } = edge.data as EdgeMeta;
              const place = PLACEMENTS[settings.placement];
              const base = LOOP_CURVE_PRESETS[settings.preset];
              return {
                pathType: 'loop-curve',
                sourceAnchor: 'center',
                targetAnchor: 'center',
                pathStyleOpts: {
                  angle: place.angle,
                  baseOffset: base.baseOffset,
                  width:      base.width,
                  pivotOffset: { dx: place.dx, dy: place.dy },
                  radius: base.radius + index * settings.radiusStep,
                  bulge:  base.bulge  + index * settings.bulgeStep,
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

    const nodes: NodeData[] = [{ id: NODE_ID, position: { x: 0, y: 0 } }];
    graph.setData({ nodes, edges: [] });
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const MAX = 12;

    const syncEdgeCount = (): void => {
      graph.store.batch(() => {
        for (let i = 0; i < MAX; i++) {
          const id = `loop-${i}`;
          const exists = !!graph.store.getEdge(id);
          if (i < settings.count && !exists) {
            graph.store.addEdge<EdgeMeta>({
              id, source: NODE_ID, target: NODE_ID, data: { index: i },
            } as EdgeData<EdgeMeta>);
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

    const gui = new GUI({ title: 'loop-curve · stacked' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'preset', Object.keys(LOOP_CURVE_PRESETS)).onChange(rerenderAll);
    gui.add(settings, 'placement', Object.keys(PLACEMENTS)).onChange(rerenderAll);
    gui.add(settings, 'count', 1, 10, 1).onChange(syncEdgeCount);
    gui.add(settings, 'radiusStep', 0, 60, 1).name('radiusStep (taller)').onChange(rerenderAll);
    gui.add(settings, 'bulgeStep',  0, 60, 1).name('bulgeStep (wider)').onChange(rerenderAll);
  },
};
