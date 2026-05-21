import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Types/PolylineWithControlPoints' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'straight'` paired with explicit `waypoints` — a multi-segment
 * polyline that bends through each control point. The `straight` router
 * passes waypoints through unaltered (`[source, ...waypoints, target]`) and
 * the `normal` pathStyle walks the polyline with `M, L, L, …`, so each
 * waypoint becomes a literal vertex on the rendered edge.
 *
 * Endpoints sit far apart with a single mid-waypoint that bumps the line
 * off the source→target chord — the bend reads clearly even at story
 * thumbnail size. Drag either endpoint to confirm the waypoint stays fixed
 * in world space while the legs re-route.
 */
export const PolylineWithControlPoints: Story = {
  render: () => createContainer({ id: 'graph-edge-types-polyline-cp' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y:  80 },
        style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'a', labelPlacement: 'bottom' } },
      { id: 'b', position: { x:  240, y: -80 },
        style: { bgFill: 0x10b981, bgStrokeColor: 0x047857, labelText: 'b', labelPlacement: 'top' } },
    ];

    const edges: EdgeData[] = [
      {
        id: 'polyline',
        source: 'a',
        target: 'b',
        style: {
          shape: {
            pathType: 'straight',
            // Two literal control points bend the chord into a 3-segment
            // polyline. Coordinates are world-space, not normalised.
            waypoints: [
              { x: -60, y:  80 },
              { x:  60, y: -80 },
            ],
          },
          labelText: 'polyline · 2 waypoints',
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-polyline-cp')!;
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
            shape: { kind: 'circle', radius: 22 },
            bgStrokeWidth: 1.5,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x0f172a,
          },
        },
        edge: {
          style: {
            strokeColor: 0x64748b,
            strokeWidth: 1.5,
            arrowTargetShape: 'triangle',
            labelFontSize: 11,
            labelFontWeight: 500,
            labelColor: 0x334155,
            labelPlacement: 'center',
            labelAutoRotate: true,
            labelKeepUpright: true,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xe2e8f0,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 4,
            labelBackgroundPadding: 4,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
