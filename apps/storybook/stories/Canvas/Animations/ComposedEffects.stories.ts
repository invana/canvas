import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Animations/ComposedEffects' };
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
  render: () => createContainer({ id: 'cvs-animations-composed' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-animations-composed')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'composed', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e3a8a, width: 2 },
    });

    const settings = {
      shake: true,
      breathing: true,
      animatedGlow: true,
      pulseRing: true,
    };

    const applyShake = () => {
      layer.renderer.setEffect('host', 'shake',
        settings.shake ? { kind: 'shake', style: { amplitude: 3 } } : null);
    };
    const applyBreathing = () => {
      layer.renderer.setEffect('host', 'breathing',
        settings.breathing
          ? { kind: 'breathing', style: { amplitude: 0.08, periodMs: 1800 } }
          : null);
    };
    const applyGlow = () => {
      layer.renderer.setDecoration('host', 'glow',
        settings.animatedGlow
          ? {
              kind: 'glow',
              style: {
                color: 0xfb923c, radius: 20, layers: 8, innerAlpha: 0.6,
                pulse: { periodMs: 1200, amplitude: 0.5 },
              },
            }
          : null);
    };
    const applyPulseRing = () => {
      layer.renderer.setDecoration('host', 'pulse-ring',
        settings.pulseRing
          ? {
              kind: 'pulse-ring',
              style: { color: 0xfb923c, maxRadius: 36, periodMs: 1600, rings: 2 },
            }
          : null);
    };
    applyShake();
    applyBreathing();
    applyGlow();
    applyPulseRing();

    const gui = new GUI({ title: 'Composed effects' });
    gui.add(settings, 'shake').onChange(applyShake);
    gui.add(settings, 'breathing').onChange(applyBreathing);
    gui.add(settings, 'animatedGlow').onChange(applyGlow);
    gui.add(settings, 'pulseRing').onChange(applyPulseRing);

    canvas.camera.fitContent(layer.getBounds(), 200);
  },
};
