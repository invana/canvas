import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext, ShapeLabelPlacement } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/Label' };
export default meta;
type Story = StoryObj;

/**
 * `LabelDecoration` on a shape host — exhaustive grid of every supported
 * `placement` value (13 in total: 8 outside sides, 4 inside corners, plus
 * inside-centre). Toggle the background pill, edit text, switch font weight,
 * and tweak wrap / maxLines / ellipsis from the lil-gui panel.
 *
 * Demonstrates that one decoration covers every node-label position graph
 * tools typically expose, including the "centred-inside" case that the
 * legacy inset `kind: 'text'` fill layer used to handle.
 */
export const Label: Story = {
  render: () => createContainer({ id: 'cvs-prim-label' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label', options: {} });
    canvas.layers.add(layer);

    // 13 hosts, one per placement, laid out as a 5x3 grid (with the last
    // cell empty so the visual layout reads naturally — top row outside,
    // middle row sides + centre, etc.).
    const hosts = [
      { id: 'h0',  x: -260, y: -180, placement: 'top-left'              as ShapeLabelPlacement },
      { id: 'h1',  x:    0, y: -180, placement: 'top'                   as ShapeLabelPlacement },
      { id: 'h2',  x:  260, y: -180, placement: 'top-right'             as ShapeLabelPlacement },
      { id: 'h3',  x: -260, y:    0, placement: 'left'                  as ShapeLabelPlacement },
      { id: 'h4',  x:    0, y:    0, placement: 'center'                as ShapeLabelPlacement },
      { id: 'h5',  x:  260, y:    0, placement: 'right'                 as ShapeLabelPlacement },
      { id: 'h6',  x: -260, y:  180, placement: 'bottom-left'           as ShapeLabelPlacement },
      { id: 'h7',  x:    0, y:  180, placement: 'bottom'                as ShapeLabelPlacement },
      { id: 'h8',  x:  260, y:  180, placement: 'bottom-right'          as ShapeLabelPlacement },
      { id: 'h9',  x: -130, y:  340, placement: 'inside-top-left'       as ShapeLabelPlacement },
      { id: 'h10', x:    0, y:  340, placement: 'inside-top-right'      as ShapeLabelPlacement },
      { id: 'h11', x:  130, y:  340, placement: 'inside-bottom-left'    as ShapeLabelPlacement },
      { id: 'h12', x:  260, y:  340, placement: 'inside-bottom-right'   as ShapeLabelPlacement },
    ];

    for (const h of hosts) {
      // Use a rect for inside-corner hosts (so the corner anchor is sharp)
      // and a circle for the 9 main placements (proves the math is shape-
      // kind-agnostic).
      const isCorner = h.placement.startsWith('inside-');
      if (isCorner) {
        layer.renderer.addShape(h.id, {
          kind: 'rect', x: h.x - 60, y: h.y - 36, width: 120, height: 72, cornerRadius: 6,
          fill: { kind: 'solid', color: 0xeaf3ff }, stroke: { color: 0x4f9cf9, width: 1 },
        });
      } else {
        layer.renderer.addShape(h.id, {
          kind: 'circle', x: h.x, y: h.y, radius: 36,
          fill: { kind: 'solid', color: 0x4f9cf9 }, stroke: { color: 0x1d4ed8, width: 1 },
        });
      }
    }

    const settings = {
      text: 'Server A',
      fontSize: 13,
      fontWeight: 600,
      fill: 0x0f172a,
      background: true,
      bgFill: 0xffffff,
      bgStroke: 0xcbd5e1,
      bgRadius: 6,
      padding: 6,
      maxWidth: 0,
      maxLines: 1,
      offsetY: 4,
      offsetX: 0,
    };

    const apply = (): void => {
      for (const h of hosts) {
        const wrap = settings.maxWidth > 0
          ? { maxWidth: settings.maxWidth, maxLines: settings.maxLines, wordWrap: true, overflow: 'ellipsis' as const }
          : settings.maxLines > 1
            ? { maxLines: settings.maxLines, overflow: 'ellipsis' as const }
            : undefined;
        layer.renderer.setDecoration(h.id, 'label', {
          kind: 'label',
          style: {
            content: {
              kind: 'text',
              text: settings.text,
              fontSize: settings.fontSize,
              fontWeight: settings.fontWeight,
              fill: settings.fill,
            },
            background: settings.background ? {
              fill: settings.bgFill,
              stroke: settings.bgStroke,
              strokeWidth: 1,
              radius: settings.bgRadius,
              padding: settings.padding,
            } : undefined,
            wrap,
            placement: h.placement,
            offset: { x: settings.offsetX, y: settings.offsetY },
          },
        });
      }
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Label' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontSize', 8, 28, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700 }).onChange(apply);
    gui.addColor(settings, 'fill').onChange(apply);
    const off = gui.addFolder('offset');
    off.add(settings, 'offsetX', -30, 30, 1).onChange(apply);
    off.add(settings, 'offsetY', -30, 30, 1).onChange(apply);
    const bg = gui.addFolder('background');
    bg.add(settings, 'background').onChange(apply);
    bg.addColor(settings, 'bgFill').name('fill').onChange(apply);
    bg.addColor(settings, 'bgStroke').name('stroke').onChange(apply);
    bg.add(settings, 'bgRadius', 0, 24, 1).name('radius').onChange(apply);
    bg.add(settings, 'padding', 0, 24, 1).onChange(apply);
    const wr = gui.addFolder('wrap');
    wr.add(settings, 'maxWidth', 0, 240, 10).name('maxWidth (0=off)').onChange(apply);
    wr.add(settings, 'maxLines', 1, 4, 1).onChange(apply);
  },
};
