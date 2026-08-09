import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  KeyboardCameraInputBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Behaviours/Camera/KeyboardCameraInputBehaviour' };
export default meta;
type Story = StoryObj;

export const KeyboardCameraInputStory: Story = {
  name: 'KeyboardCameraInputBehaviour',
  render: () => createContainer({ id: 'cvs-behaviour-keyboard-camera' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-behaviour-keyboard-camera')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() {
        return {};
      }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() {
        return null;
      }
    }

    const layer = new RenderLayer({ id: 'content', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle',
      x: -120,
      y: 0,
      radius: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 }
    });
    layer.renderer.addShape('b', {
      kind: 'rect',
      x: 40,
      y: -40,
      width: 120,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 }
    });

    canvas.camera.fitContent(layer.getBounds(), 120);

    const settings = {
      enabled: true,
      panStep: 40,
      zoomFactor: 1.1
    };

    const ID = 'keys';
    const build = (): KeyboardCameraInputBehaviour =>
      new KeyboardCameraInputBehaviour({
        id: ID,
        enabled: settings.enabled,
        panStep: settings.panStep,
        zoomFactor: settings.zoomFactor
      });

    canvas.behaviours.register(build());

    const rebuild = (): void => {
      canvas.behaviours.unregister(ID);
      canvas.behaviours.register(build());
    };

    const gui = new GUI({ title: 'KeyboardCameraInput — Arrows / + - 0' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange((v: boolean) => canvas.behaviours.setEnabled(ID, v));
    gui.add(settings, 'panStep', 1, 200, 1).onChange(rebuild);
    gui.add(settings, 'zoomFactor', 1.01, 2, 0.01).onChange(rebuild);
  }
};
