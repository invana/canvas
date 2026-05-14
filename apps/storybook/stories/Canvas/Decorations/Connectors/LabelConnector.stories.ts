import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext, ConnectorLabelPlacement } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/LabelConnector' };
export default meta;
type Story = StoryObj;

/**
 * `LabelConnectorDecoration` on a grid of every built-in connector
 * (router + pathStyle) pair — straight, bezier, smooth, rounded, orth,
 * manhattan, bump-radial. The same label spec is attached to each; visual
 * proof that `autoRotate` and `pathOffset` work uniformly across path kinds.
 *
 * Tweak `placement`, `pathOffset`, `autoRotate`, `keepUpright`, and screen-
 * space offset from the lil-gui panel to see live behaviour.
 */
export const LabelConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-label-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-label-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-connector', options: {} });
    canvas.layers.add(layer);

    // 6 endpoint pairs spread vertically; each pair gets a distinct
    // router + pathStyle combination.
    const variants = [
      { id: 'straight',  router: 'straight', pathStyle: 'normal'      },
      { id: 'bezier',    router: 'straight', pathStyle: 'bezier'      },
      { id: 'smooth',    router: 'orth',     pathStyle: 'smooth'      },
      { id: 'rounded',   router: 'orth',     pathStyle: 'rounded'     },
      { id: 'orth',      router: 'orth',     pathStyle: 'normal'      },
      { id: 'manhattan', router: 'manhattan',pathStyle: 'normal'      },
    ];

    let y = -260;
    for (const v of variants) {
      layer.renderer.addShape(`${v.id}-src`, {
        kind: 'circle', x: -240, y, radius: 18,
        fill: { kind: 'solid', color: 0x4f9cf9 },
      });
      layer.renderer.addShape(`${v.id}-tgt`, {
        kind: 'circle', x: 240, y, radius: 18,
        fill: { kind: 'solid', color: 0x10b981 },
      });
      layer.renderer.addConnector(v.id, {
        kind: 'connector',
        router: v.router,
        pathStyle: v.pathStyle,
        source: { kind: 'shape', shapeId: `${v.id}-src`, anchor: 'boundary' },
        target: { kind: 'shape', shapeId: `${v.id}-tgt`, anchor: 'boundary' },
        stroke: { color: 0xcbd5e1, width: 1.5 },
        targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
        // Label-readable path style: bezier needs a curve.
        ...(v.pathStyle === 'bezier' ? { pathStyleOpts: { axis: 'h', tension: 0.6 } } : {}),
      });
      // Small label tagging the variant for visual cross-reference.
      layer.renderer.addShape(`${v.id}-tag`, {
        kind: 'rect', x: -360, y: y - 8, width: 100, height: 16,
      });
      layer.renderer.setDecoration(`${v.id}-tag`, 'label', {
        kind: 'label',
        style: {
          content: { kind: 'text', text: v.id, fontSize: 11, fontWeight: 600, fill: 0x475569 },
          placement: 'center',
        },
      });
      y += 92;
    }

    const settings = {
      text: 'connects-to',
      placement: 'center' as ConnectorLabelPlacement,
      pathOffset: 0,
      autoRotate: true,
      keepUpright: true,
      offsetX: 0,
      offsetY: -8,
      background: true,
      bgFill: 0xffffff,
      bgStroke: 0xe2e8f0,
    };

    const apply = (): void => {
      for (const v of variants) {
        layer.renderer.setDecoration(v.id, 'label', {
          kind: 'label-connector',
          style: {
            content: {
              kind: 'text', text: settings.text, fontSize: 11, fontWeight: 500, fill: 0x0f172a,
            },
            background: settings.background ? {
              fill: settings.bgFill,
              stroke: settings.bgStroke,
              strokeWidth: 1,
              radius: 4,
              padding: [2, 6],
            } : undefined,
            placement: settings.placement,
            pathOffset: settings.pathOffset,
            autoRotate: settings.autoRotate,
            keepUpright: settings.keepUpright,
            offset: { x: settings.offsetX, y: settings.offsetY },
          },
        });
      }
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Connector Label' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'placement', { start: 'start', center: 'center', end: 'end', '0.25': 0.25, '0.75': 0.75 } as Record<string, ConnectorLabelPlacement>).onChange(apply);
    gui.add(settings, 'pathOffset', -80, 80, 2).onChange(apply);
    gui.add(settings, 'autoRotate').onChange(apply);
    gui.add(settings, 'keepUpright').onChange(apply);
    const off = gui.addFolder('offset (post-rotation)');
    off.add(settings, 'offsetX', -30, 30, 1).onChange(apply);
    off.add(settings, 'offsetY', -30, 30, 1).onChange(apply);
    const bg = gui.addFolder('background');
    bg.add(settings, 'background').onChange(apply);
    bg.addColor(settings, 'bgFill').name('fill').onChange(apply);
    bg.addColor(settings, 'bgStroke').name('stroke').onChange(apply);
  },
};
