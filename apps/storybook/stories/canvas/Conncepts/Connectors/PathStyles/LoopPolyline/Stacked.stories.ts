import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/LoopPolyline/Stacked' };
export default meta;
type Story = StoryObj;

/**
 * `loop-polyline` rendered as **multiple nested loops on the same
 * placement** — the AntV G6 "nested loop" idiom adapted to orthogonal
 * brackets. Every ring's feet are anchored to the same silhouette edge
 * (matches the `LoopCurve/Stacked` convention); each successive ring
 * arches further out and spreads wider so the stack reads as concentric
 * U-brackets (cardinal) or concentric corner wraps (corner).
 *
 * Per-ring growth — each ring `i` (0-indexed) uses:
 *
 *   baseOffset   = halfW or halfH         (held constant — feet stay on silhouette)
 *   gap_i        = innerGap   + i · gapStep
 *   stubLength_i = innerStub  + i · stubStep
 *
 * Holding `baseOffset` fixed keeps every ring's feet on the host's
 * silhouette; growing `gap` spreads the feet laterally per ring (so the
 * arrowheads don't all collide at the same point); growing `stubLength`
 * lifts the cross further from the silhouette. Picking `gapStep > 0`
 * **and** `stubStep > 0` is what makes ring `i+1` strictly contain ring
 * `i` — both the lateral extent and the outward extent must grow.
 *
 * Works for all eight `side` values:
 *  - **Cardinals** (`top` / `right` / `bottom` / `left`) — single
 *    `baseOffset` (the cardinal-axis half-extent of the rect).
 *  - **Corners** (`top-right` / … / `top-left`) — `baseOffsetX` =
 *    halfW, `baseOffsetY` = halfH; same `gap_i` and `stubLength_i`
 *    growth applies, but `baseOffsetX/Y` stay constant per stack.
 *
 * Single rect host. Per-ring stroke colours so successive rings read
 * as distinct edges (a real graph would let the edge data drive
 * colour).
 */
export const Stacked: Story = {
  render: () => createContainer({ id: 'cvs-prim-loop-polyline-stacked' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-prim-loop-polyline-stacked',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'loop-polyline-stacked', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const LOOP_WIDTH = 1.5;
    const NODE_W = 100;
    const NODE_H = 50;
    const halfW = NODE_W / 2;
    const halfH = NODE_H / 2;

    layer.renderer.addShape('node', {
      kind: 'rect', x: -halfW, y: -halfH, width: NODE_W, height: NODE_H,
      fill: { kind: 'solid', color: 0x4f7ff5 },
      stroke: { color: 0x2563eb, width: 0 }
    });

    type Placement =
      | 'top' | 'right' | 'bottom' | 'left'
      | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
    const PLACEMENTS: ReadonlyArray<Placement> = [
      'top', 'right', 'bottom', 'left',
      'top-right', 'bottom-right', 'bottom-left', 'top-left',
    ];

    // Per-ring stroke colours so each loop reads as a distinct edge.
    const STACK_COLORS = [
      0x2563eb, 0x059669, 0xd97706, 0xdc2626, 0x7c3aed,
      0x0ea5e9, 0x65a30d, 0xea580c, 0xdb2777, 0x6366f1,
    ];

    const isCorner = (p: Placement): boolean => p.includes('-');

    // Cardinal `baseOffset` along the side axis = the rect's half-extent
    // in that direction, so foot endpoints sit on the silhouette.
    const cardinalBaseOffset = (p: Placement): number => {
      const isVertical = p === 'top' || p === 'bottom';
      return isVertical ? halfH : halfW;
    };

    const settings = {
      placement: 'top' as Placement,
      count: 4,
      innerStubLength: 14,
      innerGap: 22,
      stubStep: 14,
      gapStep: 22
    };

    const drawStack = (): void => {
      const MAX = 12;
      for (let i = 0; i < MAX; i++) {
        const id = `loop-${i}`;
        if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
      }

      const corner = isCorner(settings.placement);

      for (let i = 0; i < settings.count; i++) {
        const id = `loop-${i}`;
        const color = STACK_COLORS[i % STACK_COLORS.length]!;
        // Feet pinned to silhouette → baseOffset constant. Outward
        // extent + lateral spread grow per ring.
        const gap = settings.innerGap + i * settings.gapStep;
        const stubLength = settings.innerStubLength + i * settings.stubStep;

        layer.renderer.addConnector(id, {
          kind: 'connector',
          router: 'straight',
          pathStyle: 'loop-polyline',
          pathStyleOpts: corner
            ? {
                side: settings.placement,
                baseOffsetX: halfW,
                baseOffsetY: halfH,
                stubLength,
                gap
              }
            : {
                side: settings.placement,
                baseOffset: cardinalBaseOffset(settings.placement),
                stubLength,
                gap
              },
          source: { kind: 'shape', shapeId: 'node', anchor: 'center' },
          target: { kind: 'shape', shapeId: 'node', anchor: 'center' },
          stroke: { color, width: LOOP_WIDTH },
          targetMarker: arrowMarkerSpec({ lengthScale: 5, widthScale: 4, fill: color })
        });
      }
    };

    drawStack();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'loop-polyline · stacked' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'placement', PLACEMENTS as unknown as string[]).onChange(drawStack);
    gui.add(settings, 'count', 1, 10, 1).onChange(drawStack);
    gui.add(settings, 'innerStubLength', 0, 60, 1).name('innerStubLength').onChange(drawStack);
    gui.add(settings, 'innerGap', 0, 80, 1).name('innerGap').onChange(drawStack);
    gui.add(settings, 'stubStep', 0, 60, 1).name('stubStep (taller)').onChange(drawStack);
    gui.add(settings, 'gapStep', 0, 60, 1).name('gapStep (wider)').onChange(drawStack);
  }
};
