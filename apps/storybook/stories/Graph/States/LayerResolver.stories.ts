import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type GraphNode, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/States/LayerResolver' };
export default meta;
type Story = StoryObj;

/**
 * Validates layer-wide `node` template (v3 G6-aligned `NodeOption`) with
 * resolver functions on style fields and a layer-level `state.hover`
 * overlay catalogue.
 *
 * - `node.style.bgFill` is a resolver `(node: GraphNode) => color` picking
 *   from `data.group`.
 * - `node.state.hover` overrides the canonical hover for this layer only
 *   — orange thick ring instead of the default white thin.
 *
 * Five nodes feed varying `data.group`; every other one carries
 * `states: ['hover']` so we can compare resting vs. hover with the
 * layer-level overrides applied.
 */
export const LayerResolver: Story = {
  render: () => createContainer({ id: 'graph-states-layer-resolver' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-layer-resolver',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly weight: number;
      readonly group: 0 | 1 | 2;
    }

    const groupColors = [0x3b82f6, 0xef4444, 0x10b981] as const;

    // Per-node `style.shape` is concrete (no resolvers per-instance at the
    // store layer). The layer-level `node.style.bgFill` resolver runs
    // every render against the stored GraphNode.
    const nodes: NodeData<TileData>[] = [
      {
        id: 'a',
        position: { x: -240, y: 0 },
        data: { weight: 1.0, group: 0 },
        style: { shape: { kind: 'circle', radius: 20 }, labelText: 'a' },
      },
      {
        id: 'b',
        position: { x: -120, y: 0 },
        data: { weight: 1.5, group: 1 },
        style: { shape: { kind: 'circle', radius: 26 }, labelText: 'b' },
        states: ['hover'],
      },
      {
        id: 'c',
        position: { x: 0, y: 0 },
        data: { weight: 2.0, group: 2 },
        style: { shape: { kind: 'circle', radius: 32 }, labelText: 'c' },
      },
      {
        id: 'd',
        position: { x: 120, y: 0 },
        data: { weight: 2.5, group: 0 },
        style: { shape: { kind: 'circle', radius: 38 }, labelText: 'd' },
        states: ['hover'],
      },
      {
        id: 'e',
        position: { x: 240, y: 0 },
        data: { weight: 3.0, group: 1 },
        style: { shape: { kind: 'circle', radius: 44 }, labelText: 'e' },
      },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            // Resolver: pick fill from data.group per node.
            bgFill: (n: GraphNode) =>
              groupColors[((n.data as TileData | undefined)?.group ?? 0)],
            bgStrokeColor: 0x1f2937,
            bgStrokeWidth: 1,
            labelColor: 0x1f2937,
            labelPlacement: 'bottom',
            labelFontSize: 12,
            labelOffsetY: 8,
          },
          // Override the layer's built-in `hover` with a v3 overlay — wins
          // over the canonical config for this layer only.
          state: {
            hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
