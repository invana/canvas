import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Label/Background' };
export default meta;
type Story = StoryObj;

/**
 * The optional `LabelBackground` pill that sits behind the label text. Every
 * field of the background spec is exposed: fill / fill alpha, stroke / stroke
 * alpha / stroke width, uniform or per-corner radius, uniform or
 * 4-tuple padding, and an optional drop shadow.
 *
 * The pill is drawn inside the label's `Container` (behind the text), so it
 * inherits the same placement, offset, and rotation as the text itself.
 */
export const Background: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-bg' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-bg')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-bg', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 36,
      fill: { kind: 'solid', color: 0x4f9cf9 }, stroke: { color: 0x1d4ed8, width: 1 }
    });

    const settings = {
      text: 'users-service',
      fontSize: 14,
      fill: 0x0f172a,
      // background
      bgFill: 0xffffff,
      bgFillAlpha: 1,
      bgStroke: 0xcbd5e1,
      bgStrokeAlpha: 1,
      bgStrokeWidth: 1,
      bgRadius: 6,
      paddingV: 4,
      paddingH: 10,
      // shadow
      shadowEnabled: false,
      shadowColor: 0x000000,
      shadowBlur: 4,
      shadowOffsetX: 0,
      shadowOffsetY: 2,
      shadowAlpha: 0.25
    };

    const apply = (): void => {
      layer.renderer.setDecoration('host', 'label', {
        kind: 'label',
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
          placement: 'bottom',
          offset: { y: 10 }
        }
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 180);

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
    pill.add(settings, 'paddingV', 0, 24, 1).name('padding (v)').onChange(apply);
    pill.add(settings, 'paddingH', 0, 32, 1).name('padding (h)').onChange(apply);
    const shadow = gui.addFolder('shadow');
    shadow.add(settings, 'shadowEnabled').name('enabled').onChange(apply);
    shadow.addColor(settings, 'shadowColor').name('color').onChange(apply);
    shadow.add(settings, 'shadowBlur', 0, 20, 1).name('blur').onChange(apply);
    shadow.add(settings, 'shadowOffsetX', -10, 10, 1).name('offsetX').onChange(apply);
    shadow.add(settings, 'shadowOffsetY', -10, 10, 1).name('offsetY').onChange(apply);
    shadow.add(settings, 'shadowAlpha', 0, 1, 0.05).name('alpha').onChange(apply);
  }
};
