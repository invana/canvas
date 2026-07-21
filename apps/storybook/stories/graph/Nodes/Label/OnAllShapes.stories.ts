import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/OnAllShapes' };
export default meta;
type Story = StoryObj;

/**
 * Test rig: a label decoration on every one of the six built-in shape
 * kinds — `circle`, `rect`, `arc`, `regular-polygon`, `star`, `polygon`.
 * All share the same label config; the GUI's single `placement` picker
 * fans the same value out to every node, so flipping it sweeps every
 * placement against every silhouette in one pass.
 *
 * Use this when changing `LabelDecoration`'s anchor / placement / fit
 * math: if a regression breaks anchoring for any silhouette, the row
 * makes it immediately obvious.
 */
export const OnAllShapes: Story = {
  render: () => createContainer({ id: 'graph-label-on-all-shapes' }),

  play: async ({ canvasElement }) => {
    // Hexagon vertices pre-computed as literals (radius 30, pointy-right
    // orientation, centre-relative). Per the storybook data-pattern
    // convention: polygon coords are hardcoded, no helper functions.
    const nodes: NodeData[] = [
      {
        id: 'circle',
        position: { x: -260, y: -160 },
        style: { shape: { kind: 'circle', radius: 28 }, labelText: 'circle', labelPlacement: 'bottom', labelOffsetY: 8 },
      },
      {
        id: 'rect',
        position: { x: 0, y: -160 },
        style: { shape: { kind: 'rect', width: 70, height: 50, cornerRadius: 8 }, labelText: 'rect', labelPlacement: 'bottom', labelOffsetY: 8 },
      },
      {
        id: 'arc',
        position: { x: 260, y: -160 },
        style: { shape: { kind: 'arc', innerR: 14, outerR: 32, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }, labelText: 'arc', labelPlacement: 'bottom', labelOffsetY: 8 },
      },
      {
        id: 'regular-polygon',
        position: { x: -260, y: 160 },
        style: { shape: { kind: 'regular-polygon', sides: 5, radius: 32 }, labelText: 'regular-polygon', labelPlacement: 'bottom', labelOffsetY: 8 },
      },
      {
        id: 'star',
        position: { x: 0, y: 160 },
        style: { shape: { kind: 'star', points: 5, outerRadius: 34, innerRadius: 14 }, labelText: 'star', labelPlacement: 'bottom', labelOffsetY: 8 },
      },
      {
        id: 'polygon',
        position: { x: 260, y: 160 },
        style: {
          shape: {
            kind: 'polygon',
            vertices: [
              { x: 30, y: 0 },
              { x: 15, y: -26 },
              { x: -15, y: -26 },
              { x: -30, y: 0 },
              { x: -15, y: 26 },
              { x: 15, y: 26 },
            ],
          },
          labelText: 'polygon',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-on-all-shapes')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              bgStrokeWidth: 1,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelColor: 0x454545,
              labelBackgroundFill: 0xffffff,
              labelBackgroundStrokeColor: 0xcbd5e1,
              labelBackgroundStrokeWidth: 1,
              labelBackgroundCornerRadius: 4,
              labelBackgroundPadding: 4,
            },
          },
        },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_PLACEMENTS: ShapeLabelPlacement[] = [
      'top', 'top-right', 'right', 'bottom-right',
      'bottom', 'bottom-left', 'left', 'top-left',
      'center',
      'inside-top', 'inside-top-right', 'inside-right', 'inside-bottom-right',
      'inside-bottom', 'inside-bottom-left', 'inside-left', 'inside-top-left',
      'inside-center',
    ];
    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = { placement: 'bottom' as ShapeLabelPlacement, longLabel: false };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, {
          style: {
            ...prev,
            labelText: settings.longLabel ? `${id} — a longer caption` : id,
            labelPlacement: settings.placement,
          },
        });
      }
    };
    const gui = new GUI({ title: 'Label on every shape' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'placement', ALL_PLACEMENTS).onChange(apply);
    gui.add(settings, 'longLabel').name('long label').onChange(apply);
  },
};
