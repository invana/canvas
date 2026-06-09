import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Types/VerticalCubic' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'bezier'` with `axis: 'v'` — control handles always pull
 * vertically regardless of the chord angle. A shallow tree layout
 * (one root, five children) makes the family of vertical-cubic links read
 * like a classic dendrogram: each curve leaves the root pointing
 * straight down and approaches its child pointing straight down, with
 * the lateral bend absorbed by the y-axis handle length.
 *
 * One child per canonical edge state, so the colour-coded state overlays
 * read against the vertical-cubic geometry.
 */
export const VerticalCubic: Story = {
  render: () => createContainer({ id: 'graph-edge-types-vertical-cubic' }),

  play: async ({ canvasElement }) => {
    // Root at the top centre; five children spread along y = +180, evenly
    // spaced from x = -240 to x = +240.
    const nodes: NodeData[] = [
      { id: 'root',        position: { x:    0, y: -180 } },
      { id: 'default',     position: { x: -240, y:  180 } },
      { id: 'selected',    position: { x: -120, y:  180 } },
      { id: 'highlighted', position: { x:    0, y:  180 } },
      { id: 'dimmed',      position: { x:  120, y:  180 } },
      { id: 'disabled',    position: { x:  240, y:  180 } },
    ];

    const edges: EdgeData[] = [
      { id: 'vcubic-default',     source: 'root', target: 'default',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.6 } },
                 labelText: 'default' } },
      { id: 'vcubic-selected',    source: 'root', target: 'selected',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.6 } },
                 labelText: 'selected' },
        states: ['selected'] },
      { id: 'vcubic-highlighted', source: 'root', target: 'highlighted',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.6 } },
                 labelText: 'highlighted' },
        states: ['highlighted'] },
      { id: 'vcubic-dimmed',      source: 'root', target: 'dimmed',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.6 } },
                 labelText: 'dimmed' },
        states: ['dimmed'] },
      { id: 'vcubic-disabled',    source: 'root', target: 'disabled',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.6 } },
                 labelText: 'disabled' },
        states: ['disabled'] },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-vertical-cubic')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via `initData`. The literal
    // node/edge templates are serialisable, so they live in `canvasOptions`.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));

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
