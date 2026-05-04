import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { RendererLayer } from '../../_shared/GenericLayer';

const meta: Meta = {
  title: 'Canvas/Renderer/Shapes',
};
export default meta;
type Story = StoryObj;

// All built-in shape primitives laid out in a single row.
// Each object is a self-contained spec: id + kind + drawing fields.
// (x, y) is always the shape center.
const shapes = [
  {
    id: 'circle',
    kind: 'circle',
    x: 100, y: 180,
    r: 45,
    fill: 0x4f9cf9,
    stroke: 0x1e3a8a,
    strokeWidth: 2,
  },
  {
    id: 'rect',
    kind: 'rect',
    x: 260, y: 180,
    width: 110, height: 70,
    cornerRadius: 10,
    fill: 0x10b981,
    stroke: 0x065f46,
    strokeWidth: 2,
  },
  {
    id: 'ellipse',
    kind: 'ellipse',
    x: 420, y: 180,
    rx: 58, ry: 32,
    fill: 0xf59e0b,
    stroke: 0x92400e,
    strokeWidth: 2,
  },
  {
    // Hexagon: 6 points at radius 38 in local coords, starting from top.
    // Angles: 0°=-90°, 60°, 120°, 180°, 240°, 300° (relative to +x axis).
    id: 'polygon',
    kind: 'polygon',
    x: 570, y: 180,
    points: [
      { x:   0,     y: -38 },
      { x:  32.91,  y: -19 },
      { x:  32.91,  y:  19 },
      { x:   0,     y:  38 },
      { x: -32.91,  y:  19 },
      { x: -32.91,  y: -19 },
    ],
    fill: 0xa855f7,
    stroke: 0x6b21a8,
    strokeWidth: 2,
  },
  {
    // Right-pointing arrow pentagon using explicit lineTo path commands.
    // Coords are in local space centered on (x, y).
    id: 'path',
    kind: 'path',
    x: 720, y: 180,
    commands: [
      { kind: 'moveTo', x: -30, y: -20 },
      { kind: 'lineTo', x:  10, y: -20 },
      { kind: 'lineTo', x:  32, y:   0 },
      { kind: 'lineTo', x:  10, y:  20 },
      { kind: 'lineTo', x: -30, y:  20 },
      { kind: 'lineTo', x: -12, y:   0 },
      { kind: 'close' },
    ],
    fill: 0xef4444,
    stroke: 0x7f1d1d,
    strokeWidth: 2,
  },
];

export const Shapes: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new RendererLayer({ id: 'shapes', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of shapes) {
        layer.renderer.addShape(id, spec as never);
      }
    });

    return container;
  },
};
