import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { BadgePlacement, CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Shapes/Badges' };
export default meta;
type Story = StoryObj;

/**
 * Reproduces the reference design: a circular host with three badges around
 * it — a small gray "A" glyph half-overhanging the top-right, a red
 * "Important" text label flush right, and a yellow "Notice" text label
 * bottom-right (the third one carries a glow decoration).
 *
 * Demonstrates the three building blocks of the badge system:
 *
 * 1. Any shape kind as a plate (circle for the "A", rect with cornerRadius
 *    for the text labels).
 * 2. Any fill layer as content (`glyph` for single-char icons, `text` for
 *    multi-character labels — both layered on a `solid` background).
 * 3. The `origin: 'center'` override for half-overhanging placement; default
 *    placement (omitted) puts the badge fully outside the host edge.
 *
 * The lil-gui panel lets you switch each badge's placement / origin live and
 * drag the host around to verify badges re-anchor.
 */
export const Badges: Story = {
  render: () => createContainer({ id: 'cvs-prim-badges-reproduce' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-badges-reproduce')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest() { return null; }
    }
    const layer = new RenderLayer({ id: 'badges', options: {} });
    canvas.layers.add(layer);

    const HOST_ID = 'host';
    layer.renderer.addShape(HOST_ID, {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 60,
      fill: [{ kind: 'solid', color: 0x4a90e2 }],
    });

    const settings = {
      statusPlacement: 'top-right' as BadgePlacement,
      statusOrigin: 'center' as 'center' | 'default',
      priorityPlacement: 'right' as BadgePlacement,
      priorityOrigin: 'default' as 'center' | 'default',
      flagPlacement: 'bottom-right' as BadgePlacement,
      flagOrigin: 'default' as 'center' | 'default',
      hostX: 0,
      hostY: 0,
    };

    const apply = () => {
      // Status: small circular gray plate with a single glyph (half-overhanging)
      layer.renderer.setBadge(HOST_ID, 'badge:status', {
        shape: {
          kind: 'circle',
          radius: 14,
          fill: [
            { kind: 'solid', color: 0x9aa0a6 },
            { kind: 'glyph', char: 'A', fontFamily: 'sans-serif', fontWeight: 700, color: 0xffffff, sizeRatio: 0.55 },
          ],
        },
        placement: settings.statusPlacement,
        origin: settings.statusOrigin === 'center' ? 'center' : undefined,
      });

      // Priority: rounded-rect plate with multi-char text label (fully outside)
      layer.renderer.setBadge(HOST_ID, 'badge:priority', {
        shape: {
          kind: 'rect',
          width: 100,
          height: 30,
          cornerRadius: 15,
          fill: [
            { kind: 'solid', color: 0xe5654a },
            { kind: 'text', text: 'Important', color: 0xffffff, fontSize: 13, fontWeight: 600 },
          ],
        },
        placement: settings.priorityPlacement,
        origin: settings.priorityOrigin === 'center' ? 'center' : undefined,
        offsetX: settings.priorityPlacement === 'right' ? 8 : 0,
      });

      // Flag: yellow rounded-rect with text + a glow decoration on the badge
      layer.renderer.setBadge(HOST_ID, 'badge:flag', {
        shape: {
          kind: 'rect',
          width: 80,
          height: 30,
          cornerRadius: 15,
          fill: [
            { kind: 'solid', color: 0xf2c14e },
            { kind: 'text', text: 'Notice', color: 0xffffff, fontSize: 13, fontWeight: 600 },
          ],
        },
        placement: settings.flagPlacement,
        origin: settings.flagOrigin === 'center' ? 'center' : undefined,
        offsetX: 8,
        offsetY: 8,
        decorations: {
          glow: { kind: 'glow', style: { color: 0xf2c14e, radius: 14, layers: 6, innerAlpha: 0.6 } },
        },
      });
    };

    apply();
    canvas.camera.fitContent(layer.getBounds(), 120);

    const placements: BadgePlacement[] = [
      'top', 'bottom', 'left', 'right',
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
    ];
    const origins = ['default', 'center'] as const;

    const gui = new GUI({ title: 'Badges' });

    const status = gui.addFolder('Status (gray "A")');
    status.add(settings, 'statusPlacement', placements).onChange(apply);
    status.add(settings, 'statusOrigin', origins).onChange(apply);

    const priority = gui.addFolder('Priority ("Important")');
    priority.add(settings, 'priorityPlacement', placements).onChange(apply);
    priority.add(settings, 'priorityOrigin', origins).onChange(apply);

    const flag = gui.addFolder('Flag ("Notice" + glow)');
    flag.add(settings, 'flagPlacement', placements).onChange(apply);
    flag.add(settings, 'flagOrigin', origins).onChange(apply);

    const host = gui.addFolder('Drag host (re-anchors badges)');
    host.add(settings, 'hostX', -200, 200, 1).onChange((v: number) => {
      layer.renderer.updateShape(HOST_ID, { x: v });
    });
    host.add(settings, 'hostY', -200, 200, 1).onChange((v: number) => {
      layer.renderer.updateShape(HOST_ID, { y: v });
    });
  },
};
