/**
 * **Product card** built-in composite node type (`productCard` from
 * `@invana/graph`) — an accent-tinted media band with a centred Lucide icon, a
 * two-line title, the price beside a star rating, then a stock pill and tag
 * chips.
 *
 * Two things this story is showing. The **media band runs edge to edge and
 * relies on the frame's `clip`** to follow the rounded corners — a `rect` part
 * is square geometry and can't round one on its own. And the card **auto-sizes**:
 * the last node carries no stock and no tags, so the chip row is dropped
 * entirely rather than left as an empty band.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  productCard,
  type GraphNode,
  type ProductCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Product Card' };
export default meta;
type Story = StoryObj;

export const ProductCard: Story = {
  render: () => createContainer({ id: 'composite-product-card' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'p1', position: { x: -280, y: 0 }, data: { title: 'Mechanical Keyboard, 87-key hot-swap', price: '$149.00', icon: 'lucide/keyboard', rating: 4.6, reviews: 128, stock: 'in', tags: [{ label: 'Wireless', color: 0x22c55e }], accent: 0xf59e0b } satisfies ProductCardData },
      { type: 'node', id: 'p2', position: { x: 0, y: 0 }, data: { title: 'Studio Monitor Headphones', price: '$299.00', icon: 'lucide/headphones', rating: 4.9, reviews: 2104, stock: 'low', tags: [{ label: 'Pro', color: 0xa855f7 }], accent: 0x6366f1 } satisfies ProductCardData },
      { type: 'node', id: 'p3', position: { x: 280, y: 0 }, data: { title: 'Ultrawide Display 34"', price: '$899.00', icon: 'lucide/monitor', rating: 4.2, reviews: 87, stock: 'out', accent: 0x0ea5e9 } satisfies ProductCardData },
      // No rating, no stock, no tags — the chip row is dropped, so this card is shorter.
      { type: 'node', id: 'p4', position: { x: 0, y: 260 }, data: { title: 'Braided USB-C Cable, 2 m', price: '$19.00', icon: 'lucide/cable', accent: 0x64748b } satisfies ProductCardData },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-product-card')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape: (n) => productCard(n.data as ProductCardData), bgStrokeWidth: 0 } } } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph', enabled: true }));

    await canvas.init({ container, autoResize: true });
    const graph = canvas.layers.get('graph') as GraphLayer;
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
