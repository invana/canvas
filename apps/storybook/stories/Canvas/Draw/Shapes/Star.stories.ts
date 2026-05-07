import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Shapes/Star' };
export default meta;
type Story = StoryObj;

export const Star: Story = {
  render: () => createContainer({ id: 'cvs-star' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-star')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'star-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('star-gfx');

    const settings = {
      points: 5,
      outerRadius: 80,
      innerRadius: 35,
      cornerRadius: 0,
      rotation: 0,
      fillColor: '#facc15',
      fillAlpha: 1,
      strokeColor: '#854d0e',
      strokeWidth: 3,
    };

    function redraw() {
      g.clear();
      draw.drawStar(g, {
        kind: 'star', x: 0, y: 0,
        points: settings.points,
        outerRadius: settings.outerRadius,
        innerRadius: settings.innerRadius,
        cornerRadius: settings.cornerRadius,
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      }, 0, 0, settings.rotation * Math.PI / 180);
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Star' });
    gui.add(settings, 'points', 3, 12, 1).onChange(redraw);
    gui.add(settings, 'outerRadius', 20, 150, 1).onChange(redraw);
    gui.add(settings, 'innerRadius', 5, 150, 1).onChange(redraw);
    gui.add(settings, 'cornerRadius', 0, 40, 1).onChange(redraw);
    gui.add(settings, 'rotation', -180, 180, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 15, 1).onChange(redraw);
  },
};
