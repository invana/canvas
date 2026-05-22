import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Types/OrthogonalLineWithControlPoints' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'manhattan'` with an explicit mid-`waypoint` — the user pins
 * the elbow, the router fills in the axis-aligned legs around it. Unlike
 * plain `orth` (which picks its own corner from the endpoint geometry),
 * `manhattan` honours the supplied waypoints and bends through each one
 * with right-angle joins.
 *
 * One waypoint placed between source and target produces a Z-shape — two
 * stub legs joined by a perpendicular bridge. Drag either endpoint to see
 * the router re-bridge around the fixed waypoint.
 */
export const OrthogonalLineWithControlPoints: Story = {
  render: () => createContainer({ id: 'graph-edge-types-orth-cp' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -240, y: -80 },
        style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'a', labelPlacement: 'top' } },
      { id: 'b', position: { x:  240, y:  80 },
        style: { bgFill: 0x10b981, bgStrokeColor: 0x047857, labelText: 'b', labelPlacement: 'bottom' } },
    ];

    const edges: EdgeData[] = [
      {
        id: 'orth-cp',
        source: 'a',
        target: 'b',
        style: {
          shape: {
            pathType: 'manhattan',
            waypoints: [
              { x: 0, y: 0 },
            ],
          },
          labelText: 'manhattan · 1 waypoint',
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-orth-cp')!;
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
            labelAutoRotate: false,
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
