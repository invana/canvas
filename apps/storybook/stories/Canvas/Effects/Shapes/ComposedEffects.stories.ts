import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Effects/Shapes/ComposedEffects' };
export default meta;
type Story = StoryObj;

/**
 * Architecture proof: shake + breathing + animated-glow + pulse-ring all
 * attached to the same shape. The renderer aggregates transform deltas
 * (shake's dx/dy summed with breathing's sx/sy at the bounds-centre
 * pivot) and animates two independent decorations on top — none of
 * them know about each other.
 *
 * Use the toggles to add / remove each individually and confirm that
 * removing an effect cleanly reverts its contribution (no stuck jitter,
 * no stuck scale).
 */
export const ComposedEffects: Story = {
  render: () => createContainer({ id: 'cvs-effects-composed' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effects-composed')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'composed', options: {} });
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
      shake: true,
      breathing: true,
      animatedGlow: true,
      pulseRing: true,
    };

    const applyShake = () => {
      const spec = settings.shake ? { kind: 'shake' as const, style: { amplitude: 3 } } : null;
      for (const id of hostIds) layer.renderer.setEffect(id, 'shake', spec);
    };
    const applyBreathing = () => {
      const spec = settings.breathing
        ? { kind: 'breathing' as const, style: { amplitude: 0.08, periodMs: 1800 } }
        : null;
      for (const id of hostIds) layer.renderer.setEffect(id, 'breathing', spec);
    };
    const applyGlow = () => {
      const spec = settings.animatedGlow
        ? {
            kind: 'glow' as const,
            style: {
              color: 0xfb923c, strokeWidth: 20, layers: 8, innerAlpha: 0.6,
              pulse: { periodMs: 1200, amplitude: 0.5 },
            },
          }
        : null;
      for (const id of hostIds) layer.renderer.setDecoration(id, 'glow', spec);
    };
    const applyPulseRing = () => {
      const spec = settings.pulseRing
        ? {
            kind: 'pulse-ring' as const,
            style: { color: 0xfb923c, maxRadius: 36, periodMs: 1600, rings: 2 },
          }
        : null;
      for (const id of hostIds) layer.renderer.setDecoration(id, 'pulse-ring', spec);
    };
    applyShake();
    applyBreathing();
    applyGlow();
    applyPulseRing();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const gui = new GUI({ title: 'Composed effects' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.add(settings, 'shake').onChange(applyShake);
    gui.add(settings, 'breathing').onChange(applyBreathing);
    gui.add(settings, 'animatedGlow').onChange(applyGlow);
    gui.add(settings, 'pulseRing').onChange(applyPulseRing);

    canvas.camera.fitContent(layer.getBounds(), 200);
  },
};
