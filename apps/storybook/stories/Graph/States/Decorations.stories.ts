import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/States/Decorations' };
export default meta;
type Story = StoryObj;

/**
 * Validates `style.decorations` (slot dict) — per-instance declarative
 * decoration attachment via the v3 NodeData shape. State overlays toggle
 * decorations on/off as state changes.
 *
 * Each tile activates a different decoration slot via `state`:
 * - selected → halo (yellow ring)
 * - error → marching-ants border (red animated dashes)
 * - active → glow
 *
 * NOTE: Decoration runtime wiring (slot-diff + `renderer.setDecoration`)
 * arrives in a follow-up phase. For now, this story validates that the
 * `style.decorations` field round-trips through input → store → layer
 * without typecheck or runtime errors. The visual decorations will appear
 * once the render-path adapter projects `style.decorations` slots to
 * `renderer.setDecoration(id, slot, spec)` calls.
 */
export const Decorations: Story = {
  render: () => createContainer({ id: 'graph-states-decorations' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-decorations',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const nodes: NodeData[] = [
      {
        id: 'sel',
        position: { x: -180, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'selected → halo',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        state: {
          selected: {
            bgStrokeColor: 0xfacc15,
            bgStrokeWidth: 3,
            decorations: { halo: { color: 0xfacc15, width: 4, alpha: 0.6 } },
          },
        },
        states: ['selected'],
      },
      {
        id: 'err',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 8 },
          bgFill: 0xffffff,
          bgStrokeColor: 0x4a90e2,
          bgStrokeWidth: 2,
          labelText: 'error → border',
          labelColor: 0x2c3e50,
          labelPlacement: 'center',
          labelFontSize: 12,
          labelFontWeight: 600,
        },
        state: {
          error: {
            bgStrokeColor: 0xef4444,
            bgStrokeWidth: 3,
            decorations: {
              border: { kind: 'marching-ants', color: 0xff0000, width: 2 },
            },
          },
        },
        states: ['error'],
      },
      {
        id: 'glow',
        position: { x: 180, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x10b981,
          bgStrokeColor: 0x065f46,
          bgStrokeWidth: 1,
          labelText: 'active → glow',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        state: {
          active: {
            decorations: { glow: { color: 0x10b981, blur: 12, alpha: 0.7 } },
          },
        },
        states: ['active'],
      },
    ];

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
