import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Etc/Decorations' };
export default meta;
type Story = StoryObj;

/**
 * Validates `style.decorations` (discriminated-union array) — per-instance
 * declarative decoration attachment via the v3 NodeData shape. State
 * overlays append decorations to the resolved set; the layer projects them
 * to `renderer.setDecoration` calls per slot id.
 *
 * Each tile activates a different decoration kind via `state`:
 * - selected → yellow ring decoration
 * - error → marching-ants border (red animated dashes)
 * - active → soft glow
 */
export const Decorations: Story = {
  render: () => createContainer({ id: 'graph-states-decorations' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-decorations',
    )!;

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
            decorations: [
              { kind: 'ring', id: 'select', color: 0xfacc15, width: 4, gap: 3, alpha: 0.9 },
            ],
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
            decorations: [
              { kind: 'marching-ants', id: 'err-border', color: 0xff0000, strokeWidth: 2 },
            ],
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
            decorations: [
              { kind: 'glow', id: 'active-glow', color: 0x10b981, strokeWidth: 14, innerAlpha: 0.7 },
            ],
          },
        },
        states: ['active'],
      },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [] } },
    });
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
