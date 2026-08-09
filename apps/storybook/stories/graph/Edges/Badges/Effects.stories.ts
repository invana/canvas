import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type BadgeEffects,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Badges/Effects' };
export default meta;
type Story = StoryObj;

/**
 * `EdgeBadge.effects` mirrors {@link NodeBadge.effects} — the same
 * shape-effect surface, applied to a badge anchored along a path instead
 * of on a node. The badge is rendered as a real shape under the hood, so
 * `shake` / `breathing` work identically regardless of host kind.
 *
 * Five edges with a midpoint badge:
 *
 * 1. **None** — baseline, no effect.
 * 2. **`breathing` (subtle)** — `amplitude: 0.2`, `frequencyHz: 1.0`.
 * 3. **`breathing` (strong)** — `amplitude: 0.4`, `frequencyHz: 1.6`.
 * 4. **`shake`** — `amplitude: 2`, `frequencyHz: 9`. Pixel-level jitter
 *    on the midpoint chip — handy for "live / error / attention" cues
 *    on a connection.
 * 5. **`shake` + `breathing`** — composed via the same `effects` map.
 *    Transform deltas stack the way they do on a node: scale multiplies,
 *    translation adds.
 *
 * Drag the right-hand node to confirm effects keep playing as the path
 * re-routes — effects modulate the badge's own gfx and are independent of
 * the routed-path math that anchors it.
 */
export const Effects: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-effects' }),

  play: async ({ canvasElement }) => {
    type Variant = { id: string; label: string; effects?: BadgeEffects };
    const variants: Variant[] = [
      { id: 'none',     label: 'none' },
      { id: 'breathe',  label: 'breathing (subtle)', effects: { breathing: { amplitude: 0.2, frequencyHz: 1.0 } } },
      { id: 'breathe2', label: 'breathing (strong)', effects: { breathing: { amplitude: 0.4, frequencyHz: 1.6 } } },
      { id: 'shake',    label: 'shake',              effects: { shake: { amplitude: 2, frequencyHz: 9 } } },
      { id: 'combo',    label: 'shake + breathing',  effects: { shake: { amplitude: 1.5, frequencyHz: 9 }, breathing: { amplitude: 0.25, frequencyHz: 1.2 } } },
    ];

    const nodes: GraphNode[] = variants.flatMap((v, i) => [
      {
        id: `${v.id}-src`,
        type: 'node',
        position: { x: -260, y: (i - 2) * 90 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: v.label,
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10
        }
      },
      {
        id: `${v.id}-tgt`,
        type: 'node',
        position: { x: 260, y: (i - 2) * 90 },
        style: {
          shape: { kind: 'circle', radius: 14 },
          bgFill: 0x34d399,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1
        }
      },
    ]);

    const edges: GraphEdge[] = variants.map((v) => ({ type: 'edge',
      id: v.id,
      source: `${v.id}-src`,
      target: `${v.id}-tgt`,
      style: {
        badges: [
          {
            id: 'demo',
            type: 'node',
            placement: 'middle',
            shape: { kind: 'circle', radius: 11 },
            fill: 0xdc2626,
            strokeColor: 0xffffff,
            strokeWidth: 2,
            ...(v.effects ? { effects: v.effects } : {})
          },
        ]
      }
    }));

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-effects',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } }
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: { edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'none' } } }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'drag-node': { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
