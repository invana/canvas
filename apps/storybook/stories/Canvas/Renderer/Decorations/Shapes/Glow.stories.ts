import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Shapes/Glow' };
export default meta;
type Story = StoryObj;

export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-shape-glow' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-shape-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-shape-glow-layer', options: {} });
    canvas.layers.add(layer);

    for (const { id, spec } of SHAPES) {
      layer.renderer.addShape(id, spec as never);
    }
    canvas.camera.fitContent(layer.getBounds(), 100);

    const settings = { color: '#38bdf8', padding: 12, alpha: 0.6, blur: 8 };

    function apply() {
      const style = {
        color: toHex(settings.color),
        padding: settings.padding,
        alpha: settings.alpha,
        blur: settings.blur,
      };
      for (const { id } of SHAPES) {
        layer.renderer.setDecoration(id, 'glow', { kind: 'glow', style });
      }
    }

    apply();

    const gui = new GUI({ title: 'Glow' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'padding', 0, 40, 1).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(apply);
    gui.add(settings, 'blur', 0, 30, 1).onChange(apply);
  },
};
