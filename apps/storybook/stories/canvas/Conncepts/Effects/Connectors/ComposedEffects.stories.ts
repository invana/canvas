import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  arrowMarkerSpec,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Effects/Connectors/ComposedEffects' };
export default meta;
type Story = StoryObj;

/**
 * Connector-side counterpart to `Canvas/Effects/Shapes/ComposedEffects`.
 * One style-effect (`breathing-connector`, alpha modulation) and two
 * animated decorations (`marching-ants-connector`, `flow-particles-connector`)
 * are attached to the *same* two connectors — straight + bezier — to show
 * that effect/decoration composition works uniformly across path styles.
 *
 * The renderer aggregates the breathing effect onto each connector's alpha
 * channel while the two decorations animate independently on top. Toggle
 * each slot to confirm removal cleanly restores the baseline (alpha back to
 * 1, ants gone, particles gone).
 */
export const ComposedEffectsStory: Story = {
  name: 'ComposedEffects',
  render: () => createContainer({ id: 'cvs-effects-composed-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effects-composed-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'composed-connector', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle', x: -180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x4f9cf9 }
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x10b981 }
    });
    layer.renderer.addShape('c', {
      kind: 'circle', x: -180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xfb923c }
    });
    layer.renderer.addShape('d', {
      kind: 'circle', x: 180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xa78bfa }
    });

    layer.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 })
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 })
    });

    const connectorIds = ['a-to-b', 'c-to-d'] as const;

    const settings = {
      breathing: true,
      marchingAnts: true,
      flowParticles: true
    };

    const applyBreathing = () => {
      const spec = settings.breathing
        ? { kind: 'breathing-connector' as const, style: { amplitude: 0.6, periodMs: 1800 } }
        : null;
      for (const id of connectorIds) layer.renderer.setEffect(id, 'breathing', spec);
    };
    const applyMarchingAnts = () => {
      const spec = settings.marchingAnts
        ? {
            kind: 'marching-ants-connector' as const,
            style: {
              color: 0x111827,
              strokeWidth: 2,
              dashLength: 6,
              gapLength: 4,
              speedPxPerSec: 36,
              alpha: 1
            }
          }
        : null;
      for (const id of connectorIds) layer.renderer.setDecoration(id, 'marching-ants', spec);
    };
    const applyFlowParticles = () => {
      const spec = settings.flowParticles
        ? {
            kind: 'flow-particles-connector' as const,
            style: {
              color: 0x111827,
              markerKind: 'circle' as const,
              count: 6,
              size: 7,
              speedPxPerSec: 60,
              loop: true,
              phase: 0,
              orientToPath: false,
              alpha: 1
            }
          }
        : null;
      for (const id of connectorIds) layer.renderer.setDecoration(id, 'flow-particles', spec);
    };

    applyBreathing();
    applyMarchingAnts();
    applyFlowParticles();

    const gui = new GUI({ title: 'Composed effects (connector)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'breathing').onChange(applyBreathing);
    gui.add(settings, 'marchingAnts').onChange(applyMarchingAnts);
    gui.add(settings, 'flowParticles').onChange(applyFlowParticles);

    canvas.camera.fitContent(layer.getBounds(), 100);
  }
};
