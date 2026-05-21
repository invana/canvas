import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour, GraphLayer,
  type EdgeData, type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Types/LoopPolyline/Overview' };
export default meta;
type Story = StoryObj;

/**
 * Graph-side counterpart to
 * `Canvas/Connectors/PathStyles/LoopPolyline/Overview`.
 *
 * `pathType: 'loop-polyline'` in a `GraphLayer` self-loop draws an
 * orthogonal polyline anchored at the host node's centre. Two
 * geometries dispatch on `side`:
 *
 *  - **Cardinal U-bracket** (`top` / `right` / `bottom` / `left`) —
 *    three segments. Feet on a chord perpendicular to `side`, stubs
 *    straight out along `side`, one cross segment.
 *  - **Corner wrap** (`top-right` / `bottom-right` / `bottom-left` /
 *    `top-left`) — four segments. Both feet land on the host
 *    silhouette (one on the horizontal edge, one on the vertical edge);
 *    perpendicular stubs out, cross past the corner, and a final stub
 *    drops back onto the vertical edge so the arrow marker lands flush
 *    with the host.
 *
 * Two host nodes, both showing all eight placements:
 *  - **Left** — rect host. Cardinals use `baseOffset = max(halfW, halfH)`
 *    per axis; corners use `baseOffsetX / baseOffsetY` set to the rect's
 *    half-extents so each wrap lands precisely on its named corner.
 *  - **Right** — circle host. Symmetric, so a single `baseOffset` (per
 *    side family) clears every direction.
 *
 * Drag either node to confirm every loop tracks it.
 */
export const Overview: Story = {
  render: () => createContainer({ id: 'graph-edge-loop-polyline-overview' }),

  play: async ({ canvasElement }) => {
    const RECT_W = 80, RECT_H = 50;
    const RECT_HX = RECT_W / 2, RECT_HY = RECT_H / 2;
    const CIRC_R = 36;

    const CARDINALS = ['top', 'right', 'bottom', 'left'] as const;
    const CORNERS   = ['top-right', 'bottom-right', 'bottom-left', 'top-left'] as const;

    // Circle: foot at (±gap/2, ∓baseOffset) on the silhouette →
    // baseOffset = √(r² − (gap/2)²).
    const CIRC_GAP = 18;
    const CIRC_CARDINAL_BASE = Math.sqrt(CIRC_R * CIRC_R - (CIRC_GAP / 2) ** 2);
    // Corner wrap: solve (x − gap)² + y² = r² with x = y →
    // baseOffsetX = baseOffsetY = (gap + √(2r² − gap²)) / 2.
    const CORNER_GAP = 14;
    const CIRC_CORNER_BASE =
      (CORNER_GAP + Math.sqrt(2 * CIRC_R * CIRC_R - CORNER_GAP * CORNER_GAP)) / 2;

    const nodes: NodeData[] = [
      { id: 'rect-host', position: { x: -260, y: 0 },
        style: { shape: { kind: 'rect', width: RECT_W, height: RECT_H } } },
      { id: 'circ-host', position: { x:  200, y: 0 },
        style: { shape: { kind: 'circle', radius: CIRC_R } } },
    ];

    const edges: EdgeData[] = [];
    // Rect cardinals — baseOffset along the side axis = the rect's
    // half-extent in that direction so the feet sit on the silhouette.
    for (const side of CARDINALS) {
      const isVertical = side === 'top' || side === 'bottom';
      edges.push({
        id: `rect-${side}`, source: 'rect-host', target: 'rect-host',
        style: {
          shape: {
            pathType: 'loop-polyline',
            sourceAnchor: 'center',
            targetAnchor: 'center',
            pathStyleOpts: {
              side,
              baseOffset: isVertical ? RECT_HY : RECT_HX,
              stubLength: 18, gap: 22,
            },
          },
        },
      });
    }
    // Rect corners — baseOffsetX / baseOffsetY pin the wrap's inner
    // corner to the rect's actual corner.
    for (const side of CORNERS) {
      edges.push({
        id: `rect-${side}`, source: 'rect-host', target: 'rect-host',
        style: {
          shape: {
            pathType: 'loop-polyline',
            sourceAnchor: 'center',
            targetAnchor: 'center',
            pathStyleOpts: {
              side, baseOffsetX: RECT_HX, baseOffsetY: RECT_HY,
              stubLength: 14, gap: 14,
            },
          },
        },
      });
    }
    // Circle cardinals.
    for (const side of CARDINALS) {
      edges.push({
        id: `circ-${side}`, source: 'circ-host', target: 'circ-host',
        style: {
          shape: {
            pathType: 'loop-polyline',
            sourceAnchor: 'center',
            targetAnchor: 'center',
            pathStyleOpts: {
              side, baseOffset: CIRC_CARDINAL_BASE,
              stubLength: 16, gap: CIRC_GAP,
            },
          },
        },
      });
    }
    // Circle corners.
    for (const side of CORNERS) {
      edges.push({
        id: `circ-${side}`, source: 'circ-host', target: 'circ-host',
        style: {
          shape: {
            pathType: 'loop-polyline',
            sourceAnchor: 'center',
            targetAnchor: 'center',
            pathStyleOpts: {
              side,
              baseOffsetX: CIRC_CORNER_BASE,
              baseOffsetY: CIRC_CORNER_BASE,
              stubLength: 14, gap: CORNER_GAP,
            },
          },
        },
      });
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-loop-polyline-overview')!;
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
            bgFill: 0x4f7ff5, bgStrokeColor: 0x2563eb, bgStrokeWidth: 0,
          },
        },
        edge: {
          style: {
            strokeColor: 0x94a3b8, strokeWidth: 1.5,
            arrowTargetShape: 'triangle',
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
