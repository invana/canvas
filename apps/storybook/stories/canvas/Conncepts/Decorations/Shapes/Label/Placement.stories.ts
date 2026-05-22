import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext, ShapeLabelPlacement } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Label/Placement' };
export default meta;
type Story = StoryObj;

/**
 * Exhaustive grid of every `ShapeLabelPlacement` value (18 total). Top block
 * is the 9 anchor-only placements (`center` + 8 outside sides / corners) on
 * circle hosts; bottom block is the 9 inside placements (`inside-center` +
 * inside sides + inside corners) on rect hosts so the containment is visible.
 *
 * `'center'` and `'inside-center'` share the same anchor but differ in
 * semantics: `center` may overflow the shape, `inside-center` is constrained
 * to fit inside it. See the `Containment` story for the fit cascade.
 */
export const Placement: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-placement' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-placement')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-placement', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Top block: 9 anchor-only placements on circle hosts arranged in a 3×3
    // grid. Order matches the visual position the placement names suggest.
    const TOP_GROUP: Array<{ col: number; row: number; placement: ShapeLabelPlacement }> = [
      { col: 0, row: 0, placement: 'top-left' },
      { col: 1, row: 0, placement: 'top' },
      { col: 2, row: 0, placement: 'top-right' },
      { col: 0, row: 1, placement: 'left' },
      { col: 1, row: 1, placement: 'center' },
      { col: 2, row: 1, placement: 'right' },
      { col: 0, row: 2, placement: 'bottom-left' },
      { col: 1, row: 2, placement: 'bottom' },
      { col: 2, row: 2, placement: 'bottom-right' },
    ];
    // Bottom block: 9 inside placements on rect hosts in another 3×3 grid.
    const BOTTOM_GROUP: Array<{ col: number; row: number; placement: ShapeLabelPlacement }> = [
      { col: 0, row: 0, placement: 'inside-top-left' },
      { col: 1, row: 0, placement: 'inside-top' },
      { col: 2, row: 0, placement: 'inside-top-right' },
      { col: 0, row: 1, placement: 'inside-left' },
      { col: 1, row: 1, placement: 'inside-center' },
      { col: 2, row: 1, placement: 'inside-right' },
      { col: 0, row: 2, placement: 'inside-bottom-left' },
      { col: 1, row: 2, placement: 'inside-bottom' },
      { col: 2, row: 2, placement: 'inside-bottom-right' },
    ];

    const CELL = 220;
    const TOP_Y = -360;
    const BOT_Y = 360;

    for (const cell of TOP_GROUP) {
      const id = `top-${cell.placement}`;
      layer.renderer.addShape(id, {
        kind: 'circle',
        x: (cell.col - 1) * CELL,
        y: TOP_Y + (cell.row - 1) * CELL,
        radius: 32,
        fill: { kind: 'solid', color: 0x4f9cf9 },
        stroke: { color: 0x1d4ed8, width: 1 },
      });
    }
    for (const cell of BOTTOM_GROUP) {
      const id = `bot-${cell.placement}`;
      layer.renderer.addShape(id, {
        kind: 'rect',
        x: (cell.col - 1) * CELL - 70,
        y: BOT_Y + (cell.row - 1) * CELL - 40,
        width: 140,
        height: 80,
        cornerRadius: 8,
        fill: { kind: 'solid', color: 0xf1f5f9 },
        stroke: { color: 0x475569, width: 1 },
      });
    }

    const settings = {
      text: 'placement',
      fontSize: 13,
      fontWeight: 600,
      background: true,
      offset: 4,
    };

    const apply = (): void => {
      const allCells = [
        ...TOP_GROUP.map((c) => ({ id: `top-${c.placement}`, placement: c.placement })),
        ...BOTTOM_GROUP.map((c) => ({ id: `bot-${c.placement}`, placement: c.placement })),
      ];
      for (const { id, placement } of allCells) {
        const isOutsideTop = placement.startsWith('top');
        const isOutsideBottom = placement.startsWith('bottom') && !placement.startsWith('bottom-');
        layer.renderer.setDecoration(id, 'label', {
          kind: 'label',
          style: {
            content: {
              kind: 'text',
              text: placement,
              fontSize: settings.fontSize,
              fontWeight: settings.fontWeight,
              fill: 0x0f172a,
            },
            background: settings.background ? {
              fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6],
            } : undefined,
            placement,
            // Push outside-top labels up a touch, outside-bottom down, so they
            // don't kiss the shape edge. Inside placements ignore offset since
            // the fit cascade keeps them inside the bounds anyway.
            offset: isOutsideTop
              ? { y: -settings.offset }
              : isOutsideBottom
                ? { y: settings.offset }
                : undefined,
          },
        });
      }
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Placement' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(() => {
      // Re-apply with text override per cell — placement label takes priority
      // over a global text edit unless the user types into the field. Simpler
      // contract: typing here overrides every cell to the same string.
      const override = settings.text;
      const allCells = [
        ...TOP_GROUP.map((c) => ({ id: `top-${c.placement}`, placement: c.placement })),
        ...BOTTOM_GROUP.map((c) => ({ id: `bot-${c.placement}`, placement: c.placement })),
      ];
      for (const { id, placement } of allCells) {
        layer.renderer.setDecoration(id, 'label', {
          kind: 'label',
          style: {
            content: { kind: 'text', text: override, fontSize: settings.fontSize, fontWeight: settings.fontWeight, fill: 0x0f172a },
            background: settings.background ? { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6] } : undefined,
            placement,
          },
        });
      }
    });
    gui.add(settings, 'fontSize', 8, 24, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700 }).onChange(apply);
    gui.add(settings, 'background').onChange(apply);
    gui.add(settings, 'offset', 0, 20, 1).name('outside offset').onChange(apply);
  },
};
