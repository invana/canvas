import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, TextureRegistry, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Images' };
export default meta;
type Story = StoryObj;

export const Images: Story = {
  render: () => createContainer({ id: 'cvs-renderer-images' }),

  play: async ({ canvasElement }) => {
    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const IMAGE_URL = 'https://picsum.photos/seed/invana-a/400/240.jpg';
    const FITS = ['fill', 'cover', 'none', 'scale-down'] as const;
    type FillFit = typeof FITS[number];

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-images')!;

    const registry = new TextureRegistry();
    await registry.preload([IMAGE_URL]);

    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'img-layer', options: { textureRegistry: registry } });
    canvas.layers.add(layer);

    const settings = {
      shape: 'image-circle' as 'image-circle' | 'image-rect',
      fillFit: 'cover' as FillFit,
      size: 120,
      strokeColor: '#6366f1',
      strokeWidth: 4,
    };

    function buildSpec() {
      const stroke = toHex(settings.strokeColor);
      if (settings.shape === 'image-circle') {
        return { kind: 'image-circle', url: IMAGE_URL, x: 0, y: 0, r: settings.size / 2, fillFit: settings.fillFit, stroke, strokeWidth: settings.strokeWidth };
      }
      return { kind: 'image-rect', url: IMAGE_URL, x: 0, y: 0, width: settings.size, height: settings.size, cornerRadius: 16, fillFit: settings.fillFit, stroke, strokeWidth: settings.strokeWidth };
    }

    layer.renderer.addShape('img', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeShape('img');
      layer.renderer.addShape('img', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Image shape' });
    gui.add(settings, 'shape', ['image-circle', 'image-rect']).onChange(redraw);
    gui.add(settings, 'fillFit', [...FITS]).onChange(redraw);
    gui.add(settings, 'size', 40, 300, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 15, 1).onChange(redraw);
  },
};
