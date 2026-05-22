import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Behaviours/Camera/WheelZoomBehaviour' };
export default meta;
type Story = StoryObj;

export const WheelZoom: Story = {
  render: () => createContainer({ id: 'cvs-behaviour-wheel-zoom' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-behaviour-wheel-zoom')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() {
        return {};
      }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest() {
        return null;
      }
    }

    const layer = new RenderLayer({ id: 'content', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 60,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'rect',
      x: 140,
      y: -40,
      width: 120,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 120);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));

    const settings = {
      enabled: true,
      requireCtrl: false,
      percent: 0.1,
      smoothEnabled: false,
      smoothFrames: 8,
    };

    const ID = 'zoom';
    const build = (): WheelZoomBehaviour =>
      new WheelZoomBehaviour({
        id: ID,
        enabled: settings.enabled,
        requireCtrl: settings.requireCtrl,
        percent: settings.percent,
        smooth: settings.smoothEnabled ? settings.smoothFrames : false,
      });

    canvas.behaviours.register(build());

    const rebuild = (): void => {
      canvas.behaviours.unregister(ID);
      canvas.behaviours.register(build());
    };

    const gui = new GUI({ title: 'WheelZoomBehaviour' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange((v: boolean) => canvas.behaviours.setEnabled(ID, v));
    gui.add(settings, 'requireCtrl').onChange(rebuild);
    gui.add(settings, 'percent', 0.01, 0.5, 0.01).onChange(rebuild);
    gui.add(settings, 'smoothEnabled').name('smooth').onChange(rebuild);
    gui.add(settings, 'smoothFrames', 1, 30, 1).name('smooth frames').onChange(rebuild);
  },
};
