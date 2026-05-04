import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Polygon' };
export default meta;
type Story = StoryObj;

const toHex = (s: string) => parseInt(s.slice(1), 16);

// Pointy-top hexagon at radius r.
const hexPoints = (r: number) => [
  { x: 0, y: -r }, { x: r * 0.866, y: -r * 0.5 },
  { x: r * 0.866, y:  r * 0.5 }, { x: 0, y:  r },
  { x: -r * 0.866, y: r * 0.5 }, { x: -r * 0.866, y: -r * 0.5 },
];

export const Polygon: Story = {
  render: () => createContainer({ id: 'cvs-polygon' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-polygon')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'polygon-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('polygon-gfx');

    const settings = { radius: 55, fillColor: '#4f9cf9', fillAlpha: 0.2, strokeColor: '#1e3a8a', strokeWidth: 3 };

    function redraw() {
      g.clear();
      draw.drawPolygon(g, {
        kind: 'polygon', x: 0, y: 0,
        points: hexPoints(settings.radius),
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Polygon (hexagon)' });
    gui.add(settings, 'radius', 10, 150, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
