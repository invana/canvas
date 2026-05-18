import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Background' };
export default meta;
type Story = StoryObj;

/**
 * Background "pill" rendered behind the label text — `labelBackgroundFill`,
 * `labelBackgroundAlpha`, `labelBackgroundStrokeColor`,
 * `labelBackgroundStrokeWidth`, `labelBackgroundPadding`,
 * `labelBackgroundCornerRadius`.
 *
 * One node with an outside-bottom label. Toggle the pill on, tweak fill /
 * stroke / padding / radius. Background-only fields take effect only when
 * **at least one** of fill / stroke is set.
 */
export const Background: Story = {
  render: () => createContainer({ id: 'graph-label-background' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          labelText: 'background pill',
          labelPlacement: 'bottom',
          labelOffsetY: 10,
          labelFontSize: 13,
          labelFontWeight: 600,
          labelColor: 0x454545,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-background')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 22 },
            bgFill: 0x8b5cf6,
            bgStrokeColor: 0x6d28d9,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 240);

    const settings = {
      enabled: true,
      fill: 0xffffff,
      fillAlpha: 1,
      strokeColor: 0xcbd5e1,
      strokeWidth: 1,
      padding: 6,
      cornerRadius: 6,
    };
    const apply = (): void => {
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      // Clear by setting fill/stroke to undefined when `enabled` is off —
      // the decoration draws the pill only when at least one is set.
      graph.store.updateNode('n', {
        style: {
          ...prev,
          labelBackgroundFill: settings.enabled ? settings.fill : undefined,
          labelBackgroundAlpha: settings.fillAlpha,
          labelBackgroundStrokeColor: settings.enabled ? settings.strokeColor : undefined,
          labelBackgroundStrokeWidth: settings.strokeWidth,
          labelBackgroundPadding: settings.padding,
          labelBackgroundCornerRadius: settings.cornerRadius,
        },
      });
    };
    apply();
    const gui = new GUI({ title: 'Label background' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange(apply);
    gui.addColor(settings, 'fill').onChange(apply);
    gui.add(settings, 'fillAlpha', 0, 1, 0.05).onChange(apply);
    gui.addColor(settings, 'strokeColor').onChange(apply);
    gui.add(settings, 'strokeWidth', 0, 6, 0.5).onChange(apply);
    gui.add(settings, 'padding', 0, 20, 1).onChange(apply);
    gui.add(settings, 'cornerRadius', 0, 16, 1).onChange(apply);
  },
};
