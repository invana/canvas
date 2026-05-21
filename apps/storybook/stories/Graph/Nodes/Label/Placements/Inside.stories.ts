import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeShapeOptions, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Placements/Inside' };
export default meta;
type Story = StoryObj;

/**
 * The nine **`inside-*` placements** — 8 sides+corners plus `inside-center`.
 * Carries the *containment contract*: the label must stay inside the host
 * shape's inner box. The decoration runs the shrink → truncate → hide fit
 * cascade against the per-placement inner box.
 *
 * 3×3 grid of host nodes, each pinned to one inside-* placement. The GUI's
 * `shape` picker swaps the shape kind for every cell at once — so each of
 * the nine placements is exercised against every built-in silhouette
 * (circle, rect, arc, regular-polygon, star, polygon).
 */
export const Inside: Story = {
  render: () => createContainer({ id: 'graph-label-placements-inside' }),

  play: async ({ canvasElement }) => {
    const INSIDE_PLACEMENTS: ShapeLabelPlacement[] = [
      'inside-top-left',    'inside-top',    'inside-top-right',
      'inside-left',        'inside-center', 'inside-right',
      'inside-bottom-left', 'inside-bottom', 'inside-bottom-right',
    ];
    const SHAPE_KINDS = ['rect', 'circle', 'arc', 'regular-polygon', 'star', 'polygon'] as const;
    type ShapeKind = (typeof SHAPE_KINDS)[number];

    // Shape literals per kind. Sized big enough that 9-cell inside-* labels
    // fit at the default font without immediately hitting the cascade.
    const shapeForKind = (k: ShapeKind): NodeShapeOptions => {
      switch (k) {
        case 'rect':
          return { kind: 'rect', width: 130, height: 80, cornerRadius: 8 };
        case 'circle':
          return { kind: 'circle', radius: 55 };
        case 'arc':
          return { kind: 'arc', innerR: 18, outerR: 60, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 };
        case 'regular-polygon':
          return { kind: 'regular-polygon', sides: 5, radius: 60 };
        case 'star':
          return { kind: 'star', points: 5, outerRadius: 64, innerRadius: 28 };
        case 'polygon':
          return {
            kind: 'polygon',
            vertices: [
              { x: 55, y: 0 },
              { x: 27, y: -48 },
              { x: -27, y: -48 },
              { x: -55, y: 0 },
              { x: -27, y: 48 },
              { x: 27, y: 48 },
            ],
          };
      }
    };

    const nodes: NodeData[] = [
      { id: 'inside-top-left',     position: { x: -160, y: -100 }, style: { shape: shapeForKind('rect'), labelText: 'inside-top-left',     labelPlacement: 'inside-top-left' } },
      { id: 'inside-top',          position: { x: 0,    y: -100 }, style: { shape: shapeForKind('rect'), labelText: 'inside-top',          labelPlacement: 'inside-top' } },
      { id: 'inside-top-right',    position: { x: 160,  y: -100 }, style: { shape: shapeForKind('rect'), labelText: 'inside-top-right',    labelPlacement: 'inside-top-right' } },
      { id: 'inside-left',         position: { x: -160, y: 0    }, style: { shape: shapeForKind('rect'), labelText: 'inside-left',         labelPlacement: 'inside-left' } },
      { id: 'inside-center',       position: { x: 0,    y: 0    }, style: { shape: shapeForKind('rect'), labelText: 'inside-center',       labelPlacement: 'inside-center' } },
      { id: 'inside-right',        position: { x: 160,  y: 0    }, style: { shape: shapeForKind('rect'), labelText: 'inside-right',        labelPlacement: 'inside-right' } },
      { id: 'inside-bottom-left',  position: { x: -160, y: 100  }, style: { shape: shapeForKind('rect'), labelText: 'inside-bottom-left',  labelPlacement: 'inside-bottom-left' } },
      { id: 'inside-bottom',       position: { x: 0,    y: 100  }, style: { shape: shapeForKind('rect'), labelText: 'inside-bottom',       labelPlacement: 'inside-bottom' } },
      { id: 'inside-bottom-right', position: { x: 160,  y: 100  }, style: { shape: shapeForKind('rect'), labelText: 'inside-bottom-right', labelPlacement: 'inside-bottom-right' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-placements-inside')!;
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
            bgFill: 0xf1f5f9,
            bgStrokeColor: 0x475569,
            bgStrokeWidth: 1,
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

    const ALL_IDS = nodes.map((n) => n.id);
    const settings = {
      shape: 'rect' as ShapeKind,
      pickedNode: 'inside-center',
      placement: 'inside-center' as ShapeLabelPlacement,
    };
    const applyShape = (): void => {
      const nextShape = shapeForKind(settings.shape);
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, { style: { ...prev, shape: nextShape } });
      }
    };
    const applyPlacement = (): void => {
      const prev = (graph.store.getNode(settings.pickedNode)?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode(settings.pickedNode, {
        style: { ...prev, labelPlacement: settings.placement },
      });
    };
    const gui = new GUI({ title: 'Inside placement' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'shape', SHAPE_KINDS as unknown as string[]).name('shape (all cells)').onChange(applyShape);
    gui.add(settings, 'pickedNode', ALL_IDS).onChange(applyPlacement);
    gui.add(settings, 'placement', INSIDE_PLACEMENTS).onChange(applyPlacement);
  },
};
