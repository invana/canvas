import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/Label/Typography' };
export default meta;
type Story = StoryObj;

/**
 * Every typographic field of the `kind: 'text'` variant of `LabelContent`:
 * font family, size, weight, style, variant, letter spacing, line height,
 * fill, stroke, and drop shadow. Plus `align` for multi-line layout.
 *
 * Uses a multi-line label by default so `align` and `lineHeight` produce
 * visible differences. Switch the alignment dropdown to see how text shifts
 * within the wrap box.
 */
export const Typography: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-typo' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-typo')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-typo', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 28,
      fill: { kind: 'solid', color: 0x4f9cf9 }, stroke: { color: 0x1d4ed8, width: 1 },
    });

    const settings = {
      text: 'The quick brown fox\njumps over the\nlazy dog',
      fontFamily: 'sans-serif',
      fontSize: 18,
      fontWeight: 600,
      fontStyle: 'normal' as 'normal' | 'italic',
      fontVariant: 'normal' as 'normal' | 'small-caps',
      letterSpacing: 0,
      lineHeight: 0,
      fill: 0x0f172a,
      align: 'center' as 'left' | 'center' | 'right',
      // stroke
      strokeEnabled: false,
      strokeColor: 0xffffff,
      strokeWidth: 2,
      // shadow
      shadowEnabled: false,
      shadowColor: 0x000000,
      shadowBlur: 3,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowAlpha: 0.4,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('host', 'label', {
        kind: 'label',
        style: {
          content: {
            kind: 'text',
            text: settings.text,
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            fontWeight: settings.fontWeight,
            fontStyle: settings.fontStyle,
            fontVariant: settings.fontVariant,
            letterSpacing: settings.letterSpacing,
            ...(settings.lineHeight > 0 ? { lineHeight: settings.lineHeight } : {}),
            fill: settings.fill,
            align: settings.align,
            ...(settings.strokeEnabled
              ? { stroke: { color: settings.strokeColor, width: settings.strokeWidth } }
              : {}),
            ...(settings.shadowEnabled
              ? {
                  shadow: {
                    color: settings.shadowColor,
                    blur: settings.shadowBlur,
                    offsetX: settings.shadowOffsetX,
                    offsetY: settings.shadowOffsetY,
                    alpha: settings.shadowAlpha,
                  },
                }
              : {}),
          },
          wrap: { wordWrap: true, maxWidth: 280 },
          placement: 'bottom',
          offset: { y: 12 },
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 200);

    const gui = new GUI({ title: 'Typography' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontFamily', ['sans-serif', 'serif', 'monospace', 'system-ui']).onChange(apply);
    gui.add(settings, 'fontSize', 8, 48, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700, black: 900 }).onChange(apply);
    gui.add(settings, 'fontStyle', ['normal', 'italic']).onChange(apply);
    gui.add(settings, 'fontVariant', ['normal', 'small-caps']).onChange(apply);
    gui.add(settings, 'letterSpacing', -2, 12, 0.5).onChange(apply);
    gui.add(settings, 'lineHeight', 0, 60, 1).name('lineHeight (0=auto)').onChange(apply);
    gui.addColor(settings, 'fill').onChange(apply);
    gui.add(settings, 'align', ['left', 'center', 'right']).onChange(apply);
    const st = gui.addFolder('stroke');
    st.add(settings, 'strokeEnabled').name('enabled').onChange(apply);
    st.addColor(settings, 'strokeColor').name('color').onChange(apply);
    st.add(settings, 'strokeWidth', 0, 8, 0.5).name('width').onChange(apply);
    const sh = gui.addFolder('shadow');
    sh.add(settings, 'shadowEnabled').name('enabled').onChange(apply);
    sh.addColor(settings, 'shadowColor').name('color').onChange(apply);
    sh.add(settings, 'shadowBlur', 0, 20, 1).name('blur').onChange(apply);
    sh.add(settings, 'shadowOffsetX', -10, 10, 1).name('offsetX').onChange(apply);
    sh.add(settings, 'shadowOffsetY', -10, 10, 1).name('offsetY').onChange(apply);
    sh.add(settings, 'shadowAlpha', 0, 1, 0.05).name('alpha').onChange(apply);
  },
};
