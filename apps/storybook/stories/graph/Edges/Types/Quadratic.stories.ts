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

const meta: Meta = { title: 'graph/Edges/Types/Quadratic' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'quadratic'` — a single quadratic Bézier with one control
 * point placed **perpendicular to the source→target chord** at
 * `curvePosition` along it and `curveOffset` units to the side. Unlike
 * axis-aligned `bezier` (which collapses to a straight line on cardinal
 * chords because the handles pull along the chord's own axis), the
 * perpendicular construction gives a real bow on **every** orientation —
 * the family of hub-and-spoke spokes here all flex outward by the same
 * signed offset, reading as a coherent counter-clockwise swirl.
 *
 * Five spokes, one per canonical edge state, so the colour-coded states
 * from `DEFAULT_EDGE_STATE_CONFIGS` read alongside the quadratic geometry.
 */
export const Quadratic: Story = {
  render: () => createContainer({ id: 'graph-edge-types-quadratic' }),

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
      { type: 'edge', id: 'quadratic-default',     source: 'hub', target: 'default',
        style: { shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: -30 } },
                 labelText: 'quadratic-default' } },
      { type: 'edge', id: 'quadratic-selected',    source: 'hub', target: 'selected',
        style: { shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: -30 } },
                 labelText: 'quadratic-selected' },
        states: ['selected'] },
      { type: 'edge', id: 'quadratic-highlighted', source: 'hub', target: 'highlighted',
        style: { shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: -30 } },
                 labelText: 'quadratic-highlighted' },
        states: ['highlighted'] },
      { type: 'edge', id: 'quadratic-dimmed',      source: 'hub', target: 'dimmed',
        style: { shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: -30 } },
                 labelText: 'quadratic-dimmed' },
        states: ['dimmed'] },
      { type: 'edge', id: 'quadratic-disabled',    source: 'hub', target: 'disabled',
        style: { shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: -30 } },
                 labelText: 'quadratic-disabled' },
        states: ['disabled'] },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-quadratic')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via `initData`. The literal
    // node/edge templates are serialisable, so they live in `canvasOptions`.
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
