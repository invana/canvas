import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, DragShapeBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Connectors/Label/Background' };
export default meta;
type Story = StoryObj;

/**
 * The optional `LabelBackground` pill for a connector-anchored label. Same
 * fields as the shape-label background, but rendered behind text that may
 * be auto-rotated to follow the path tangent — the pill rotates with the
 * text (drawn inside the label's container before the rotation transform).
 *
 * Bg pills are particularly useful on connectors: they punch out the
 * underlying path stroke so the text reads cleanly without the line
 * cutting through the glyphs.
 */
export const Background: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-bg' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-bg')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-bg', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Diagonal endpoints + bezier so the pill sits over a curved path —
    // makes the "punch out the stroke" effect obvious.
    layer.renderer.addShape('src', { kind: 'circle', x: -260, y: -60, radius: 20, fill: { kind: 'solid', color: 0x4f9cf9 } });
    layer.renderer.addShape('tgt', { kind: 'circle', x:  260, y:  60, radius: 20, fill: { kind: 'solid', color: 0x10b981 } });
    layer.renderer.addConnector('edge', {
      kind: 'connector',
      router: 'straight', pathStyle: 'bezier',
      pathStyleOpts: { axis: 'h', tension: 0.5 },
      source: { kind: 'shape', shapeId: 'src', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'tgt', anchor: 'boundary' },
      stroke: { color: 0xcbd5e1, width: 2 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 })
    });

    const settings = {
      text: 'flows-to',
      fontSize: 13,
      fill: 0x0f172a,
      bgFill: 0xffffff,
      bgFillAlpha: 1,
      bgStroke: 0xcbd5e1,
      bgStrokeAlpha: 1,
      bgStrokeWidth: 1,
      bgRadius: 4,
      paddingV: 2,
      paddingH: 6,
      shadowEnabled: false,
      shadowColor: 0x000000,
      shadowBlur: 3,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      shadowAlpha: 0.25
    };

    const apply = (): void => {
      layer.renderer.setDecoration('edge', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: settings.text, fontSize: settings.fontSize, fontWeight: 600, fill: settings.fill },
          background: {
            fill: settings.bgFill,
            fillAlpha: settings.bgFillAlpha,
            stroke: settings.bgStroke,
            strokeAlpha: settings.bgStrokeAlpha,
            strokeWidth: settings.bgStrokeWidth,
            radius: settings.bgRadius,
            padding: [settings.paddingV, settings.paddingH],
            ...(settings.shadowEnabled ? {
              shadow: {
                color: settings.shadowColor,
                blur: settings.shadowBlur,
                offsetX: settings.shadowOffsetX,
                offsetY: settings.shadowOffsetY,
                alpha: settings.shadowAlpha
              }
            } : {})
          },
          placement: 'center'
        }
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 160);

    const gui = new GUI({ title: 'Background' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontSize', 8, 28, 1).onChange(apply);
    gui.addColor(settings, 'fill').name('text fill').onChange(apply);
    const pill = gui.addFolder('pill');
    pill.addColor(settings, 'bgFill').name('fill').onChange(apply);
    pill.add(settings, 'bgFillAlpha', 0, 1, 0.05).name('fillAlpha').onChange(apply);
    pill.addColor(settings, 'bgStroke').name('stroke').onChange(apply);
    pill.add(settings, 'bgStrokeAlpha', 0, 1, 0.05).name('strokeAlpha').onChange(apply);
    pill.add(settings, 'bgStrokeWidth', 0, 6, 0.5).name('strokeWidth').onChange(apply);
    pill.add(settings, 'bgRadius', 0, 24, 1).name('radius').onChange(apply);
    pill.add(settings, 'paddingV', 0, 16, 1).name('padding (v)').onChange(apply);
    pill.add(settings, 'paddingH', 0, 24, 1).name('padding (h)').onChange(apply);
    const sh = gui.addFolder('shadow');
    sh.add(settings, 'shadowEnabled').name('enabled').onChange(apply);
    sh.addColor(settings, 'shadowColor').name('color').onChange(apply);
    sh.add(settings, 'shadowBlur', 0, 20, 1).name('blur').onChange(apply);
    sh.add(settings, 'shadowOffsetX', -10, 10, 1).name('offsetX').onChange(apply);
    sh.add(settings, 'shadowOffsetY', -10, 10, 1).name('offsetY').onChange(apply);
    sh.add(settings, 'shadowAlpha', 0, 1, 0.05).name('alpha').onChange(apply);
  }
};
