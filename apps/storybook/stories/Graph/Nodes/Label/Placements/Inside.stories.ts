import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
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
 * 3×3 grid of identical rects, each pinned to one inside-* placement.
 * Use the GUI to flip a picked rect's `placement` and watch the label
 * snap to the matching corner / side / centre — always contained.
 */
export const Inside: Story = {
  render: () => createContainer({ id: 'graph-label-placements-inside' }),

  play: async ({ canvasElement }) => {
    const INSIDE_PLACEMENTS: ShapeLabelPlacement[] = [
      'inside-top-left',    'inside-top',    'inside-top-right',
      'inside-left',        'inside-center', 'inside-right',
      'inside-bottom-left', 'inside-bottom', 'inside-bottom-right',
    ];

    const nodes: NodeData[] = [
      { id: 'inside-top-left',     position: { x: -160, y: -100 }, style: { labelText: 'inside-top-left',     labelPlacement: 'inside-top-left' } },
      { id: 'inside-top',          position: { x: 0,    y: -100 }, style: { labelText: 'inside-top',          labelPlacement: 'inside-top' } },
      { id: 'inside-top-right',    position: { x: 160,  y: -100 }, style: { labelText: 'inside-top-right',    labelPlacement: 'inside-top-right' } },
      { id: 'inside-left',         position: { x: -160, y: 0    }, style: { labelText: 'inside-left',         labelPlacement: 'inside-left' } },
      { id: 'inside-center',       position: { x: 0,    y: 0    }, style: { labelText: 'inside-center',       labelPlacement: 'inside-center' } },
      { id: 'inside-right',        position: { x: 160,  y: 0    }, style: { labelText: 'inside-right',        labelPlacement: 'inside-right' } },
      { id: 'inside-bottom-left',  position: { x: -160, y: 100  }, style: { labelText: 'inside-bottom-left',  labelPlacement: 'inside-bottom-left' } },
      { id: 'inside-bottom',       position: { x: 0,    y: 100  }, style: { labelText: 'inside-bottom',       labelPlacement: 'inside-bottom' } },
      { id: 'inside-bottom-right', position: { x: 160,  y: 100  }, style: { labelText: 'inside-bottom-right', labelPlacement: 'inside-bottom-right' } },
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
            shape: { kind: 'rect', width: 140, height: 80, cornerRadius: 8 },
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
    canvas.camera.fitContent(graph.getBounds(), 100);

    const settings = { pickedNode: 'inside-center', placement: 'inside-center' as ShapeLabelPlacement };
    const apply = (): void => {
      // `updateNode` replaces `style` wholesale — spread the prior style so
      // the patch behaves like a per-field merge for the GUI tweak.
      const prev = (graph.store.getNode(settings.pickedNode)?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode(settings.pickedNode, {
        style: { ...prev, labelPlacement: settings.placement },
      });
    };
    const gui = new GUI({ title: 'Inside placement' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'pickedNode', nodes.map((n) => n.id)).onChange(apply);
    gui.add(settings, 'placement', INSIDE_PLACEMENTS).onChange(apply);
  },
};
