import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { BaseShapeSpec, CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Shapes/Breathing' };
export default meta;
type Story = StoryObj;

export const Breathing: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-shape-breathing' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-shape-breathing')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-shape-breathing-layer', options: {} });
    canvas.layers.add(layer);

    for (const { id, spec } of SHAPES) {
      layer.renderer.addShape(id, spec as never);
    }
    canvas.camera.fitContent(layer.getBounds(), 100);

    const settings = { color: '#22d3ee', width: 2, alpha: 0.9, minPadding: 2, maxPadding: 18, periodMs: 1800, cornerRadius: 0 };

    function apply() {
      const style = {
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        minPadding: settings.minPadding,
        maxPadding: settings.maxPadding,
        periodMs: settings.periodMs,
        cornerRadius: settings.cornerRadius,
      };
      for (const { id } of SHAPES) {
        layer.renderer.setDecoration(id, 'breathing', { kind: 'breathing', style });
      }
      // Match the rect host's cornerRadius so the breathing outline reads as concentric.
      type RectPartial = BaseShapeSpec & { cornerRadius?: number };
      layer.renderer.updateShape<RectPartial>('rect', { cornerRadius: settings.cornerRadius });
    }

    apply();

    const gui = new GUI({ title: 'Breathing' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'width', 0, 10, 0.5).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(apply);
    gui.add(settings, 'minPadding', 0, 30, 1).onChange(apply);
    gui.add(settings, 'maxPadding', 5, 60, 1).onChange(apply);
    gui.add(settings, 'periodMs', 200, 5000, 100).onChange(apply);
    gui.add(settings, 'cornerRadius', 0, 35, 1).onChange(apply);
  },
};
