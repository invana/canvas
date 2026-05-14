import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext, RectSpec, ShapeLabelPlacement } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/Label/Containment' };
export default meta;
type Story = StoryObj;

/**
 * The `inside-*` placement family carries a *containment contract* — the
 * label must stay inside the host shape's inner box. The decoration enforces
 * this via a three-step cascade:
 *
 *   1. **Shrink** — binary-search the largest `fontSize ∈ [minFontSize, configured]`
 *      that fits both axes.
 *   2. **Truncate** — at `minFontSize`, ellipsis-truncate by line count
 *      derived from the inner box height.
 *   3. **Hide** — if it still doesn't fit, set alpha to 0.
 *
 * Walk the cascade interactively: enlarge the text, shrink the shape, lift
 * `minFontSize`. Watch the label shrink, then truncate, then vanish. Compare
 * with `center` (anchor-only — no containment, will spill freely).
 */
export const Containment: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-containment' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-containment')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-containment', options: {} });
    canvas.layers.add(layer);

    // Two hosts side-by-side: same label, different placement. Left uses
    // `inside-center` (constrained); right uses `center` (free to overflow).
    // The visual diff makes the contract obvious.
    const HOST_W = 200;
    const HOST_H = 100;
    layer.renderer.addShape('constrained', {
      kind: 'rect', x: -260, y: -HOST_H / 2, width: HOST_W, height: HOST_H, cornerRadius: 10,
      fill: { kind: 'solid', color: 0xf1f5f9 }, stroke: { color: 0x475569, width: 1 },
    });
    layer.renderer.addShape('free', {
      kind: 'rect', x:  60, y: -HOST_H / 2, width: HOST_W, height: HOST_H, cornerRadius: 10,
      fill: { kind: 'solid', color: 0xfef3c7 }, stroke: { color: 0xb45309, width: 1 },
    });

    // Caption labels above each host to make the contract obvious at a glance.
    layer.renderer.addShape('cap-constrained', {
      kind: 'rect', x: -260, y: -HOST_H / 2 - 32, width: HOST_W, height: 20,
      fill: { kind: 'solid', color: 0xffffff, alpha: 0 }, stroke: { color: 0xffffff, width: 0 },
    });
    layer.renderer.setDecoration('cap-constrained', 'label', {
      kind: 'label',
      style: {
        content: { kind: 'text', text: 'placement: inside-center  (constrained)', fontSize: 11, fontWeight: 600, fill: 0x475569 },
        placement: 'center',
      },
    });
    layer.renderer.addShape('cap-free', {
      kind: 'rect', x: 60, y: -HOST_H / 2 - 32, width: HOST_W, height: 20,
      fill: { kind: 'solid', color: 0xffffff, alpha: 0 }, stroke: { color: 0xffffff, width: 0 },
    });
    layer.renderer.setDecoration('cap-free', 'label', {
      kind: 'label',
      style: {
        content: { kind: 'text', text: 'placement: center  (anchor-only, may overflow)', fontSize: 11, fontWeight: 600, fill: 0xb45309 },
        placement: 'center',
      },
    });

    const PRESETS = {
      short: 'Hi',
      medium: 'Server A',
      long: 'A very long descriptive label that will not fit naturally inside the shape',
    } as const;

    const settings: {
      text: string;
      preset: keyof typeof PRESETS;
      fontSize: number;
      fontWeight: number;
      minFontSize: number;
      shapeWidth: number;
      shapeHeight: number;
    } = {
      text: PRESETS.long,
      preset: 'long',
      fontSize: 18,
      fontWeight: 600,
      minFontSize: 9,
      shapeWidth: HOST_W,
      shapeHeight: HOST_H,
    };

    const apply = (): void => {
      const widths = settings.shapeWidth;
      const heights = settings.shapeHeight;
      layer.renderer.updateShape<RectSpec>('constrained', { x: -260, y: -heights / 2, width: widths, height: heights });
      layer.renderer.updateShape<RectSpec>('free',        { x:  60, y: -heights / 2, width: widths, height: heights });
      const content = {
        kind: 'text' as const,
        text: settings.text,
        fontSize: settings.fontSize,
        fontWeight: settings.fontWeight,
        fill: 0x0f172a,
      };
      layer.renderer.setDecoration('constrained', 'label', {
        kind: 'label',
        style: {
          content,
          placement: 'inside-center' satisfies ShapeLabelPlacement,
          minFontSize: settings.minFontSize,
        },
      });
      layer.renderer.setDecoration('free', 'label', {
        kind: 'label',
        style: { content, placement: 'center' satisfies ShapeLabelPlacement },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 120);

    const gui = new GUI({ title: 'Containment cascade' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'preset', Object.keys(PRESETS)).onChange((k: keyof typeof PRESETS) => {
      settings.text = PRESETS[k];
      apply();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    });
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontSize', 8, 40, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700 }).onChange(apply);
    gui.add(settings, 'minFontSize', 6, 20, 1).name('minFontSize (floor)').onChange(apply);
    const shape = gui.addFolder('host size');
    shape.add(settings, 'shapeWidth', 40, 320, 5).name('width').onChange(apply);
    shape.add(settings, 'shapeHeight', 20, 220, 5).name('height').onChange(apply);
  },
};
