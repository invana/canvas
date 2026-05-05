import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Text' };
export default meta;
type Story = StoryObj;

export const Text: Story = {
  render: () => createContainer({ id: 'cvs-text' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: ShapesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new ShapesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-text')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'text', options: {} });
    canvas.layers.add(layer);

    const settings = {
      text: 'Hello Canvas',
      fontSize: 24,
      fillColor: '#111827',
      fontWeight: '400' as '400' | '700' | '800',
      fontStyle: 'normal' as 'normal' | 'italic',
      letterSpacing: 0,
    };

    layer.renderer.addShape('t', {
      kind: 'text', x: 0, y: 0,
      text: settings.text,
      style: {
        fill: toHex(settings.fillColor),
        fontSize: settings.fontSize,
        fontWeight: settings.fontWeight,
        fontStyle: settings.fontStyle,
        letterSpacing: settings.letterSpacing,
      },
    } as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.updateShape('t', {
        text: settings.text,
        style: {
          fill: toHex(settings.fillColor),
          fontSize: settings.fontSize,
          fontWeight: settings.fontWeight,
          fontStyle: settings.fontStyle,
          letterSpacing: settings.letterSpacing,
        },
      } as never);
    }

    const gui = new GUI({ title: 'Text' });
    gui.add(settings, 'text').onChange(redraw);
    gui.add(settings, 'fontSize', 8, 72, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fontWeight', ['400', '700', '800']).onChange(redraw);
    gui.add(settings, 'fontStyle', ['normal', 'italic']).onChange(redraw);
    gui.add(settings, 'letterSpacing', 0, 20, 1).onChange(redraw);
  },
};
