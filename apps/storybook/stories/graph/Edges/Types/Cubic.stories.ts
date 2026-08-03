import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Types/Cubic' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'bezier'` with `axis: 'auto'` and the default `tension` (0.6)
 * — a full cubic Bézier with two control handles pulling along the
 * dominant axis. Compared to the `Quadratic` story (same layout, tension
 * 0.3) the curve flexes harder and develops an S-shape near the endpoints
 * when the chord runs off-axis.
 *
 * Hub-and-spoke layout, one spoke per canonical edge state — drag any
 * spoke node to confirm the handles re-pick the dominant axis live.
 */
export const Cubic: Story = {
  render: () => createContainer({ id: 'graph-edge-types-cubic' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'hub',         position: { x:    0, y:    0 } },
      { type: 'node', id: 'default',     position: { x:    0, y: -180 } },
      { type: 'node', id: 'selected',    position: { x:  171, y:  -56 } },
      { type: 'node', id: 'highlighted', position: { x:  106, y:  146 } },
      { type: 'node', id: 'dimmed',      position: { x: -106, y:  146 } },
      { type: 'node', id: 'disabled',    position: { x: -171, y:  -56 } },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'cubic-default',     source: 'hub', target: 'default',
        style: { shape: { pathType: 'bezier', sourceAnchor: 'boundary', targetAnchor: 'boundary',
                          pathStyleOpts: { axis: 'auto', tension: 0.6 } },
                 labelText: 'cubic-default' } },
      { type: 'edge', id: 'cubic-selected',    source: 'hub', target: 'selected',
        style: { shape: { pathType: 'bezier', sourceAnchor: 'boundary', targetAnchor: 'boundary',
                          pathStyleOpts: { axis: 'auto', tension: 0.6 } },
                 labelText: 'cubic-selected' },
        states: ['selected'] },
      { type: 'edge', id: 'cubic-highlighted', source: 'hub', target: 'highlighted',
        style: { shape: { pathType: 'bezier', sourceAnchor: 'boundary', targetAnchor: 'boundary',
                          pathStyleOpts: { axis: 'auto', tension: 0.6 } },
                 labelText: 'cubic-highlighted' },
        states: ['highlighted'] },
      { type: 'edge', id: 'cubic-dimmed',      source: 'hub', target: 'dimmed',
        style: { shape: { pathType: 'bezier', sourceAnchor: 'boundary', targetAnchor: 'boundary',
                          pathStyleOpts: { axis: 'auto', tension: 0.6 } },
                 labelText: 'cubic-dimmed' },
        states: ['dimmed'] },
      { type: 'edge', id: 'cubic-disabled',    source: 'hub', target: 'disabled',
        style: { shape: { pathType: 'bezier', sourceAnchor: 'boundary', targetAnchor: 'boundary',
                          pathStyleOpts: { axis: 'auto', tension: 0.6 } },
                 labelText: 'cubic-disabled' },
        states: ['disabled'] },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-cubic')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 14 },
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              bgStrokeWidth: 1.5,
            },
          },
          edge: {
            style: {
              strokeColor: 0x94a3b8,
              strokeWidth: 1.5,
              arrowTargetShape: 'triangle',
              labelFontSize: 10,
              labelFontWeight: 500,
              labelColor: 0x334155,
              labelPlacement: 'center',
              labelAutoRotate: true,
              labelKeepUpright: true,
              labelBackgroundFill: 0xffffff,
              labelBackgroundStrokeColor: 0xe2e8f0,
              labelBackgroundStrokeWidth: 1,
              labelBackgroundCornerRadius: 3,
              labelBackgroundPadding: 3,
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
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
