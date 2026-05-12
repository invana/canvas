import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Halo' };
export default meta;
type Story = StoryObj;

/**
 * Same `GlowDecoration` applied to a circle, a rect, and a rounded rect.
 * Visual proof that decorations don't branch on shape kind — the same code
 * path produces a coherent halo around any silhouette.
 */
export const Halo: Story = {
  render: () => createContainer({ id: 'cvs-prim-halo' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-halo')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'halo', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('circle-host', {
      kind: 'circle', x: -180, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });

    layer.renderer.addShape('rect-host', {
      kind: 'rect', x: -50, y: -40, width: 100, height: 80,
      fill: { kind: 'solid', color: 0x10b981 },
    });

    layer.renderer.addShape('rounded-host', {
      kind: 'rect', x: 110, y: -40, width: 100, height: 80, cornerRadius: 18,
      fill: { kind: 'solid', color: 0xfacc15 },
    });

    // Same glow style applied to all three — three different silhouettes.
    const glowStyle = { color: 0xfb923c, radius: 18, layers: 8, innerAlpha: 0.55 };
    layer.renderer.setDecoration('circle-host', 'glow', { kind: 'glow', style: glowStyle });
    layer.renderer.setDecoration('rect-host', 'glow', { kind: 'glow', style: glowStyle });
    layer.renderer.setDecoration('rounded-host', 'glow', { kind: 'glow', style: glowStyle });

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
