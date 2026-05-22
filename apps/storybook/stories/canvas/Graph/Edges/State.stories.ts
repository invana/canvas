import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/State' };
export default meta;
type Story = StoryObj;

/**
 * Visual catalogue of the canonical edge *states* in `@invana/graph`.
 *
 * Mirror of `Graph/Nodes/State`. `GraphLayer` ships with
 * `DEFAULT_EDGE_STATE_CONFIGS` auto-registered, so no state-config
 * registration in story code. Layer-level `edge.style` carries the shared
 * label font / placement / background-pill / autoRotate-off settings;
 * each per-edge entry only declares its `labelText` (two-line:
 * "{state}\n{note}") plus the data-driven `states: [name]` activation.
 *
 * v3 G6-aligned shape:
 *   - per-edge: `id`, `source`, `target`, `data`, `style.labelText`, `states`
 *   - layer `edge.style`: everything else (label font/colour/pill/placement)
 *   - `data` is pure user payload; the rendering reads from `style.labelText`
 */
export const State: Story = {
  render: () => createContainer({ id: 'graph-edge-state' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-state')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
      readonly note: string;
    }

    // 3×2 grid. Cell pitch: 280 × 200. Endpoints sit ±90 from each cell
    // centre. Anchor ids: a-* (left), b-* (right) per tile.
    const nodes: NodeData[] = [
      // row 0 — y = -100
      { id: 'a-default',     position: { x: -370, y: -100 } },
      { id: 'b-default',     position: { x: -190, y: -100 } },
      { id: 'a-hover',       position: { x:  -90, y: -100 } },
      { id: 'b-hover',       position: { x:   90, y: -100 } },
      { id: 'a-selected',    position: { x:  190, y: -100 } },
      { id: 'b-selected',    position: { x:  370, y: -100 } },

      // row 1 — y = 100
      { id: 'a-highlighted', position: { x: -370, y:  100 } },
      { id: 'b-highlighted', position: { x: -190, y:  100 } },
      { id: 'a-dimmed',      position: { x:  -90, y:  100 } },
      { id: 'b-dimmed',      position: { x:   90, y:  100 } },
      { id: 'a-disabled',    position: { x:  190, y:  100 } },
      { id: 'b-disabled',    position: { x:  370, y:  100 } },
    ];

    const edges: EdgeData<TileData>[] = [
      {
        id: 'e-default',
        source: 'a-default', target: 'b-default',
        data: { state: 'default', note: 'resting appearance — no state active' },
        style: { labelText: 'default\nresting appearance — no state active' },
      },
      {
        id: 'e-hover',
        source: 'a-hover', target: 'b-hover',
        data: { state: 'hovered', note: 'pointer is over the edge' },
        style: { labelText: 'hovered\npointer is over the edge' },
        states: ['hovered'],
      },
      {
        id: 'e-selected',
        source: 'a-selected', target: 'b-selected',
        data: { state: 'selected', note: 'click-selected (sticky)' },
        style: { labelText: 'selected\nclick-selected (sticky)' },
        states: ['selected'],
      },
      {
        id: 'e-highlighted',
        source: 'a-highlighted', target: 'b-highlighted',
        data: { state: 'highlighted', note: 'incident to a focal node' },
        style: { labelText: 'highlighted\nincident to a focal node' },
        states: ['highlighted'],
      },
      {
        id: 'e-dimmed',
        source: 'a-dimmed', target: 'b-dimmed',
        data: { state: 'dimmed', note: 'de-emphasised by another active set' },
        style: { labelText: 'dimmed\nde-emphasised by another active set' },
        states: ['dimmed'],
      },
      {
        id: 'e-disabled',
        source: 'a-disabled', target: 'b-disabled',
        data: { state: 'disabled', note: 'not interactive' },
        style: { labelText: 'disabled\nnot interactive' },
        states: ['disabled'],
      },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 10 },
            bgFill: 0xe5e7eb,
            bgStrokeColor: 0x9ca3af,
            bgStrokeWidth: 1,
          },
        },
        edge: {
          style: {
            strokeColor: 0x6b7280,
            strokeWidth: 2,
            arrowTargetShape: 'triangle',
            // Shared label styling — per-edge `labelText` supplies the text.
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x454545,
            labelAlign: 'center',
            labelLineHeight: 16,
            labelPlacement: 'center',
            labelOffsetY: 22,
            labelAutoRotate: false,
          },
        },
        // Canonical state configs are auto-registered. Pass
        // `useDefaultStateConfigs: false` to opt out.
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.camera.fitContent(graph.getBounds(), 60);
  },
};
