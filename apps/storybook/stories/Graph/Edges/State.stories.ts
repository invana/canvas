import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Edges/State' };
export default meta;
type Story = StoryObj;

/**
 * Visual catalogue of the canonical edge *states* in `@invana/graph`.
 *
 * Mirror of `Graph/Nodes/State`. `GraphLayer` ships with
 * `DEFAULT_EDGE_STATE_CONFIGS` auto-registered, so no state-config
 * registration in story code. Each edge's label styling lives in
 * `edgeDefaults.label` (resolver), and each tile's edge state is supplied
 * directly via the data-driven `state` field on `GraphEdge`.
 *
 * The nodes / edges are flat literal arrays (no map / forEach) so the
 * data shape is visible at a glance in Storybook's "Show code" tab.
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

    // 3×3 grid. Cell pitch: 280 × 180. Endpoints sit ±90 from each cell
    // centre. Anchor ids: a-* (left), b-* (right) per tile.
    const nodes: GraphNode[] = [
      // row 0 — y = -180
      { id: 'a-default',     position: { x: -370, y: -180 } },
      { id: 'b-default',     position: { x: -190, y: -180 } },
      { id: 'a-hover',       position: { x:  -90, y: -180 } },
      { id: 'b-hover',       position: { x:   90, y: -180 } },
      { id: 'a-selected',    position: { x:  190, y: -180 } },
      { id: 'b-selected',    position: { x:  370, y: -180 } },

      // row 1 — y = 0
      { id: 'a-active',      position: { x: -370, y:    0 } },
      { id: 'b-active',      position: { x: -190, y:    0 } },
      { id: 'a-highlighted', position: { x:  -90, y:    0 } },
      { id: 'b-highlighted', position: { x:   90, y:    0 } },
      { id: 'a-focused',     position: { x:  190, y:    0 } },
      { id: 'b-focused',     position: { x:  370, y:    0 } },

      // row 2 — y = 180
      { id: 'a-dimmed',      position: { x: -370, y:  180 } },
      { id: 'b-dimmed',      position: { x: -190, y:  180 } },
      { id: 'a-disabled',    position: { x:  -90, y:  180 } },
      { id: 'b-disabled',    position: { x:   90, y:  180 } },
      { id: 'a-error',       position: { x:  190, y:  180 } },
      { id: 'b-error',       position: { x:  370, y:  180 } },
    ];

    const edges: GraphEdge<TileData>[] = [
      {
        id: 'e-default',
        source: 'a-default', target: 'b-default',
        data: { state: 'default', note: 'resting appearance — no state active' },
      },
      {
        id: 'e-hover',
        source: 'a-hover', target: 'b-hover',
        data: { state: 'hover', note: 'pointer is over the edge' },
        state: ['hover'],
      },
      {
        id: 'e-selected',
        source: 'a-selected', target: 'b-selected',
        data: { state: 'selected', note: 'click-selected (sticky)' },
        state: ['selected'],
      },
      {
        id: 'e-active',
        source: 'a-active', target: 'b-active',
        data: { state: 'active', note: 'directly-hovered focal edge' },
        state: ['active'],
      },
      {
        id: 'e-highlighted',
        source: 'a-highlighted', target: 'b-highlighted',
        data: { state: 'highlighted', note: 'incident to a focal node' },
        state: ['highlighted'],
      },
      {
        id: 'e-focused',
        source: 'a-focused', target: 'b-focused',
        data: { state: 'focused', note: 'keyboard-focus ring' },
        state: ['focused'],
      },
      {
        id: 'e-dimmed',
        source: 'a-dimmed', target: 'b-dimmed',
        data: { state: 'dimmed', note: 'de-emphasised by another active set' },
        state: ['dimmed'],
      },
      {
        id: 'e-disabled',
        source: 'a-disabled', target: 'b-disabled',
        data: { state: 'disabled', note: 'not interactive' },
        state: ['disabled'],
      },
      {
        id: 'e-error',
        source: 'a-error', target: 'b-error',
        data: { state: 'error', note: 'invalid relationship' },
        state: ['error'],
      },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        nodeDefaults: {
          shape: 'circle',
          size: 20,
          fill: 0xe5e7eb,
          stroke: 0x9ca3af,
          strokeWidth: 1,
        },
        edgeDefaults: {
          stroke: 0x6b7280,
          strokeWidth: 2,
          arrow: true,
          label: (e) => {
            const tile = e.data as TileData;
            return {
              content: {
                kind: 'text',
                text: `${tile.state}\n${tile.note}`,
                fontSize: 12,
                fontWeight: 600,
                fill: 0x454545,
                align: 'center',
                lineHeight: 16,
              },
              placement: 'center',
              offset: { y: 22 },
              autoRotate: false,
            };
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
