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
  title: 'Canvas/Renderer/Text',
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

// TextShape spec: kind='text', text=string, style=Partial<TextStyleOptions>.
// (x, y) is the anchor at the text center (anchor 0.5, 0.5 — set by the shape).
// style fields follow pixi TextStyleOptions: fill, fontSize, fontWeight, fontStyle, fontFamily, letterSpacing, align.
const texts = [
  {
    id: 'text-basic',
    kind: 'text',
    x: 320, y:  70,
    text: 'Basic text — fill + size only',
    style: { fill: 0x111827, fontSize: 16 },
  },
  {
    id: 'text-bold',
    kind: 'text',
    x: 320, y: 150,
    text: 'Bold text — fontWeight 700',
    style: { fill: 0x111827, fontSize: 20, fontWeight: '700' },
  },
  {
    id: 'text-colored',
    kind: 'text',
    x: 320, y: 230,
    text: 'Colored text — blue fill',
    style: { fill: 0x2563eb, fontSize: 18 },
  },
  {
    id: 'text-italic',
    kind: 'text',
    x: 320, y: 310,
    text: 'Italic text — fontStyle italic',
    style: { fill: 0x374151, fontSize: 18, fontStyle: 'italic' },
  },
  {
    id: 'text-mono',
    kind: 'text',
    x: 320, y: 390,
    text: 'Monospace small — fontFamily monospace, size 13',
    style: { fill: 0x6b7280, fontSize: 13, fontFamily: 'monospace' },
  },
  {
    id: 'text-heading',
    kind: 'text',
    x: 320, y: 470,
    text: 'Section Heading',
    style: { fill: 0x0f172a, fontSize: 28, fontWeight: '800', letterSpacing: 3 },
  },
  {
    id: 'text-muted',
    kind: 'text',
    x: 320, y: 550,
    text: 'Muted label — low alpha',
    style: { fill: 0x9ca3af, fontSize: 15 },
    alpha: 0.6,
  },
  {
    id: 'text-large-red',
    kind: 'text',
    x: 320, y: 630,
    text: 'Error state — large red bold',
    style: { fill: 0xef4444, fontSize: 22, fontWeight: '700' },
  },
];

export const Text: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new GenericLayer({ id: 'text', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of texts) {
        layer.renderer.addShape(id, spec as never);
      }
    });

    return container;
  },
};
