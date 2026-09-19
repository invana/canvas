/**
 * **Peak-season sourcing — whose stock position strands the most revenue**
 *
 * *Daniel Osei, category manager, Northwind Marketplace.* Peak trading opens in
 * three weeks and Daniel may dual-source exactly **one** supplier. He must
 * answer, and defend to the trading committee: **which supplier's stock
 * position puts the most revenue at risk?** The answer becomes a purchase
 * commitment he cannot unwind.
 *
 * The supplier league table ranks on rating, and the rating table is wrong here.
 * `productCard` puts **price, rating and stock state on the same card**, so the
 * shape of the risk is visible rather than inferred:
 *
 * 1. **The obvious candidate is a decoy.** Pike & Sons rates worst, so it tops
 *    the remediation list — but its lines are cheap accessories and all **in
 *    stock**. Dual-sourcing it protects almost no revenue.
 * 2. **The real exposure rates well.** Corvus Audio rates 4.8 and its three
 *    highest-priced lines are **out** or **low**. A quality-ranked queue never
 *    surfaces it, because nothing about its rating is wrong.
 *
 * That contrast is the decision: dual-source Corvus, not Pike. Hover a supplier
 * to isolate its lines; the stock pill (`in` / `low` / `out`) carries the
 * finding.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, TextResolutionLODBehaviour } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  OrganisationCard,
  ProductCard,
  type CompositeShapeOption,
  type GraphCanvas,
  type GraphData,
  type GraphNode,
  type OrganisationCardData,
  type ProductCardData
} from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { Moon, PackageX, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/by-casestudies/commerce/StockExposure' };
export default meta;
type Story = StoryObj;

export const StockExposureStory: Story = {
  name: 'StockExposure',
  render: function Render() {
    const [atRiskOnly, setAtRiskOnly] = useState(false);
    const [direction, setDirection] = useState<ElkDirection>('RIGHT');

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    const data: GraphData = useMemo(() => {
      const suppliers: GraphNode[] = [
        { type: 'supplier', id: 'corvus', data: { name: 'Corvus Audio', kind: 'Supplier · rated 4.8', logo: 'lucide/building-2', location: 'Porto, PT', headcount: '140 staff', founded: 'est. 2011', accent: 0xf43f5e } satisfies OrganisationCardData },
        { type: 'supplier', id: 'meridian', data: { name: 'Meridian Peripherals', kind: 'Supplier · rated 4.4', logo: 'lucide/building-2', location: 'Taipei, TW', headcount: '620 staff', accent: 0x22c55e } satisfies OrganisationCardData },
        { type: 'supplier', id: 'pike', data: { name: 'Pike & Sons', kind: 'Supplier · rated 3.6', logo: 'lucide/building-2', location: 'Sheffield, UK', headcount: '38 staff', accent: 0x64748b } satisfies OrganisationCardData },
      ];

      const products: GraphNode[] = [
        // Corvus — highly rated, and its three dearest lines cannot ship.
        { type: 'product', id: 'p1', data: { title: 'Studio Monitor Headphones', price: '$299.00', icon: 'lucide/headphones', rating: 4.9, reviews: 2104, stock: 'out', tags: [{ label: 'Hero line', color: 0xf43f5e }], accent: 0xf43f5e } satisfies ProductCardData },
        { type: 'product', id: 'p2', data: { title: 'Reference DAC, balanced', price: '$449.00', icon: 'lucide/audio-waveform', rating: 4.8, reviews: 612, stock: 'out', accent: 0xf43f5e } satisfies ProductCardData },
        { type: 'product', id: 'p3', data: { title: 'Field Recorder, 32-bit', price: '$699.00', icon: 'lucide/mic', rating: 4.7, reviews: 188, stock: 'low', accent: 0xf43f5e } satisfies ProductCardData },
        // Meridian — mid-priced, healthy.
        { type: 'product', id: 'p4', data: { title: 'Mechanical Keyboard, 87-key', price: '$149.00', icon: 'lucide/keyboard', rating: 4.6, reviews: 128, stock: 'in', accent: 0x22c55e } satisfies ProductCardData },
        { type: 'product', id: 'p5', data: { title: 'Ultrawide Display 34"', price: '$899.00', icon: 'lucide/monitor', rating: 4.2, reviews: 87, stock: 'in', accent: 0x22c55e } satisfies ProductCardData },
        { type: 'product', id: 'p6', data: { title: 'Vertical Mouse, wireless', price: '$79.00', icon: 'lucide/mouse-pointer-2', rating: 4.1, reviews: 431, stock: 'low', accent: 0x22c55e } satisfies ProductCardData },
        // Pike — the league table's worst supplier, and all of it is cheap and in stock.
        { type: 'product', id: 'p7', data: { title: 'Braided USB-C Cable, 2 m', price: '$19.00', icon: 'lucide/cable', rating: 3.7, reviews: 94, stock: 'in', accent: 0x64748b } satisfies ProductCardData },
        { type: 'product', id: 'p8', data: { title: 'Laptop Stand, aluminium', price: '$39.00', icon: 'lucide/laptop', rating: 3.5, reviews: 260, stock: 'in', accent: 0x64748b } satisfies ProductCardData },
      ];

      const supplies = [
        { id: 'e1', source: 'corvus', target: 'p1' },
        { id: 'e2', source: 'corvus', target: 'p2' },
        { id: 'e3', source: 'corvus', target: 'p3' },
        { id: 'e4', source: 'meridian', target: 'p4' },
        { id: 'e5', source: 'meridian', target: 'p5' },
        { id: 'e6', source: 'meridian', target: 'p6' },
        { id: 'e7', source: 'pike', target: 'p7' },
        { id: 'e8', source: 'pike', target: 'p8' },
      ];

      // Focus: keep only lines that cannot ship at full rate, and the suppliers
      // still attached to one.
      const keptProducts = atRiskOnly
        ? products.filter((p) => (p.data as ProductCardData).stock !== 'in')
        : products;
      const keptIds = new Set(keptProducts.map((p) => p.id));
      const keptEdges = supplies.filter((e) => keptIds.has(e.target));
      const supplierIds = new Set(keptEdges.map((e) => e.source));
      const keptSuppliers = atRiskOnly ? suppliers.filter((s) => supplierIds.has(s.id)) : suppliers;

      return {
        nodes: [...keptSuppliers, ...keptProducts],
        edges: keptEdges.map((e) => ({ type: 'edge', ...e })),
      };
    }, [atRiskOnly]);

    // Squared-off chips: `chipRadius` is an ordinary spec field, so the
    // cards restyle without subclassing. Memoised because a card instance is
    // stateless and reusable — rebuilding it each render would churn `cardOf`,
    // and with it the whole canvas `config`.
    const product = useMemo(() => new ProductCard({ chipRadius: 1 }), []);
    const org = useMemo(() => new OrganisationCard({ chipRadius: 1 }), []);

    const cardOf = useCallback(
      (n: GraphNode): CompositeShapeOption =>
        n.type === 'product' ? product.build(n.data as ProductCardData) : org.build(n.data as OrganisationCardData),
      [product, org],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        activeLayout: 'elk',
        behaviours: {
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: { shape: cardOf, bgStrokeWidth: 0 },
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.2 }
              }
            },
            edge: {
              style: { shape: { pathType: 'orth' }, strokeColor: 0x94a3b8, strokeWidth: 1.2, strokeAlpha: 0.35, arrowTargetShape: 'triangle', arrowTargetSize: 6, arrowTargetColor: 0x94a3b8 },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2, strokeAlpha: 0.95, arrowTargetColor: 0xfbbf24 },
                dimmed: { strokeAlpha: 0.04 }
              }
            }
          }
        },
        layouts: { elk: { algorithm: 'layered', direction, nodeSpacing: 36, layerSpacing: 110, edgeNodeSpacing: 24 } }
      }),
      [cardOf, direction],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Which supplier’s stock position puts the most revenue at risk?');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Peak-season sourcing — Northwind Marketplace',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'at-risk',
                  icon: PackageX,
                  label: 'At-risk lines only: off',
                  activeLabel: 'At-risk lines only: on',
                  active: atRiskOnly,
                  onToggle: () => setAtRiskOnly((v) => !v)
                },
                {
                  type: 'select',
                  key: 'direction',
                  label: 'Direction',
                  value: direction,
                  options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                  onChange: (v) => setDirection(v as ElkDirection)
                },
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={80}
          options={{ nodeSize: (n) => { const c = cardOf(n); return { width: c.width, height: c.height }; } }}
        />

        {/* These cards are dense with small text, so keep it crisp as the
            camera zooms rather than letting it resolve to mush. */}
        <TextResolutionLODBehaviour />
      </GraphCanvasApp>
    );
  }
};
