import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import type { DevInfoCorner } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Layers/DevInfoLayer' };
export default meta;
type Story = StoryObj;

export const DevInfoLayerStory: Story = {
  name: 'DevInfoLayer',
  render: () => createContainer({ id: 'cvs-dev-info-layer' }),

  play: async ({ canvasElement }) => {
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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-dev-info-layer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'demo-content', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('demo-circle', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 60,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 }
    });

    layer.renderer.addShape('demo-rect', {
      kind: 'rect',
      x: 140,
      y: -40,
      width: 120,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 }
    });

    const devInfo = new DevInfoLayer({ corner: 'bottom-left' });
    canvas.layers.add(devInfo);

    canvas.camera.fitContent(layer.getBounds(), 100);

    const settings = {
      enabled: true,
      corner: 'bottom-left' as DevInfoCorner,
      fontSize: 11,
      opacity: 0.92,
      backgroundColor: '#0a0a0a',
      textColor: '#c8d3e0',
      accentColor: '#4fc3f7'
    };
    const gui = new GUI({ title: 'DevInfoLayer' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange((v: boolean) => devInfo.setEnabled(v));
    gui
      .add(settings, 'corner', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange((v: DevInfoCorner) => devInfo.setOptions({ corner: v }));
    gui
      .add(settings, 'fontSize', 9, 18, 1)
      .onChange((v: number) => devInfo.setOptions({ fontSize: v }));
    gui
      .add(settings, 'opacity', 0.2, 1, 0.01)
      .onChange((v: number) => devInfo.setOptions({ opacity: v }));
    gui.addColor(settings, 'backgroundColor').onChange((v: string) =>
      devInfo.setOptions({ backgroundColor: v }),
    );
    gui.addColor(settings, 'textColor').onChange((v: string) =>
      devInfo.setOptions({ textColor: v }),
    );
    gui.addColor(settings, 'accentColor').onChange((v: string) =>
      devInfo.setOptions({ accentColor: v }),
    );
  }
};
