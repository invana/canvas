import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  DragShapeBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Behaviours/Shapes/DragShapeBehaviour' };
export default meta;
type Story = StoryObj;

export const DragShapeStory: Story = {
  name: 'DragShapeBehaviour',
  render: () => createContainer({ id: 'cvs-behaviour-drag-shape' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-behaviour-drag-shape')!;
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
      x: -140,
      y: 0,
      radius: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 }
    });
    layer.renderer.addShape('b', {
      kind: 'rect',
      x: 60,
      y: -40,
      width: 120,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 }
    });
    layer.renderer.addConnector('a-b', {
      kind: 'line',
      source: { kind: 'shape', shapeId: 'a' },
      target: { kind: 'shape', shapeId: 'b' },
      stroke: { color: 0x334155, width: 2 }
    });

    canvas.camera.fitContent(layer.getBounds(), 120);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const settings = {
      enabled: true,
      reRouteConnectors: true,
      dragCursor: 'grabbing'
    };

    const ID = 'drag-shape';
    const build = (): DragShapeBehaviour =>
      new DragShapeBehaviour({
        id: ID,
        enabled: settings.enabled,
        renderer: layer.renderer,
        reRouteConnectors: settings.reRouteConnectors,
        dragCursor: settings.dragCursor
      });

    canvas.behaviours.register(build());

    const rebuild = (): void => {
      canvas.behaviours.unregister(ID);
      canvas.behaviours.register(build());
    };

    const gui = new GUI({ title: 'DragShapeBehaviour' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange((v: boolean) => canvas.behaviours.setEnabled(ID, v));
    gui.add(settings, 'reRouteConnectors').onChange(rebuild);
    gui
      .add(settings, 'dragCursor', ['grabbing', 'grab', 'move', 'crosshair', 'pointer', 'default'])
      .onChange(rebuild);
  }
};
