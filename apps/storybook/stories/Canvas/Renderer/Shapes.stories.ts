import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Shapes' };
export default meta;
type Story = StoryObj;

export const Shapes: Story = {
  render: () => createContainer({ id: 'cvs-shapes' }),

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
    const KINDS = ['circle', 'rect', 'ellipse', 'polygon', 'path'] as const;
    type ShapeKind = typeof KINDS[number];
    const HEX_POINTS = [
      { x:  0,    y: -55 }, { x:  47.6, y: -27.5 },
      { x:  47.6, y:  27.5 }, { x:  0, y:  55 },
      { x: -47.6, y:  27.5 }, { x: -47.6, y: -27.5 },
    ];
    const ARROW_COMMANDS = [
      { kind: 'moveTo' as const, x: -30, y: -20 },
      { kind: 'lineTo' as const, x:  10, y: -20 },
      { kind: 'lineTo' as const, x:  32, y:   0 },
      { kind: 'lineTo' as const, x:  10, y:  20 },
      { kind: 'lineTo' as const, x: -30, y:  20 },
      { kind: 'lineTo' as const, x: -12, y:   0 },
      { kind: 'close'  as const },
    ];

    function specFor(kind: ShapeKind, fill: number, stroke: number, strokeWidth: number) {
      const base = { x: 0, y: 0, fill, stroke, strokeWidth };
      switch (kind) {
        case 'circle':  return { kind, ...base, r: 55 };
        case 'rect':    return { kind, ...base, width: 120, height: 80, cornerRadius: 10 };
        case 'ellipse': return { kind, ...base, rx: 70, ry: 40 };
        case 'polygon': return { kind, ...base, points: HEX_POINTS };
        case 'path':    return { kind, ...base, commands: ARROW_COMMANDS };
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-shapes')!;

    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'shapes', options: {} });
    canvas.layers.add(layer);

    const settings = { kind: 'circle' as ShapeKind, fillColor: '#4f9cf9', strokeColor: '#1e3a8a', strokeWidth: 2 };

    layer.renderer.addShape('s', specFor(settings.kind, toHex(settings.fillColor), toHex(settings.strokeColor), settings.strokeWidth) as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeShape('s');
      layer.renderer.addShape('s', specFor(settings.kind, toHex(settings.fillColor), toHex(settings.strokeColor), settings.strokeWidth) as never);
    }

    const gui = new GUI({ title: 'Shape' });
    gui.add(settings, 'kind', [...KINDS]).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
