import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Layer/CustomStateConfigs' };
export default meta;
type Story = StoryObj;

/**
 * Declarative override of the canonical state configs via
 * `options.node.state` — and registration of brand-new state names
 * through the same map.
 *
 * The five tiles demonstrate:
 * - `hover` rendered with the canonical default (white ring).
 * - `hover` overridden in this layer to a red 5-px ring.
 * - A new `mention` state (yellow ring) that has no canonical equivalent.
 * - A new `escalated` state (thick red ring + red fill).
 * - `mention + escalated` stacked — last-applied state wins per field.
 *
 * The override layer (`options.node.state`) is applied AFTER the
 * canonical bundle, so matching names win and unmatched names register as
 * fresh states.
 */
export const CustomStateConfigsStory: Story = {
  name: 'CustomStateConfigs',
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
      type: 'node',
      position: { x: -300, y: -90 },
      data: { title: 'hover (canonical)', note: 'shipped default' },
      states: ['hovered'],
    };
    const overriddenTile: GraphNode<TileData> = {
      id: 'overridden-hover',
      type: 'node',
      position: { x: 0, y: -90 },
      data: { title: 'hover (overridden)', note: 'options.node.state' },
      states: ['hovered'],
    };
    const mentionTile: GraphNode<TileData> = {
      id: 'mention',
      type: 'node',
      position: { x: 300, y: -90 },
      data: { title: 'mention (new)', note: 'declared in this layer' },
      states: ['mention'],
    };
    const escalatedTile: GraphNode<TileData> = {
      id: 'escalated',
      type: 'node',
      position: { x: -150, y: 110 },
      data: { title: 'escalated (new)', note: 'declared in this layer' },
      states: ['escalated'],
    };
    const stackedTile: GraphNode<TileData> = {
      id: 'mention+escalated',
      type: 'node',
      position: { x: 150, y: 110 },
      data: { title: 'mention + escalated', note: 'stacked — last-set wins per field' },
      states: ['mention', 'escalated'],
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-custom-state-configs')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const labelResolver = (n: GraphNode) => {
      const tile = n.data as TileData;
      return { type: 'node',
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
    const sharedNodeStyle = {
      shape: { kind: 'circle' as const, radius: 32 },
      bgFill: 0x3b82f6,
      bgStrokeColor: 0xffffff,
      bgStrokeWidth: 1,
      labelStyle: labelResolver,
    };

    // Layer A — canonical bundle, no overrides. The first tile renders
    // its `hover` against the shipped default (white 3-px ring). The
    // `labelStyle` resolver is non-serialisable → it stays in the
    // constructor along with the per-layer `initData`.
    const canonicalLayer = new GraphLayer({
      id: 'canonical',
      options: {
        node: { style: sharedNodeStyle },
        initData: { nodes: [canonicalTile], edges: [] },
      },
    });
    canvas.layers.add(canonicalLayer);

    // Layer B — overrides `hover` and adds two new state names declaratively
    // via `options.node.state`. The other four tiles live here. The state
    // catalogue is the subject of this story, so it stays on the layer.
    const customLayer = new GraphLayer({
      id: 'custom',
      options: {
        node: {
          style: sharedNodeStyle,
          state: {
            hovered:   { bgStrokeColor: 0xef4444, bgStrokeWidth: 5 },                       // overrides canonical
            mention:   { bgStrokeColor: 0xfacc15, bgStrokeWidth: 3 },                       // NEW state
            escalated: { bgStrokeColor: 0xef4444, bgStrokeWidth: 5, bgFill: 0x7f1d1d },     // NEW state
          },
        },
        initData: { nodes: [overriddenTile, mentionTile, escalatedTile, stackedTile], edges: [] },
      },
    });
    canvas.layers.add(customLayer);

    await canvas.init({
      container,
      autoResize: true,
      config: { behaviours: { pan: { enabled: true }, zoom: { enabled: true } } },
    });

    canvas.camera.fitContent(canonicalLayer.getBounds(), 80);
  },
};
