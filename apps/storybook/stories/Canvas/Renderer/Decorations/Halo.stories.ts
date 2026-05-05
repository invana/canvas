import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import GUI from 'lil-gui';
import { RendererLayer } from '../../../_shared/GenericLayer';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Halo' };
export default meta;
type Story = StoryObj;

export const Halo: Story = {
  render: () => createContainer({ id: 'cvs-deco-halo' }),

  play: async ({ canvasElement }) => {
    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const HEX_POINTS = [
      { x: 0, y: -50 }, { x: 43.3, y: -25 }, { x: 43.3, y: 25 },
      { x: 0, y: 50 }, { x: -43.3, y: 25 }, { x: -43.3, y: -25 },
    ];
    const ARROW_COMMANDS = [
      { kind: 'moveTo' as const, x: -30, y: -20 },
      { kind: 'lineTo' as const, x: 10, y: -20 },
      { kind: 'lineTo' as const, x: 32, y: 0 },
      { kind: 'lineTo' as const, x: 10, y: 20 },
      { kind: 'lineTo' as const, x: -30, y: 20 },
      { kind: 'lineTo' as const, x: -12, y: 0 },
      { kind: 'close' as const },
    ];
    const SHAPES = [
      { id: 'circle',  spec: { kind: 'circle'  as const, x: -280, y: 0, r: 45, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 } },
      { id: 'rect',    spec: { kind: 'rect'    as const, x: -140, y: 0, width: 110, height: 70, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 } },
      { id: 'ellipse', spec: { kind: 'ellipse' as const, x: 0,    y: 0, rx: 65, ry: 35, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 } },
      { id: 'polygon', spec: { kind: 'polygon' as const, x: 140,  y: 0, points: HEX_POINTS, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 } },
      { id: 'path',    spec: { kind: 'path'    as const, x: 280,  y: 0, commands: ARROW_COMMANDS, fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-halo')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RendererLayer({ id: 'deco-halo', options: {} });
    canvas.layers.add(layer);

    for (const { id, spec } of SHAPES) {
      layer.renderer.addShape(id, spec as never);
    }
    canvas.camera.fitContent(layer.getBounds(), 100);

    const settings = { color: '#f59e0b', alpha: 0.4, padding: 8 };

    function apply() {
      const style = { color: toHex(settings.color), alpha: settings.alpha, padding: settings.padding };
      for (const { id } of SHAPES) {
        layer.renderer.setDecoration(id, 'halo', { kind: 'halo', style });
      }
    }

    apply();

    const gui = new GUI({ title: 'Halo' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(apply);
    gui.add(settings, 'padding', 0, 40, 1).onChange(apply);
  },
};
