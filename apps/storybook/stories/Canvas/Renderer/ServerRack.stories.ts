import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Shapes' };
export default meta;
type Story = StoryObj;

const toHex = (s: string) => parseInt(s.slice(1), 16);

// A single server unit — chassis + front panel + 2 status LEDs.
// Demonstrates composing multiple shape primitives into one logical component.
export const ServerRack: Story = {
  render: () => createContainer({ id: 'cvs-server-rack' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-server-rack')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'server-rack', options: {} });
    canvas.layers.add(layer);

    const settings = { chassisColor: '#1f2937', panelColor: '#4b5563', ledColor: '#10b981', unitHeight: 50 };

    function addShapes() {
      layer.renderer.addShape('chassis', {
        kind: 'rect', x: 300, y: 150,
        width: 260, height: settings.unitHeight + 10,
        cornerRadius: 4, fill: toHex(settings.chassisColor), stroke: 0x000000, strokeWidth: 2,
      } as never);

      layer.renderer.addShape('panel', {
        kind: 'rect', x: 300, y: 150,
        width: 240, height: settings.unitHeight - 6,
        cornerRadius: 2, fill: toHex(settings.panelColor), stroke: 0x111827, strokeWidth: 1,
      } as never);

      layer.renderer.addShape('led-power', {
        kind: 'circle', x: 390, y: 144, r: 4,
        fill: toHex(settings.ledColor), stroke: 0x064e3b, strokeWidth: 1,
      } as never);

      layer.renderer.addShape('led-activity', {
        kind: 'circle', x: 390, y: 156, r: 4,
        fill: 0xf59e0b, stroke: 0x78350f, strokeWidth: 1,
      } as never);
    }

    function removeShapes() {
      for (const id of ['chassis', 'panel', 'led-power', 'led-activity']) {
        layer.renderer.removeShape(id);
      }
    }

    addShapes();

    function redraw() {
      removeShapes();
      addShapes();
    }

    const gui = new GUI({ title: 'Server unit' });
    gui.addColor(settings, 'chassisColor').onChange(redraw);
    gui.addColor(settings, 'panelColor').onChange(redraw);
    gui.addColor(settings, 'ledColor').onChange(redraw);
    gui.add(settings, 'unitHeight', 30, 100, 1).onChange(redraw);
  },
};
