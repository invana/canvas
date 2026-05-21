import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/Label/Typography' };
export default meta;
type Story = StoryObj;

/**
 * Every typographic field of the `kind: 'text'` variant of `LabelContent`
 * exercised on a connector-anchored label: family, size, weight, style,
 * variant, letter-spacing, line-height, fill, stroke, drop shadow, align.
 *
 * Connector labels and shape labels share the same `LabelContent` type —
 * this story exists so you can preview rich typography in its connector
 * context (autoRotate is on by default so you can see how stroke / shadow
 * read on rotated text).
 */
export const Typography: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-typo' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-typo')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-typo', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Diagonal endpoints + bezier so the rotated typography is visible
    // against a non-axis-aligned baseline.
    layer.renderer.addShape('src', { kind: 'circle', x: -260, y: 80, radius: 20, fill: { kind: 'solid', color: 0x4f9cf9 } });
    layer.renderer.addShape('tgt', { kind: 'circle', x:  260, y: -80, radius: 20, fill: { kind: 'solid', color: 0x10b981 } });
    layer.renderer.addConnector('edge', {
      kind: 'connector',
      router: 'straight', pathStyle: 'bezier',
      pathStyleOpts: { axis: 'h', tension: 0.5 },
      source: { kind: 'shape', shapeId: 'src', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'tgt', anchor: 'boundary' },
      stroke: { color: 0xcbd5e1, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
    });

    const settings = {
      text: 'connects-to',
      fontFamily: 'sans-serif',
      fontSize: 16,
      fontWeight: 600,
      fontStyle: 'normal' as 'normal' | 'italic',
      fontVariant: 'normal' as 'normal' | 'small-caps',
      letterSpacing: 0,
      lineHeight: 0,
      fill: 0x0f172a,
      align: 'center' as 'left' | 'center' | 'right',
      autoRotate: true,
      // stroke
      strokeEnabled: false,
      strokeColor: 0xffffff,
      strokeWidth: 2,
      // shadow
      shadowEnabled: false,
      shadowColor: 0x000000,
      shadowBlur: 3,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      shadowAlpha: 0.35,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('edge', 'label', {
        kind: 'label-connector',
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
            ...(settings.strokeEnabled ? { stroke: { color: settings.strokeColor, width: settings.strokeWidth } } : {}),
            ...(settings.shadowEnabled
              ? { shadow: { color: settings.shadowColor, blur: settings.shadowBlur, offsetX: settings.shadowOffsetX, offsetY: settings.shadowOffsetY, alpha: settings.shadowAlpha } }
              : {}),
          },
          placement: 'center',
          autoRotate: settings.autoRotate,
          offset: { y: -10 },
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 140);

    const gui = new GUI({ title: 'Typography' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontFamily', ['sans-serif', 'serif', 'monospace', 'system-ui']).onChange(apply);
    gui.add(settings, 'fontSize', 8, 36, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, semibold: 600, bold: 700, black: 900 }).onChange(apply);
    gui.add(settings, 'fontStyle', ['normal', 'italic']).onChange(apply);
    gui.add(settings, 'fontVariant', ['normal', 'small-caps']).onChange(apply);
    gui.add(settings, 'letterSpacing', -2, 12, 0.5).onChange(apply);
    gui.add(settings, 'lineHeight', 0, 60, 1).name('lineHeight (0=auto)').onChange(apply);
    gui.addColor(settings, 'fill').onChange(apply);
    gui.add(settings, 'align', ['left', 'center', 'right']).onChange(apply);
    gui.add(settings, 'autoRotate').onChange(apply);
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
