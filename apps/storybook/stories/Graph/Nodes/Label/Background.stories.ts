import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Background' };
export default meta;
type Story = StoryObj;

/**
 * Background "pill" rendered behind the label — `labelBackgroundFill`,
 * `labelBackgroundAlpha`, `labelBackgroundStrokeColor`,
 * `labelBackgroundStrokeWidth`, `labelBackgroundPadding`,
 * `labelBackgroundCornerRadius`.
 *
 * Row of six shapes; the pill config fans out to every label. Background
 * fields take effect only when **at least one** of fill / stroke is set,
 * so the GUI's `enabled` toggle nulls fill+stroke together.
 */
export const Background: Story = {
  render: () => createContainer({ id: 'graph-label-background' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      // 3-col × 2-row grid so pill labels don't overlap horizontally.
      { id: 'circle',          position: { x: -280, y: -150 }, style: { shape: { kind: 'circle', radius: 24 },                                                                  labelText: 'circle',          labelPlacement: 'bottom', labelOffsetY: 10 } },
      { id: 'rect',            position: { x: 0,    y: -150 }, style: { shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },                                        labelText: 'rect',            labelPlacement: 'bottom', labelOffsetY: 10 } },
      { id: 'arc',             position: { x: 280,  y: -150 }, style: { shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },        labelText: 'arc',             labelPlacement: 'bottom', labelOffsetY: 10 } },
      { id: 'regular-polygon', position: { x: -280, y: 150  }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 26 },                                               labelText: 'pentagon',        labelPlacement: 'bottom', labelOffsetY: 10 } },
      { id: 'star',            position: { x: 0,    y: 150  }, style: { shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },                                   labelText: 'star',            labelPlacement: 'bottom', labelOffsetY: 10 } },
      { id: 'polygon',         position: { x: 280,  y: 150  }, style: { shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] }, labelText: 'polygon', labelPlacement: 'bottom', labelOffsetY: 10 } },
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
            bgFill: 0x8b5cf6,
            bgStrokeColor: 0x6d28d9,
            labelFontSize: 13,
            labelFontWeight: 600,
            labelColor: 0x454545,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
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
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, {
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
      }
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
