import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/Glow' };
export default meta;
type Story = StoryObj;

/**
 * Same `GlowDecoration` applied to a circle, a rect, and a rounded rect.
 * Visual proof that decorations don't branch on shape kind — the same code
 * path produces a coherent glow around any silhouette. The lil-gui panel
 * exposes every field of `GlowDecorationStyle`, including the optional
 * `pulse` animation.
 */
export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-prim-glow' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-glow')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'glow', options: {} });
    canvas.layers.add(layer);

    const hosts = [
      { id: 'circle',   spec: { kind: 'circle' as const,
          x: -220, y: -110, radius: 50,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'rect',     spec: { kind: 'rect' as const,
          x: -55,  y: -155, width: 110, height: 90, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'triangle', spec: { kind: 'regular-polygon' as const,
          x: 220, y: -110, sides: 3, radius: 60,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'hexagon',  spec: { kind: 'regular-polygon' as const,
          x: -220, y: 110, sides: 6, radius: 55, rotation: Math.PI / 6,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'star',     spec: { kind: 'star' as const,
          x: 0, y: 110, points: 5, outerRadius: 60, innerRadius: 25,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'chevron',  spec: { kind: 'polygon' as const, x: 220, y: 110,
          vertices: [
            { x: -60, y: -35 }, { x:  25, y: -35 }, { x:  60, y: 0 },
            { x:  25, y:  35 }, { x: -60, y:  35 }, { x: -25, y: 0 },
          ],
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
    ];
    for (const h of hosts) layer.renderer.addShape(h.id, h.spec);
    const hostIds = hosts.map((h) => h.id);

    const settings = {
      fillColor: 0x4f9cf9,
      color: 0xfb923c,
      strokeWidth: 40,
      layers: 8,
      innerAlpha: 0.55,
      pulseEnabled: true,
      periodMs: 1200,
      amplitude: 0.5,
    };

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const apply = () => {
      const style = {
        color: settings.color,
        strokeWidth: settings.strokeWidth,
        layers: settings.layers,
        innerAlpha: settings.innerAlpha,
        ...(settings.pulseEnabled
          ? { pulse: { periodMs: settings.periodMs, amplitude: settings.amplitude } }
          : {}),
      };
      for (const id of hostIds) {
        layer.renderer.setDecoration(id, 'glow', { kind: 'glow', style });
      }
    };
    apply();

    const gui = new GUI({ title: 'Glow' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'strokeWidth', 2, 60, 1).onChange(apply);
    gui.add(settings, 'layers', 1, 16, 1).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);
    const pulse = gui.addFolder('pulse');
    pulse.add(settings, 'pulseEnabled').name('enabled').onChange(apply);
    pulse.add(settings, 'periodMs', 200, 4000, 100).onChange(apply);
    pulse.add(settings, 'amplitude', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 150);
  },
};
