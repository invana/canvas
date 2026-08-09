import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import type { TogglePlacement } from '@invana/canvas/specs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Toggle' };
export default meta;
type Story = StoryObj;

/**
 * `ToggleDecoration` is the domain-free primitive behind the `+` / `−` button
 * `@invana/graph` uses for compound-group expand / collapse. This story
 * isolates the visual on a plain rect + circle so the placement, state, and
 * styling knobs can be inspected without any graph plumbing.
 */
export const Toggle: Story = {
  render: () => createContainer({ id: 'cvs-deco-toggle' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-toggle')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'toggle', options: {} });
    canvas.layers.add(layer);

    const hosts = [
      {
        id: 'rect',
        spec: {
          kind: 'rect' as const,
          x: -160, y: -60, width: 120, height: 120, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0xeef2ff },
          stroke: { color: 0x6b7fff, width: 1 }
        }
      },
      {
        id: 'circle',
        spec: {
          kind: 'circle' as const,
          x: 100, y: 0, radius: 60,
          fill: { kind: 'solid' as const, color: 0xeef2ff },
          stroke: { color: 0x6b7fff, width: 1 }
        }
      },
    ];
    for (const h of hosts) layer.renderer.addShape(h.id, h.spec);
    const hostIds = hosts.map((h) => h.id);

    const settings = {
      state: 'plus' as 'plus' | 'minus',
      placement: 'bottom' as TogglePlacement,
      radius: 10,
      bgFill: 0xffffff,
      strokeColor: 0x6b7fff,
      glyphColor: 0x6b7fff
    };

    const apply = () => {
      for (const id of hostIds) {
        layer.renderer.setDecoration(id, 'toggle', {
          kind: 'toggle',
          style: {
            state: settings.state,
            placement: settings.placement,
            radius: settings.radius,
            bgFill: settings.bgFill,
            strokeColor: settings.strokeColor,
            glyphColor: settings.glyphColor
          }
        });
      }
    };
    apply();

    const gui = new GUI({ title: 'Toggle' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'state', ['plus', 'minus']).onChange(apply);
    gui.add(settings, 'placement', [
      'top', 'right', 'bottom', 'left',
      'top-left', 'top-right', 'bottom-left', 'bottom-right',
      'inside-top', 'inside-right', 'inside-bottom', 'inside-left',
    ]).onChange(apply);
    gui.add(settings, 'radius', 4, 24, 1).onChange(apply);
    gui.addColor(settings, 'bgFill').onChange(apply);
    gui.addColor(settings, 'strokeColor').onChange(apply);
    gui.addColor(settings, 'glyphColor').onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 80);
  }
};
