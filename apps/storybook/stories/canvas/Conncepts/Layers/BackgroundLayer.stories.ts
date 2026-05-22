import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Layers/BackgroundLayer' };
export default meta;
type Story = StoryObj;

export const Background: Story = {
  render: () => createContainer({ id: 'cvs-background-layer' }),

  play: async ({ canvasElement }) => {
    // A trivial world layer so users see *something* to pan / zoom against
    // the background.
    class FixturesLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() {
        return {};
      }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
        this.renderer.addShape('a', {
          kind: 'circle',
          x: -120,
          y: 0,
          radius: 36,
          fill: 0x3b82f6,
        });
        this.renderer.addShape('b', {
          kind: 'circle',
          x: 120,
          y: 0,
          radius: 36,
          fill: 0xf59e0b,
        });
        this.renderer.addShape('c', {
          kind: 'rect',
          x: 0,
          y: 120,
          width: 80,
          height: 50,
          cornerRadius: 6,
          fill: 0x10b981,
        });
      }
      hitTest() {
        return null;
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-background-layer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const bg = new BackgroundLayer({
      id: 'bg',
      options: {
        type: 'pattern',
        patternType: 'dots',
        backgroundColor: 0x0f172a,
        color: 0x475569,
        size: 1.5,
        spacing: 30,
        alpha: 0.8,
        followCamera: true,
      },
    });
    canvas.layers.add(bg);

    const fixtures = new FixturesLayer({ id: 'fx', options: {} });
    canvas.layers.add(fixtures);

    const settings = {
      type: 'pattern' as 'solid' | 'pattern',
      patternType: 'dots' as 'dots' | 'grid' | 'lines',
      backgroundColor: '#0f172a',
      color: '#475569',
      size: 1.5,
      spacing: 30,
      alpha: 0.8,
      followCamera: true,
    };

    const apply = () => {
      bg.setOptions({
        type: settings.type,
        patternType: settings.patternType,
        backgroundColor: settings.backgroundColor,
        color: settings.color,
        size: settings.size,
        spacing: settings.spacing,
        alpha: settings.alpha,
        followCamera: settings.followCamera,
      });
    };

    const gui = new GUI({ title: 'Background' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'type', ['solid', 'pattern']).onChange(apply);
    gui.add(settings, 'patternType', ['dots', 'grid', 'lines']).onChange(apply);
    gui.addColor(settings, 'backgroundColor').onChange(apply);
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'size', 0.5, 8, 0.5).onChange(apply);
    gui.add(settings, 'spacing', 10, 80, 2).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'followCamera').onChange(apply);

    canvas.camera.fitContent(fixtures.getBounds(), 80);
  },
};
