import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelPlacement } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphEdge, type GraphNode, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/Placements/Outside' };
export default meta;
type Story = StoryObj;

/**
 * The eight **anchor-only outside placements** — sides (`top`, `right`,
 * `bottom`, `left`) and corners (`top-right`, `bottom-right`,
 * `bottom-left`, `top-left`). The label is positioned at the anchor and
 * sized freely; it may extend past the host shape's bounds.
 *
 * One hub at the centre with eight ring nodes; each ring node carries a
 * label pinned to its named outside placement. Use the lil-gui `placement`
 * picker to sweep a single picked node through all eight values.
 */
export const Outside: Story = {
  render: () => createContainer({ id: 'graph-label-placements-outside' }),

  play: async ({ canvasElement }) => {
    const OUTSIDE_PLACEMENTS: ShapeLabelPlacement[] = [
      'top', 'top-right', 'right', 'bottom-right',
      'bottom', 'bottom-left', 'left', 'top-left',
    ];

    // Each ring node picks a different shape kind so outside-placement
    // anchoring is exercised across all six built-in silhouettes. Polygon
    // vertices and arc params are literals — no helper functions.
    const nodes: GraphNode[] = [
      { type: 'node', id: 'hub',      position: { x: 0,    y: 0    }, style: { shape: { kind: 'circle', radius: 22 }, bgFill: 0x0f172a, bgStrokeColor: 0x0f172a, labelText: 'hub', labelColor: 0xffffff, labelPlacement: 'center' } },
      { type: 'node', id: 'n-top',    position: { x: 0,    y: -220 }, style: { shape: { kind: 'circle', radius: 16 },                                       labelText: 'top',          labelPlacement: 'top',          labelOffsetY: -4 } },
      { type: 'node', id: 'n-tr',     position: { x: 156,  y: -156 }, style: { shape: { kind: 'rect', width: 40, height: 32, cornerRadius: 6 },             labelText: 'top-right',    labelPlacement: 'top-right',    labelOffsetY: -4 } },
      { type: 'node', id: 'n-right',  position: { x: 220,  y: 0    }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 20 },                    labelText: 'right',        labelPlacement: 'right' } },
      { type: 'node', id: 'n-br',     position: { x: 156,  y: 156  }, style: { shape: { kind: 'star', points: 5, outerRadius: 22, innerRadius: 10 },        labelText: 'bottom-right', labelPlacement: 'bottom-right', labelOffsetY: 4 } },
      { type: 'node', id: 'n-bottom', position: { x: 0,    y: 220  }, style: { shape: { kind: 'polygon', vertices: [ { x: 0, y: -20 }, { x: 20, y: 0 }, { x: 0, y: 20 }, { x: -20, y: 0 } ] }, labelText: 'bottom', labelPlacement: 'bottom', labelOffsetY: 4 } },
      { type: 'node', id: 'n-bl',     position: { x: -156, y: 156  }, style: { shape: { kind: 'arc', innerR: 8, outerR: 22, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }, labelText: 'bottom-left', labelPlacement: 'bottom-left', labelOffsetY: 4 } },
      { type: 'node', id: 'n-left',   position: { x: -220, y: 0    }, style: { shape: { kind: 'regular-polygon', sides: 6, radius: 20, rotation: Math.PI / 6 }, labelText: 'left',     labelPlacement: 'left' } },
      { type: 'node', id: 'n-tl',     position: { x: -156, y: -156 }, style: { shape: { kind: 'rect', width: 40, height: 40, cornerRadius: 20 },            labelText: 'top-left',     labelPlacement: 'top-left',     labelOffsetY: -4 } },
    ];

    const edges: GraphEdge[] = [
      { type: 'edge', id: 'e-top',    source: 'hub', target: 'n-top' },
      { type: 'edge', id: 'e-tr',     source: 'hub', target: 'n-tr' },
      { type: 'edge', id: 'e-right',  source: 'hub', target: 'n-right' },
      { type: 'edge', id: 'e-br',     source: 'hub', target: 'n-br' },
      { type: 'edge', id: 'e-bottom', source: 'hub', target: 'n-bottom' },
      { type: 'edge', id: 'e-bl',     source: 'hub', target: 'n-bl' },
      { type: 'edge', id: 'e-left',   source: 'hub', target: 'n-left' },
      { type: 'edge', id: 'e-tl',     source: 'hub', target: 'n-tl' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-placements-outside')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 16 },
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelColor: 0x454545,
            },
          },
        },
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' } },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 120);

    const settings = { pickedNode: 'n-top', placement: 'top' as ShapeLabelPlacement };
    const apply = (): void => {
      // `updateNode` replaces `style` wholesale — spread the prior style so
      // the patch behaves like a per-field merge for the GUI tweak.
      const prev = (graph.store.getNode(settings.pickedNode)?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode(settings.pickedNode, {
        style: { ...prev, labelPlacement: settings.placement },
      });
    };
    const gui = new GUI({ title: 'Outside placement' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'pickedNode', nodes.filter((n) => n.id !== 'hub').map((n) => n.id)).onChange(apply);
    gui.add(settings, 'placement', OUTSIDE_PLACEMENTS).onChange(apply);
  },
};
