import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext, DragModifier } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Behaviours/Camera/DragPanBehaviour' };
export default meta;
type Story = StoryObj;

export const DragPanStory: Story = {
  name: 'DragPanBehaviour',
  render: () => createContainer({ id: 'cvs-behaviour-drag-pan' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-behaviour-drag-pan')!;
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
      x: -100,
      y: 0,
      radius: 60,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'rect',
      x: 60,
      y: -40,
      width: 140,
      height: 90,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 120);

    const settings = {
      enabled: true,
      modifier: 'none' as DragModifier,
      mouseButtons: 'left' as 'all' | 'left' | 'right' | 'middle',
      decelerate: true,
    };

    const ID = 'pan';
    const build = (): DragPanBehaviour =>
      new DragPanBehaviour({
        id: ID,
        enabled: settings.enabled,
        modifier: settings.modifier,
        mouseButtons: settings.mouseButtons,
        decelerate: settings.decelerate,
      });

    canvas.behaviours.register(build());

    const rebuild = (): void => {
      canvas.behaviours.unregister(ID);
      canvas.behaviours.register(build());
    };

    const gui = new GUI({ title: 'DragPanBehaviour' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange((v: boolean) => canvas.behaviours.setEnabled(ID, v));
    gui
      .add(settings, 'modifier', ['none', 'space', 'shift', 'alt'])
      .onChange(rebuild);
    gui
      .add(settings, 'mouseButtons', ['all', 'left', 'right', 'middle'])
      .onChange(rebuild);
    gui.add(settings, 'decelerate').onChange(rebuild);
  },
};
