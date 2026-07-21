import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type BadgeEffects, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Badges/Effects' };
export default meta;
type Story = StoryObj;

/**
 * `NodeBadge.effects` — host-modulation primitives that tweak the badge's
 * transform / style each frame without adding geometry. Same `NodeEffects`
 * surface a node body uses; aliased here as {@link BadgeEffects}.
 *
 * Five hosts demonstrating the two built-in shape effects and a composed
 * pair:
 *
 * 1. **None** — baseline, no effect.
 * 2. **`breathing` (subtle)** — `amplitude: 0.2`, `frequencyHz: 1.0`. Soft
 *    scale pulse at ±20%, one cycle per second. Good for "this thing is
 *    alive" status indicators.
 * 3. **`breathing` (strong)** — `amplitude: 0.4`, `frequencyHz: 1.6`. Larger
 *    swing, faster cadence — draws the eye sharply.
 * 4. **`shake`** — `amplitude: 2`, `frequencyHz: 9`. Pixel-level jitter at
 *    9 Hz. Use for transient "attention" cues (error / alert states).
 * 5. **`shake` + `breathing`** — both keys set on the same `effects` map.
 *    The aggregator composes transform deltas additively (translations +
 *    rotation) and multiplicatively (scale), so the breathing scale and
 *    shake offset stack cleanly.
 */
export const Effects: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-effects' }),

  play: async ({ canvasElement }) => {
    type Variant = { id: string; label: string; effects?: BadgeEffects };
    const variants: Variant[] = [
      { id: 'none',     label: 'none' },
      { id: 'breathe',  label: 'breathing (subtle)', effects: { breathing: { amplitude: 0.2, frequencyHz: 1.0 } } },
      { id: 'breathe2', label: 'breathing (strong)', effects: { breathing: { amplitude: 0.4, frequencyHz: 1.6 } } },
      { id: 'shake',    label: 'shake',              effects: { shake: { amplitude: 2, frequencyHz: 9 } } },
      { id: 'combo',    label: 'shake + breathing',  effects: { shake: { amplitude: 1.5, frequencyHz: 9 }, breathing: { amplitude: 0.25, frequencyHz: 1.2 } } },
    ];

    // Per-node style is content — it rides on `initData` below.
    const nodes: NodeData[] = variants.map((v, i) => ({
      id: v.id,
      position: { x: (i - 2) * 180, y: 0 },
      style: {
        shape: { kind: 'circle', radius: 32 },
        bgFill: 0x60a5fa,
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1,
        labelText: v.label,
        labelColor: 0x0f172a,
        labelFontSize: 11,
        labelPlacement: 'bottom',
        labelOffsetY: 8,
        badges: [
          {
            id: 'demo',
            placement: 'top-right',
            origin: 'center',
            shape: { kind: 'circle', radius: 11 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 2,
            ...(v.effects ? { effects: v.effects } : {}),
          },
        ],
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-effects',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
