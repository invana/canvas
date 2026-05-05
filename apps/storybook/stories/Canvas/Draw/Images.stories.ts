import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, TextureRegistry, WheelZoomBehaviour, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw' };
export default meta;
type Story = StoryObj;

export const ImageFill: Story = {
  render: () => createContainer({ id: 'cvs-draw-img' }),

  play: async ({ canvasElement }) => {
    const IMAGE_URL = 'https://picsum.photos/seed/invana-a/400/240.jpg';
    const FITS = ['fill', 'cover', 'none', 'scale-down'] as const;
    type FillFit = typeof FITS[number];
    const toHex = (s: string) => parseInt(s.slice(1), 16);

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-draw-img')!;

    const registry = new TextureRegistry();
    await registry.preload([IMAGE_URL]);
    const tex = registry.get(IMAGE_URL)!;

    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'img-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('img-gfx');

    const settings = { shape: 'circle' as 'circle' | 'rect', fillFit: 'cover' as FillFit, radius: 80, strokeWidth: 3, strokeColor: '#6366f1' };

    function redraw() {
      g.clear();
      if (settings.shape === 'circle') {
        draw.drawCircle(g, {
          kind: 'circle', x: 0, y: 0, r: settings.radius,
          fill: tex, fillFit: settings.fillFit,
          stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
        });
      } else {
        draw.drawRect(g, {
          kind: 'rect', x: 0, y: 0, width: settings.radius * 2, height: settings.radius * 2,
          cornerRadius: 12,
          fill: tex, fillFit: settings.fillFit,
          stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
        });
      }
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Image fill' });
    gui.add(settings, 'shape', ['circle', 'rect']).onChange(redraw);
    gui.add(settings, 'fillFit', [...FITS]).onChange(redraw);
    gui.add(settings, 'radius', 30, 150, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 15, 1).onChange(redraw);
  },
};
