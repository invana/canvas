/**
 * **The three ways to use a composite card** — the API promise, side by side on
 * one canvas. Every card in `@invana/graph` is a {@link CompositeCard} subclass
 * driven by a typed **spec**, exactly like `ShapeBase<TSpec>` drives
 * `RectShape` / `CircleShape`:
 *
 * 1. **Stock function** — `productCard(data)`. A shared default instance; the
 *    one-liner you reach for first.
 * 2. **Configured spec** — `new ProductCard({ width: 300, bg, cornerRadius })`.
 *    *Every* value lives in `spec` — width, colours, radii, spacing — so
 *    re-styling needs **no subclassing**. The middle card is the same builder
 *    as the first, on a light palette.
 * 3. **Subclass** — override a `protected` section method. Reserved for
 *    *structural* change, the one thing a spec can't express; here a SALE chip
 *    is pinned into the media band via `super.media()` + one extra part.
 *
 * The same three-way choice applies to every type in the folder — the
 * organisation pair at the bottom shows spec-only restyling on a second card.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour, type CompositePart } from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  OrganisationCard,
  ProductCard,
  TextResolutionLODBehaviour,
  chip,
  organisationCard,
  productCard,
  type CompositeShapeOption,
  type GraphNode,
  type OrganisationCardData,
  type ProductCardData
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Composite Shapes/Restyling' };
export default meta;
type Story = StoryObj;

export const Restyling: Story = {
  render: () => createContainer({ id: 'composite-restyling' }),

  play: async ({ canvasElement }) => {
    // ── 2. Configured spec — a light palette, wider box, taller media band.
    //      No subclassing: every one of these is an ordinary spec field.
    const lightProduct = new ProductCard({
      chipRadius: 1,
      width: 300,
      mediaHeight: 120,
      cornerRadius: 20,
      bg: 0xf8fafc,
      stroke: 0xcbd5e1,
      titleColor: 0x0f172a,
      priceColor: 0x0f172a,
      reviewColor: 0x475569,
    });

    // ── 3. Subclass — a structural change no spec field can express.
    class SaleProduct extends ProductCard {
      /** Stock media band, plus a SALE chip pinned into its top-left corner. */
      protected override media(data: ProductCardData, parts: CompositePart[]): void {
        super.media(data, parts);
        chip(parts, { x: this.spec.padding, y: this.spec.padding, text: 'SALE', color: 0xf43f5e });
      }
    }
    const saleProduct = new SaleProduct({ chipRadius: 1 });

    // ── Spec-only restyling on a second card type.
    const bigOrg = new OrganisationCard({ chipRadius: 1, width: 300, logoSize: 56, logoRadius: 16, metaRowHeight: 26 });

    const product: ProductCardData = { title: 'Mechanical Keyboard, 87-key', price: '$149.00', icon: 'lucide/keyboard', rating: 4.6, reviews: 128, stock: 'in', tags: [{ label: 'Wireless', color: 0x22c55e }], accent: 0xf59e0b };
    const org: OrganisationCardData = { name: 'Analytical Engine Co', kind: 'Engineering', logo: 'lucide/building-2', location: 'London, UK', headcount: '240 staff', founded: 'est. 1837', accent: 0x6366f1 };

    // `type` names the variant, and the resolver below maps it to a builder.
    const nodes: GraphNode[] = [
      { type: 'stock', id: 'n1', position: { x: -360, y: -60 }, data: { ...product, title: '1 · Stock — productCard(data)' } satisfies ProductCardData },
      { type: 'spec', id: 'n2', position: { x: 0, y: -60 }, data: { ...product, title: '2 · Configured spec — new ProductCard({ … })' } satisfies ProductCardData },
      { type: 'subclass', id: 'n3', position: { x: 380, y: -60 }, data: { ...product, title: '3 · Subclass — override media()' } satisfies ProductCardData },
      { type: 'org-stock', id: 'n4', position: { x: -220, y: 260 }, data: { ...org, name: 'Stock spec' } satisfies OrganisationCardData },
      { type: 'org-spec', id: 'n5', position: { x: 180, y: 260 }, data: { ...org, name: 'Configured spec' } satisfies OrganisationCardData },
    ];

    const shapeByType: Record<string, (node: GraphNode) => CompositeShapeOption> = {
      stock: (n) => productCard(n.data as ProductCardData),
      spec: (n) => lightProduct.build(n.data as ProductCardData),
      subclass: (n) => saleProduct.build(n.data as ProductCardData),
      'org-stock': (n) => organisationCard(n.data as OrganisationCardData),
      'org-spec': (n) => bigOrg.build(n.data as OrganisationCardData),
    };
    const shape = (n: GraphNode): CompositeShapeOption => shapeByType[n.type]!(n);

    const container = canvasElement.querySelector<HTMLDivElement>('#composite-restyling')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0b1220', color: '#334155', size: 1.5, spacing: 24, alpha: 0.85 } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] }, node: { style: { shape, bgStrokeWidth: 0 } } } }));

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
