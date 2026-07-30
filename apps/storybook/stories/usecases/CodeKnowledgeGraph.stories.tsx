/**
 * **Code Knowledge Graph** — Sourcegraph-Cody / Cursor / Augment-style code
 * intelligence overview, composed from `<GraphCanvasApp>`. Modules across
 * feature packages are drawn as a hierarchical DAG (`<ElkLayout>` `layered`,
 * pointed at by `config.activeLayout`); edges encode `imports`. Per-module test
 * coverage and error counts ride along as node **badges** resolved from each
 * node's data, so the picture doubles as a code-health dashboard.
 *
 * The header's **direction** picker re-runs ELK through
 * `config.layouts.elk.direction`, and **Settings** docks
 * `<CanvasSettingsEditorPanel>` for the rest of the ELK params, the hover
 * emphasis, and every other registered surface.
 *
 * Exercises: `ElkLayout` (layered DAG), node `badges` resolved from per-item
 * data, 1-hop hover focal emphasis, shift+click multi-select, node dragging, and
 * a `MiniMapLayer` for navigation on larger codebases.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, MiniMapLayer } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels,
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData, GraphNode, NodeBadge } from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { ThemeProvider } from '@invana/themes';
import { Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'Usecases/Code Knowledge Graph' };
export default meta;
type Story = StoryObj;

export const CodeKnowledgeGraph: Story = {
  render: function Render() {
    // A synthetic codebase — 4 feature packages + `shared`, 18 modules. Each
    // node carries plain data; every visual field (fill, badges) is resolved
    // from it by the layer template below, so the entries stay readable.
    type CodePkg = 'auth' | 'billing' | 'search' | 'payments' | 'shared';
    interface CodeNodeData {
      package: CodePkg;
      file: string;
      coverage: number; // 0–100
      errors: number;
    }

    const PKG_FILL: Record<CodePkg, number> = {
      auth: 0x6366f1, // indigo
      billing: 0x10b981, // emerald
      search: 0xf59e0b, // amber
      payments: 0xec4899, // pink
      shared: 0x64748b, // slate
    };

    const [direction, setDirection] = useState<ElkDirection>('RIGHT');
    const [minimapOn, setMinimapOn] = useState(true);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    const data: GraphData = useMemo(
      () => ({
        nodes: [
          { id: 'AuthService',      type: 'auth',     data: { package: 'auth',     file: 'auth/AuthService.ts',          coverage: 89,  errors: 0 } },
          { id: 'TokenStore',       type: 'auth',     data: { package: 'auth',     file: 'auth/TokenStore.ts',           coverage: 76,  errors: 0 } },
          { id: 'OAuthProvider',    type: 'auth',     data: { package: 'auth',     file: 'auth/OAuthProvider.ts',        coverage: 54,  errors: 2 } },
          { id: 'PasswordHasher',   type: 'auth',     data: { package: 'auth',     file: 'auth/PasswordHasher.ts',       coverage: 92,  errors: 0 } },
          { id: 'SessionManager',   type: 'auth',     data: { package: 'auth',     file: 'auth/SessionManager.ts',       coverage: 71,  errors: 0 } },
          { id: 'BillingEngine',    type: 'billing',  data: { package: 'billing',  file: 'billing/BillingEngine.ts',     coverage: 83,  errors: 1 } },
          { id: 'InvoiceGenerator', type: 'billing',  data: { package: 'billing',  file: 'billing/InvoiceGenerator.ts',  coverage: 67,  errors: 0 } },
          { id: 'TaxCalculator',    type: 'billing',  data: { package: 'billing',  file: 'billing/TaxCalculator.ts',     coverage: 95,  errors: 0 } },
          { id: 'SearchIndex',      type: 'search',   data: { package: 'search',   file: 'search/SearchIndex.ts',        coverage: 58,  errors: 3 } },
          { id: 'QueryParser',      type: 'search',   data: { package: 'search',   file: 'search/QueryParser.ts',        coverage: 79,  errors: 0 } },
          { id: 'RankingEngine',    type: 'search',   data: { package: 'search',   file: 'search/RankingEngine.ts',      coverage: 41,  errors: 0 } },
          { id: 'PaymentProcessor', type: 'payments', data: { package: 'payments', file: 'payments/PaymentProcessor.ts', coverage: 88,  errors: 0 } },
          { id: 'StripeAdapter',    type: 'payments', data: { package: 'payments', file: 'payments/StripeAdapter.ts',    coverage: 72,  errors: 0 } },
          { id: 'RefundService',    type: 'payments', data: { package: 'payments', file: 'payments/RefundService.ts',    coverage: 65,  errors: 1 } },
          { id: 'Logger',           type: 'shared',   data: { package: 'shared',   file: 'shared/Logger.ts',             coverage: 100, errors: 0 } },
          { id: 'EventBus',         type: 'shared',   data: { package: 'shared',   file: 'shared/EventBus.ts',           coverage: 91,  errors: 0 } },
          { id: 'Database',         type: 'shared',   data: { package: 'shared',   file: 'shared/Database.ts',           coverage: 87,  errors: 0 } },
          { id: 'ConfigLoader',     type: 'shared',   data: { package: 'shared',   file: 'shared/ConfigLoader.ts',       coverage: 100, errors: 0 } },
        ],
        edges: [
          // auth
          { id: 'e1', source: 'AuthService', target: 'TokenStore', type: 'IMPORTS' },
          { id: 'e2', source: 'AuthService', target: 'SessionManager', type: 'IMPORTS' },
          { id: 'e3', source: 'AuthService', target: 'Database', type: 'IMPORTS' },
          { id: 'e4', source: 'AuthService', target: 'Logger', type: 'IMPORTS' },
          { id: 'e5', source: 'OAuthProvider', target: 'AuthService', type: 'IMPORTS' },
          { id: 'e6', source: 'OAuthProvider', target: 'TokenStore', type: 'IMPORTS' },
          { id: 'e7', source: 'SessionManager', target: 'Database', type: 'IMPORTS' },
          { id: 'e8', source: 'SessionManager', target: 'EventBus', type: 'IMPORTS' },
          { id: 'e9', source: 'PasswordHasher', target: 'ConfigLoader', type: 'IMPORTS' },
          // billing
          { id: 'e10', source: 'BillingEngine', target: 'Database', type: 'IMPORTS' },
          { id: 'e11', source: 'BillingEngine', target: 'InvoiceGenerator', type: 'IMPORTS' },
          { id: 'e12', source: 'BillingEngine', target: 'TaxCalculator', type: 'IMPORTS' },
          { id: 'e13', source: 'BillingEngine', target: 'EventBus', type: 'IMPORTS' },
          { id: 'e14', source: 'BillingEngine', target: 'Logger', type: 'IMPORTS' },
          { id: 'e15', source: 'InvoiceGenerator', target: 'TaxCalculator', type: 'IMPORTS' },
          { id: 'e16', source: 'InvoiceGenerator', target: 'Logger', type: 'IMPORTS' },
          // payments
          { id: 'e17', source: 'PaymentProcessor', target: 'StripeAdapter', type: 'IMPORTS' },
          { id: 'e18', source: 'PaymentProcessor', target: 'BillingEngine', type: 'IMPORTS' },
          { id: 'e19', source: 'PaymentProcessor', target: 'EventBus', type: 'IMPORTS' },
          { id: 'e20', source: 'PaymentProcessor', target: 'Logger', type: 'IMPORTS' },
          { id: 'e21', source: 'RefundService', target: 'PaymentProcessor', type: 'IMPORTS' },
          { id: 'e22', source: 'RefundService', target: 'BillingEngine', type: 'IMPORTS' },
          { id: 'e23', source: 'StripeAdapter', target: 'ConfigLoader', type: 'IMPORTS' },
          { id: 'e24', source: 'StripeAdapter', target: 'Logger', type: 'IMPORTS' },
          // search
          { id: 'e25', source: 'SearchIndex', target: 'Database', type: 'IMPORTS' },
          { id: 'e26', source: 'SearchIndex', target: 'Logger', type: 'IMPORTS' },
          { id: 'e27', source: 'QueryParser', target: 'ConfigLoader', type: 'IMPORTS' },
          { id: 'e28', source: 'RankingEngine', target: 'SearchIndex', type: 'IMPORTS' },
        ],
      }),
      [],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // Package colours come from the `bgFill` resolver below.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: {
                bgFill: (n: GraphNode) => PKG_FILL[(n.data as CodeNodeData).package],
                labelText: (n: GraphNode) => n.id,
                // Coverage colour bands at 80 % / 60 % follow the Codecov
                // convention; the errors badge only renders when there's
                // something to flag.
                badges: (n: GraphNode): readonly NodeBadge[] => {
                  const d = n.data as CodeNodeData;
                  const coverageFill = d.coverage >= 80 ? 0x16a34a : d.coverage >= 60 ? 0xd97706 : 0xdc2626;
                  const badges: NodeBadge[] = [
                    {
                      id: 'coverage',
                      placement: 'top-right',
                      origin: 'center',
                      shape: { kind: 'rect', width: 34, height: 16, cornerRadius: 8 },
                      fill: coverageFill,
                      strokeColor: 0xffffff,
                      strokeWidth: 1.5,
                      labelText: `${d.coverage}%`,
                      labelColor: 0xffffff,
                      labelFontSize: 10,
                    },
                  ];
                  if (d.errors > 0) {
                    badges.push({
                      id: 'errors',
                      placement: 'top-left',
                      origin: 'center',
                      shape: { kind: 'circle', radius: 9 },
                      fill: 0xdc2626,
                      strokeColor: 0xffffff,
                      strokeWidth: 1.5,
                      labelText: String(d.errors),
                      labelColor: 0xffffff,
                      labelFontSize: 11,
                    });
                  }
                  return badges;
                },
                shape: { kind: 'rect', width: 168, height: 46, cornerRadius: 8 },
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1.5,
                labelColor: 0xffffff,
                labelFontSize: 12,
                labelFontWeight: 600,
                labelPlacement: 'center',
              },
              state: {
                // Sharper highlight ring against the saturated package fills.
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
                strokeColor: 0x94a3b8,
                strokeWidth: 1.3,
                strokeAlpha: 0.75,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 8,
                arrowTargetColor: 0x94a3b8,
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24,
                },
              },
            },
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 },
        },
        layouts: {
          elk: { algorithm: 'layered', direction, nodeSpacing: 28, layerSpacing: 90 },
        },
      }),
      // PKG_FILL is a render-local literal the config closes over once.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [direction],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Badges show test coverage · red circle = open errors');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Code Knowledge Graph',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'direction',
                    label: 'Direction',
                    value: direction,
                    options: { RIGHT: 'Right', DOWN: 'Down', LEFT: 'Left', UP: 'Up' },
                    onChange: (v) => setDirection(v as ElkDirection),
                  },
                  {
                    type: 'toggle',
                    key: 'minimap',
                    icon: Map,
                    label: 'Minimap: off',
                    activeLabel: 'Minimap: on',
                    active: minimapOn,
                    onToggle: () => setMinimapOn((v) => !v),
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
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
          right={dock.region}
        >
          {/* Registered as `elk`; `config.activeLayout` runs it once data is in,
              and re-runs it whenever the direction patch lands. */}
          <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
