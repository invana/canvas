import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Text' };
export default meta;
type Story = StoryObj;

const toHex = (s: string) => parseInt(s.slice(1), 16);

export const Text: Story = {
  render: () => createContainer({ id: 'cvs-text' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-text')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'text', options: {} });
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
