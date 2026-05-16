import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type GraphNode } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Layer/CustomStateConfigs' };
export default meta;
type Story = StoryObj;

/**
 * Declarative override of the canonical state configs via
 * `options.nodeStateConfigs` — and registration of brand-new state names
 * through the same map. No imperative `setNodeStateConfig` calls.
 *
 * The four tiles demonstrate:
 * - `hover` rendered with the canonical default (white ring).
 * - `hover` overridden in this layer to a red 5-px ring.
 * - A new `mention` state (yellow ring) that has no canonical equivalent.
 * - A new `escalated` state (thick red ring).
 *
 * The override layer (`options.nodeStateConfigs`) is applied AFTER the
 * canonical bundle, so matching names win and unmatched names register as
 * fresh states. The runtime `graph.setNodeStateConfig(name, cfg)` setter
 * still works on top of either and overrides whatever was registered.
 */
export const CustomStateConfigs: Story = {
  render: () => createContainer({ id: 'graph-custom-state-configs' }),

  play: async ({ canvasElement }) => {
    interface TileData {
      readonly title: string;
      readonly note: string;
    }

    // We construct TWO layers so the first tile can use the canonical
    // `hover` while the second uses the overridden one. Both layers
    // share the same canvas and camera.
    const canonicalTile: GraphNode<TileData> = {
      id: 'canonical-hover',
      position: { x: -300, y: -90 },
      data: { title: 'hover (canonical)', note: 'shipped default' },
      state: ['hover'],
    };
    const overriddenTile: GraphNode<TileData> = {
      id: 'overridden-hover',
      position: { x: 0, y: -90 },
      data: { title: 'hover (overridden)', note: 'options.nodeStateConfigs' },
      state: ['hover'],
    };
    const mentionTile: GraphNode<TileData> = {
      id: 'mention',
      position: { x: 300, y: -90 },
      data: { title: 'mention (new)', note: 'declared in this layer' },
      state: ['mention'],
    };
    const escalatedTile: GraphNode<TileData> = {
      id: 'escalated',
      position: { x: -150, y: 110 },
      data: { title: 'escalated (new)', note: 'declared in this layer' },
      state: ['escalated'],
    };
    const stackedTile: GraphNode<TileData> = {
      id: 'mention+escalated',
      position: { x: 150, y: 110 },
      data: { title: 'mention + escalated', note: 'stacked — last-set wins per field' },
      state: ['mention', 'escalated'],
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-custom-state-configs')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const labelResolver = (n: GraphNode) => {
      const tile = n.data as TileData;
      return {
        content: {
          kind: 'text' as const,
          text: `${tile.title}\n${tile.note}`,
          fontSize: 12,
          fontWeight: 600,
          fill: 0xefefef,
          align: 'center' as const,
          lineHeight: 16,
        },
        placement: 'bottom' as const,
        offset: { y: 8 },
      };
    };
    const sharedNodeDefaults = {
      shape: 'circle' as const,
      size: 64,
      fill: 0x3b82f6,
      stroke: 0xffffff,
      strokeWidth: 1,
      label: labelResolver,
    };

    // Layer A — canonical bundle, no overrides. The first tile renders
    // its `hover` against the shipped default (white 3-px ring).
    const canonicalLayer = new GraphLayer({
      id: 'canonical',
      options: { nodeDefaults: sharedNodeDefaults },
    });
    canvas.layers.add(canonicalLayer);
    canonicalLayer.setData({ nodes: [canonicalTile], edges: [] });

    // Layer B — overrides `hover` and adds two new state names declaratively
    // via `nodeStateConfigs`. The other four tiles live here.
    const customLayer = new GraphLayer({
      id: 'custom',
      options: {
        nodeDefaults: sharedNodeDefaults,
        nodeStateConfigs: {
          hover:     { stroke: 0xef4444, strokeWidth: 5 },               // overrides canonical
          mention:   { stroke: 0xfacc15, strokeWidth: 3 },               // NEW state
          escalated: { stroke: 0xef4444, strokeWidth: 5, fill: 0x7f1d1d }, // NEW state
        },
      },
    });
    canvas.layers.add(customLayer);
    customLayer.setData({
      nodes: [overriddenTile, mentionTile, escalatedTile, stackedTile],
      edges: [],
    });

    canvas.camera.fitContent(canonicalLayer.getBounds(), 80);
  },
};
