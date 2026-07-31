import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import type { SelectionFramePlacement } from '@invana/canvas/primitives';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/SelectionFrame' };
export default meta;
type Story = StoryObj;

const ALL_HANDLES: SelectionFramePlacement[] = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
];

/**
 * Pure-visual demo of the selection / transform frame. A configurable
 * border outline (solid / dashed / dotted) plus up to 8 drag handles
 * painted on top. Handle visual is selectable between circle and square
 * with full fill / stroke / corner-radius control. Powers the
 * `NodeResizeBehaviour` look in `@invana/graph` and works on any shape.
 */
export const SelectionFrameStory: Story = {
  name: 'SelectionFrame',
  render: () => createContainer({ id: 'cvs-deco-selection-frame' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-selection-frame')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'frame', options: {} });
    canvas.layers.add(layer);

    const hosts = [
      {
        id: 'rect',
        spec: {
          kind: 'rect' as const,
          x: -200, y: -90, width: 160, height: 180, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0xffffff },
          stroke: { color: 0x111827, width: 2 },
        },
      },
      {
        id: 'circle',
        spec: {
          kind: 'circle' as const,
          x: 80, y: 0, radius: 90,
          fill: { kind: 'solid' as const, color: 0xffffff },
          stroke: { color: 0x111827, width: 2 },
        },
      },
    ];
    for (const h of hosts) layer.renderer.addShape(h.id, h.spec);

    const settings = {
      // Frame
      handleSet: 'all-8' as 'all-8' | 'corners' | 'radial-only',
      borderStyle: 'dotted' as 'solid' | 'dashed' | 'dotted',
      borderColor: 0x6b7fff,
      borderWidth: 1.5,
      borderAlpha: 0.6,
      padding: 4,
      // Custom dash override — when on, `dashLength` / `gapLength` win over
      // the `borderStyle` preset. Lets the GUI dial in any [dash, gap] pair.
      customDash: false,
      dashLength: 5,
      gapLength: 4,
      // Handles
      handleShape: 'circle' as 'circle' | 'square',
      handleRadius: 5,
      handleCornerRadius: 1.5,
      handleFill: 0xffffff,
      handleFillAlpha: 1,
      handleStrokeColor: 0x6b7fff,
      handleStrokeWidth: 1.5,
      handleStrokeAlpha: 1,
    };

    const handlesFor = (which: typeof settings.handleSet): SelectionFramePlacement[] => {
      if (which === 'corners') return ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
      if (which === 'radial-only') return ['right'];
      return ALL_HANDLES;
    };

    const apply = (): void => {
      const handles = handlesFor(settings.handleSet);
      // The custom dash override only applies when the border style is
      // dashed or dotted — a solid border has no dash pattern to override.
      const useCustomDash =
        settings.customDash && settings.borderStyle !== 'solid';
      for (const h of hosts) {
        layer.renderer.setDecoration(h.id, 'frame', {
          kind: 'selection-frame',
          style: {
            borderColor: settings.borderColor,
            borderWidth: settings.borderWidth,
            borderStyle: settings.borderStyle,
            borderAlpha: settings.borderAlpha,
            padding: settings.padding,
            ...(useCustomDash
              ? { dashArray: [settings.dashLength, settings.gapLength] as [number, number] }
              : {}),
            handleShape: settings.handleShape,
            handleRadius: settings.handleRadius,
            handleCornerRadius: settings.handleCornerRadius,
            handleFill: settings.handleFill,
            handleFillAlpha: settings.handleFillAlpha,
            handleStrokeColor: settings.handleStrokeColor,
            handleStrokeWidth: settings.handleStrokeWidth,
            handleStrokeAlpha: settings.handleStrokeAlpha,
            handles,
          },
        });
      }
    };
    apply();

    const gui = new GUI({ title: 'Selection frame' });
    onStoryTeardown(() => gui.destroy());

    const frame = gui.addFolder('Frame');
    frame.add(settings, 'handleSet', ['all-8', 'corners', 'radial-only']).onChange(apply);
    frame.add(settings, 'borderStyle', ['solid', 'dashed', 'dotted']).onChange(apply);
    frame.addColor(settings, 'borderColor').onChange(apply);
    frame.add(settings, 'borderWidth', 0.5, 4, 0.5).onChange(apply);
    frame.add(settings, 'borderAlpha', 0, 1, 0.05).onChange(apply);
    frame.add(settings, 'padding', 0, 24, 1).onChange(apply);

    const dash = gui.addFolder('Custom dash');
    dash
      .add(settings, 'customDash')
      .name('customDash (overrides borderStyle)')
      .onChange(apply);
    dash.add(settings, 'dashLength', 0, 24, 1).onChange(apply);
    dash.add(settings, 'gapLength', 0, 24, 1).onChange(apply);

    const handles = gui.addFolder('Handles');
    handles.add(settings, 'handleShape', ['circle', 'square']).onChange(apply);
    handles.add(settings, 'handleRadius', 2, 14, 1).onChange(apply);
    handles
      .add(settings, 'handleCornerRadius', 0, 8, 0.5)
      .name('handleCornerRadius (square only)')
      .onChange(apply);
    handles.addColor(settings, 'handleFill').onChange(apply);
    handles.add(settings, 'handleFillAlpha', 0, 1, 0.05).onChange(apply);
    handles.addColor(settings, 'handleStrokeColor').onChange(apply);
    handles.add(settings, 'handleStrokeWidth', 0, 4, 0.5).onChange(apply);
    handles.add(settings, 'handleStrokeAlpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 80);
  },
};
