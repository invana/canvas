import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Concepts/Shapes/Arc' };
export default meta;
type Story = StoryObj;

export const Arc: Story = {
  render: () => createContainer({ id: 'cvs-prim-arc' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState(): object {
        return {};
      }
      protected onMount(ctx: CanvasContext): void {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest(): null {
        return null;
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-arc')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'arc', options: {} });
    canvas.layers.add(layer);

    // ── Two arcs side-by-side ────────────────────────────────────────────
    // Left: annular sector (typical sunburst cell). Right: pie slice
    // (innerR = 0). Both update live from the GUI so the angle / radius
    // controls show what each parameter does in isolation.
    const settings = {
      innerR: 50,
      outerR: 110,
      startAngle: -Math.PI / 2,    // 12 o'clock
      endAngle: Math.PI / 4,       // ~1:30 — ~135° sweep
      fill: 0x3b82f6,
      stroke: 0xffffff,
      strokeWidth: 2,
    };

    const redraw = (): void => {
      // Annular sector on the left.
      layer.renderer.addShape('sector', {
        kind: 'arc',
        x: -150,
        y: 0,
        innerR: settings.innerR,
        outerR: settings.outerR,
        startAngle: settings.startAngle,
        endAngle: settings.endAngle,
        fill: settings.fill,
        stroke: { color: settings.stroke, width: settings.strokeWidth },
      });
      // Pie slice on the right (innerR forced to 0) — same other params so
      // you can see the contribution of the inner-radius cutout.
      layer.renderer.addShape('slice', {
        kind: 'arc',
        x: 150,
        y: 0,
        innerR: 0,
        outerR: settings.outerR,
        startAngle: settings.startAngle,
        endAngle: settings.endAngle,
        fill: 0x10b981,
        stroke: { color: settings.stroke, width: settings.strokeWidth },
      });
      canvas.camera.fitContent(layer.getBounds(), 60);
    };

    layer.renderer.addShape('sector', {
      kind: 'arc',
      x: -150,
      y: 0,
      innerR: settings.innerR,
      outerR: settings.outerR,
      startAngle: settings.startAngle,
      endAngle: settings.endAngle,
      fill: settings.fill,
      stroke: { color: settings.stroke, width: settings.strokeWidth },
    });
    layer.renderer.addShape('slice', {
      kind: 'arc',
      x: 150,
      y: 0,
      innerR: 0,
      outerR: settings.outerR,
      startAngle: settings.startAngle,
      endAngle: settings.endAngle,
      fill: 0x10b981,
      stroke: { color: settings.stroke, width: settings.strokeWidth },
    });
    canvas.camera.fitContent(layer.getBounds(), 60);

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Arc' });
    onStoryTeardown(() => gui.destroy());

    const geometry = gui.addFolder('Geometry');
    geometry.add(settings, 'innerR', 0, 100, 1).onChange(() => {
      // The slice on the right always uses innerR = 0; only the sector
      // reacts. Both update through `redraw` so the camera re-fits to the
      // new combined bounds.
      layer.renderer.removeShape('sector');
      layer.renderer.removeShape('slice');
      redraw();
    });
    geometry.add(settings, 'outerR', 30, 200, 1).onChange(() => {
      layer.renderer.removeShape('sector');
      layer.renderer.removeShape('slice');
      redraw();
    });
    geometry
      .add(settings, 'startAngle', -Math.PI, Math.PI, 0.01)
      .name('startAngle (rad)')
      .onChange(() => {
        layer.renderer.removeShape('sector');
        layer.renderer.removeShape('slice');
        redraw();
      });
    geometry
      .add(settings, 'endAngle', -Math.PI, 3 * Math.PI, 0.01)
      .name('endAngle (rad)')
      .onChange(() => {
        layer.renderer.removeShape('sector');
        layer.renderer.removeShape('slice');
        redraw();
      });

    const style = gui.addFolder('Style');
    style.addColor(settings, 'fill').onChange(() => {
      layer.renderer.removeShape('sector');
      layer.renderer.removeShape('slice');
      redraw();
    });
    style.addColor(settings, 'stroke').onChange(() => {
      layer.renderer.removeShape('sector');
      layer.renderer.removeShape('slice');
      redraw();
    });
    style.add(settings, 'strokeWidth', 0, 8, 0.5).onChange(() => {
      layer.renderer.removeShape('sector');
      layer.renderer.removeShape('slice');
      redraw();
    });
  },
};
