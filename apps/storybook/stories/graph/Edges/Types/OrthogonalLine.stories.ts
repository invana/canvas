import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/OrthogonalLine' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'orth'` — the orthogonal router. Source and target are joined
 * by axis-aligned segments meeting at a single right-angle elbow; no
 * diagonals appear regardless of the angle between endpoints. Pairs with
 * the `normal` pathStyle so the corner stays sharp.
 *
 * The single edge here has the source and target offset on both axes so
 * the elbow is visible. Drag either endpoint to confirm the elbow snaps
 * to the new chord and the segments stay axis-aligned.
 */
export const OrthogonalLine: Story = {
  render: () => createContainer({ id: 'graph-edge-types-orth' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      { id: 'a', position: { x: -220, y: -80 },
        style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'a', labelPlacement: 'top' } },
      { id: 'b', position: { x:  220, y:  80 },
        style: { bgFill: 0x10b981, bgStrokeColor: 0x047857, labelText: 'b', labelPlacement: 'bottom' } },
    ];

    const edges: EdgeData[] = [
      {
        id: 'orth',
        source: 'a',
        target: 'b',
        style: {
          shape: { pathType: 'orth' },
          labelText: 'orth',
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-orth')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } },
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
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);
  },
};
