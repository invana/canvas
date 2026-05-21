import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Badges/Multiple' };
export default meta;
type Story = StoryObj;

/**
 * Multiple badges per host. A single node may carry as many badges as it
 * needs — `NodeStyle.badges` is an ordered array. Each entry has its own
 * `placement`, its own `shape`, and its own (optional) decorations /
 * effects. The renderer mounts each badge under a stable slot id derived
 * from `NodeBadge.id` (or the entry's array index when `id` is absent), so
 * state-overlay diffing works per-badge.
 *
 * This story shows one host with **four** badges — one in each corner —
 * each demonstrating a different surface (icon, count, decoration,
 * effect). Drag the host (it's pan-only — DragNodeBehaviour is not
 * registered) and confirm every badge re-anchors as one.
 */
export const Multiple: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-multiple' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'host',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 160, height: 110, cornerRadius: 14 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: 'multi-badge host',
          labelColor: 0xffffff,
          labelFontSize: 12,
          labelPlacement: 'center',
          badges: [
            // Top-left — icon badge (glyph "i" for info).
            {
              id: 'info',
              placement: 'top-left',
              origin: 'center',
              shape: { kind: 'circle', radius: 11 },
              fill: 0x1d4ed8,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              icon: {
                kind: 'glyph',
                char: 'i',
                fontFamily: 'serif',
                fontWeight: 700,
                color: 0xffffff,
                sizeRatio: 0.7,
              },
            },
            // Top-right — count chip.
            {
              id: 'count',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'rect', width: 26, height: 18, cornerRadius: 9 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelText: '7',
              labelColor: 0xffffff,
              labelFontSize: 12,
            },
            // Bottom-right — glow decoration on a notification dot.
            {
              id: 'hot',
              placement: 'bottom-right',
              origin: 'center',
              shape: { kind: 'circle', radius: 8 },
              fill: 0xf97316,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              decorations: [
                {
                  kind: 'glow',
                  color: 0xf97316,
                  strokeWidth: 12,
                  layers: 6,
                  innerAlpha: 0.6,
                },
              ],
            },
            // Bottom-left — breathing effect on a star plate.
            {
              id: 'star',
              placement: 'bottom-left',
              origin: 'center',
              shape: { kind: 'star', points: 5, outerRadius: 11, innerRadius: 5 },
              fill: 0xfacc15,
              strokeColor: 0xffffff,
              strokeWidth: 1,
              effects: {
                breathing: { amplitude: 0.3, frequencyHz: 1.2 },
              },
            },
          ],
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-multiple',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 120);
  },
};
