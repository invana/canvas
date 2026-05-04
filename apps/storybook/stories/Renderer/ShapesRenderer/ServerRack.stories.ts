import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  WorldLayer,
  ShapesRenderer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

const meta: Meta = {
  title: 'Canvas/Renderer/Shapes',
};
export default meta;
type Story = StoryObj;

class GenericLayer extends WorldLayer {
  renderer!: ShapesRenderer;
  protected createState() { return {}; }
  protected override onMount(ctx: CanvasContext): void {
    this.renderer = new ShapesRenderer({ subLayer: this.subLayer, camera: ctx.camera });
  }
  hitTest() { return null; }
}

// A "server rack" composed entirely from built-in shape primitives:
//   - rect   → chassis, bezels, server unit bodies, base, screen panel
//   - path   → vent grille lines (horizontal lineTo strokes)
//   - circle → status LEDs (power, activity, link), power button
// (x, y) is the shape center. Coords inside `path.commands` are local to
// that shape's center. The whole rack sits centred around (400, 300).
const shapes = [
  // ─── chassis ──────────────────────────────────────────────────────────
  {
    id: 'rack-chassis',
    kind: 'rect',
    x: 400, y: 300,
    width: 280, height: 560,
    cornerRadius: 6,
    fill: 0x111827,
    stroke: 0x000000,
    strokeWidth: 2,
    zIndex: 0,
  },
  {
    id: 'rack-inner',
    kind: 'rect',
    x: 400, y: 300,
    width: 256, height: 536,
    cornerRadius: 4,
    fill: 0x1f2937,
    stroke: 0x374151,
    strokeWidth: 1,
    zIndex: 1,
  },

  // ─── top bezel: brand panel + status LEDs ─────────────────────────────
  {
    id: 'rack-top-bezel',
    kind: 'rect',
    x: 400, y: 56,
    width: 240, height: 40,
    cornerRadius: 3,
    fill: 0x374151,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'rack-brand-label',
    kind: 'rect',
    x: 360, y: 56,
    width: 140, height: 16,
    cornerRadius: 2,
    fill: 0x0b1220,
    stroke: 0x4b5563,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'rack-led-power',
    kind: 'circle',
    x: 466, y: 56,
    r: 4,
    fill: 0x10b981,
    stroke: 0x064e3b,
    strokeWidth: 1,
    zIndex: 4,
  },
  {
    id: 'rack-led-link',
    kind: 'circle',
    x: 482, y: 56,
    r: 4,
    fill: 0x3b82f6,
    stroke: 0x1e3a8a,
    strokeWidth: 1,
    zIndex: 4,
  },
  {
    id: 'rack-led-alarm',
    kind: 'circle',
    x: 498, y: 56,
    r: 4,
    fill: 0xef4444,
    stroke: 0x7f1d1d,
    strokeWidth: 1,
    zIndex: 4,
  },

  // ─── server unit 1 (y=120) ────────────────────────────────────────────
  {
    id: 'unit-1-body',
    kind: 'rect',
    x: 400, y: 120,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-1-panel',
    kind: 'rect',
    x: 400, y: 120,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-1-vents',
    kind: 'path',
    x: 320, y: 120,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-1-led-pw',  kind: 'circle', x: 480, y: 114, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-1-led-act', kind: 'circle', x: 480, y: 126, r: 3, fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-1-led-net', kind: 'circle', x: 495, y: 114, r: 3, fill: 0x3b82f6, stroke: 0x1e3a8a, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-1-led-hdd', kind: 'circle', x: 495, y: 126, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },

  // ─── server unit 2 (y=180) ────────────────────────────────────────────
  {
    id: 'unit-2-body',
    kind: 'rect',
    x: 400, y: 180,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-2-panel',
    kind: 'rect',
    x: 400, y: 180,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-2-vents',
    kind: 'path',
    x: 320, y: 180,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-2-led-pw',  kind: 'circle', x: 480, y: 174, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-2-led-act', kind: 'circle', x: 480, y: 186, r: 3, fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-2-led-net', kind: 'circle', x: 495, y: 174, r: 3, fill: 0x3b82f6, stroke: 0x1e3a8a, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-2-led-hdd', kind: 'circle', x: 495, y: 186, r: 3, fill: 0xef4444, stroke: 0x7f1d1d, strokeWidth: 1, zIndex: 4 },

  // ─── server unit 3 (y=240) ────────────────────────────────────────────
  {
    id: 'unit-3-body',
    kind: 'rect',
    x: 400, y: 240,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-3-panel',
    kind: 'rect',
    x: 400, y: 240,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-3-vents',
    kind: 'path',
    x: 320, y: 240,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-3-led-pw',  kind: 'circle', x: 480, y: 234, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-3-led-act', kind: 'circle', x: 480, y: 246, r: 3, fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-3-led-net', kind: 'circle', x: 495, y: 234, r: 3, fill: 0x3b82f6, stroke: 0x1e3a8a, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-3-led-hdd', kind: 'circle', x: 495, y: 246, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },

  // ─── server unit 4 (y=300) ────────────────────────────────────────────
  {
    id: 'unit-4-body',
    kind: 'rect',
    x: 400, y: 300,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-4-panel',
    kind: 'rect',
    x: 400, y: 300,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-4-vents',
    kind: 'path',
    x: 320, y: 300,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-4-led-pw',  kind: 'circle', x: 480, y: 294, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-4-led-act', kind: 'circle', x: 480, y: 306, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-4-led-net', kind: 'circle', x: 495, y: 294, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-4-led-hdd', kind: 'circle', x: 495, y: 306, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },

  // ─── server unit 5 (y=360) ────────────────────────────────────────────
  {
    id: 'unit-5-body',
    kind: 'rect',
    x: 400, y: 360,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-5-panel',
    kind: 'rect',
    x: 400, y: 360,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-5-vents',
    kind: 'path',
    x: 320, y: 360,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-5-led-pw',  kind: 'circle', x: 480, y: 354, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-5-led-act', kind: 'circle', x: 480, y: 366, r: 3, fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-5-led-net', kind: 'circle', x: 495, y: 354, r: 3, fill: 0x3b82f6, stroke: 0x1e3a8a, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-5-led-hdd', kind: 'circle', x: 495, y: 366, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },

  // ─── server unit 6 (y=420) ────────────────────────────────────────────
  {
    id: 'unit-6-body',
    kind: 'rect',
    x: 400, y: 420,
    width: 240, height: 50,
    cornerRadius: 2,
    fill: 0x4b5563,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'unit-6-panel',
    kind: 'rect',
    x: 400, y: 420,
    width: 220, height: 32,
    cornerRadius: 1,
    fill: 0x1f2937,
    stroke: 0x0b1220,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'unit-6-vents',
    kind: 'path',
    x: 320, y: 420,
    commands: [
      { kind: 'moveTo', x: -28, y: -10 }, { kind: 'lineTo', x: 28, y: -10 },
      { kind: 'moveTo', x: -28, y:  -3 }, { kind: 'lineTo', x: 28, y:  -3 },
      { kind: 'moveTo', x: -28, y:   4 }, { kind: 'lineTo', x: 28, y:   4 },
      { kind: 'moveTo', x: -28, y:  11 }, { kind: 'lineTo', x: 28, y:  11 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 4,
  },
  { id: 'unit-6-led-pw',  kind: 'circle', x: 480, y: 414, r: 3, fill: 0x10b981, stroke: 0x064e3b, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-6-led-act', kind: 'circle', x: 480, y: 426, r: 3, fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-6-led-net', kind: 'circle', x: 495, y: 414, r: 3, fill: 0xef4444, stroke: 0x7f1d1d, strokeWidth: 1, zIndex: 4 },
  { id: 'unit-6-led-hdd', kind: 'circle', x: 495, y: 426, r: 3, fill: 0x6b7280, stroke: 0x111827, strokeWidth: 1, zIndex: 4 },

  // ─── PSU / base ───────────────────────────────────────────────────────
  {
    id: 'rack-psu',
    kind: 'rect',
    x: 400, y: 510,
    width: 240, height: 60,
    cornerRadius: 3,
    fill: 0x374151,
    stroke: 0x111827,
    strokeWidth: 1,
    zIndex: 2,
  },
  {
    id: 'rack-psu-vents',
    kind: 'path',
    x: 360, y: 510,
    commands: [
      { kind: 'moveTo', x: -50, y: -16 }, { kind: 'lineTo', x: 50, y: -16 },
      { kind: 'moveTo', x: -50, y:  -8 }, { kind: 'lineTo', x: 50, y:  -8 },
      { kind: 'moveTo', x: -50, y:   0 }, { kind: 'lineTo', x: 50, y:   0 },
      { kind: 'moveTo', x: -50, y:   8 }, { kind: 'lineTo', x: 50, y:   8 },
      { kind: 'moveTo', x: -50, y:  16 }, { kind: 'lineTo', x: 50, y:  16 },
    ],
    stroke: 0x6b7280,
    strokeWidth: 1,
    zIndex: 3,
  },
  {
    id: 'rack-power-button',
    kind: 'circle',
    x: 480, y: 510,
    r: 9,
    fill: 0x10b981,
    stroke: 0x064e3b,
    strokeWidth: 2,
    zIndex: 3,
  },
  {
    id: 'rack-power-button-inner',
    kind: 'circle',
    x: 480, y: 510,
    r: 3,
    fill: 0xd1fae5,
    stroke: 0x064e3b,
    strokeWidth: 1,
    zIndex: 4,
  },
];

export const ServerRack: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new GenericLayer({ id: 'server-rack', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of shapes) {
        layer.renderer.addShape(id, spec as never);
      }
    });

    return container;
  },
};
