import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Shapes/Path' };
export default meta;
type Story = StoryObj;

export const Path: Story = {
  render: () => createContainer({ id: 'cvs-path' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const chevronCommands = (size: number) => [
      { kind: 'moveTo' as const, x: -size * 0.9, y: -size },
      { kind: 'lineTo' as const, x:  size * 0.2,  y: -size },
      { kind: 'lineTo' as const, x:  size,         y: 0    },
      { kind: 'lineTo' as const, x:  size * 0.2,  y:  size },
      { kind: 'lineTo' as const, x: -size * 0.9,  y:  size },
      { kind: 'lineTo' as const, x: -size * 0.1,  y: 0     },
      { kind: 'close'  as const },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-path')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'path-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('path-gfx');

    const settings = { size: 45, fillColor: '#4f9cf9', fillAlpha: 0.25, strokeColor: '#1e3a8a', strokeWidth: 2 };

    function redraw() {
      g.clear();
      draw.drawPath(g, {
        kind: 'path', x: 0, y: 0,
        commands: chevronCommands(settings.size),
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Path (chevron)' });
    gui.add(settings, 'size', 10, 150, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
