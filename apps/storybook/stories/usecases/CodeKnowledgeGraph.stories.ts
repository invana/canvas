/**
 * **Code Knowledge Graph** — Sourcegraph-Cody / Cursor / Augment-style
 * code intelligence overview. Modules across feature packages are drawn
 * as a hierarchical DAG; edges encode `imports`. Per-module test
 * coverage and error counts ride along as node badges so the picture
 * doubles as a code-health dashboard.
 *
 * Exercises: `ElkLayout` (layered DAG), node `badges` resolved from
 * per-item data, `HoverActivateBehaviour` (1-hop focal emphasis),
 * `ClickSelectBehaviour` (shift+click multi), `DragNodeBehaviour`, and a
 * `MiniMapLayer` for navigation on larger codebases.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  MiniMapLayer,
  type GraphEdge,
  type GraphNode,
  type NodeBadge,
} from '@invana/graph';
import { ElkLayout, type ElkDirection } from '@invana/graph-layout-elkjs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';
import { SystemThemeBehaviour } from '../system-theme';

const meta: Meta = { title: 'Usecases/Code Knowledge Graph' };
export default meta;
type Story = StoryObj;

export const CodeKnowledgeGraph: Story = {
  render: () => createContainer({ id: 'usecase-code-kg' }),

  play: async ({ canvasElement }) => {
    // ── Synthetic codebase — 4 feature packages + `shared`, 18 modules.
    // Each node carries plain data; visual fields (fill, badges) are
    // resolved from `data` via field-level resolvers on the layer
    // template below, so the per-item entries stay readable in
    // Storybook's "Show code" tab.
    type CodePkg = 'auth' | 'billing' | 'search' | 'payments' | 'shared';
    type CodeNodeData = {
      package: CodePkg;
      file: string;
      coverage: number; // 0–100
      errors: number;
    };

    const PKG_FILL: Record<CodePkg, number> = {
      auth: 0x6366f1, // indigo
      billing: 0x10b981, // emerald
      search: 0xf59e0b, // amber
      payments: 0xec4899, // pink
      shared: 0x64748b, // slate
    };

    const nodes: GraphNode<CodeNodeData>[] = [
      { id: 'AuthService',      data: { package: 'auth',     file: 'auth/AuthService.ts',         coverage: 89, errors: 0 } },
      { id: 'TokenStore',       data: { package: 'auth',     file: 'auth/TokenStore.ts',          coverage: 76, errors: 0 } },
      { id: 'OAuthProvider',    data: { package: 'auth',     file: 'auth/OAuthProvider.ts',       coverage: 54, errors: 2 } },
      { id: 'PasswordHasher',   data: { package: 'auth',     file: 'auth/PasswordHasher.ts',      coverage: 92, errors: 0 } },
      { id: 'SessionManager',   data: { package: 'auth',     file: 'auth/SessionManager.ts',      coverage: 71, errors: 0 } },
      { id: 'BillingEngine',    data: { package: 'billing',  file: 'billing/BillingEngine.ts',    coverage: 83, errors: 1 } },
      { id: 'InvoiceGenerator', data: { package: 'billing',  file: 'billing/InvoiceGenerator.ts', coverage: 67, errors: 0 } },
      { id: 'TaxCalculator',    data: { package: 'billing',  file: 'billing/TaxCalculator.ts',    coverage: 95, errors: 0 } },
      { id: 'SearchIndex',      data: { package: 'search',   file: 'search/SearchIndex.ts',       coverage: 58, errors: 3 } },
      { id: 'QueryParser',      data: { package: 'search',   file: 'search/QueryParser.ts',       coverage: 79, errors: 0 } },
      { id: 'RankingEngine',    data: { package: 'search',   file: 'search/RankingEngine.ts',     coverage: 41, errors: 0 } },
      { id: 'PaymentProcessor', data: { package: 'payments', file: 'payments/PaymentProcessor.ts', coverage: 88, errors: 0 } },
      { id: 'StripeAdapter',    data: { package: 'payments', file: 'payments/StripeAdapter.ts',   coverage: 72, errors: 0 } },
      { id: 'RefundService',    data: { package: 'payments', file: 'payments/RefundService.ts',   coverage: 65, errors: 1 } },
      { id: 'Logger',           data: { package: 'shared',   file: 'shared/Logger.ts',            coverage: 100, errors: 0 } },
      { id: 'EventBus',         data: { package: 'shared',   file: 'shared/EventBus.ts',          coverage: 91, errors: 0 } },
      { id: 'Database',         data: { package: 'shared',   file: 'shared/Database.ts',          coverage: 87, errors: 0 } },
      { id: 'ConfigLoader',     data: { package: 'shared',   file: 'shared/ConfigLoader.ts',      coverage: 100, errors: 0 } },
    ];

    const edges: GraphEdge[] = [
      // auth
      { id: 'e1',  source: 'AuthService',    target: 'TokenStore' },
      { id: 'e2',  source: 'AuthService',    target: 'SessionManager' },
      { id: 'e3',  source: 'AuthService',    target: 'Database' },
      { id: 'e4',  source: 'AuthService',    target: 'Logger' },
      { id: 'e5',  source: 'OAuthProvider',  target: 'AuthService' },
      { id: 'e6',  source: 'OAuthProvider',  target: 'TokenStore' },
      { id: 'e7',  source: 'SessionManager', target: 'Database' },
      { id: 'e8',  source: 'SessionManager', target: 'EventBus' },
      { id: 'e9',  source: 'PasswordHasher', target: 'ConfigLoader' },
      // billing
      { id: 'e10', source: 'BillingEngine',     target: 'Database' },
      { id: 'e11', source: 'BillingEngine',     target: 'InvoiceGenerator' },
      { id: 'e12', source: 'BillingEngine',     target: 'TaxCalculator' },
      { id: 'e13', source: 'BillingEngine',     target: 'EventBus' },
      { id: 'e14', source: 'BillingEngine',     target: 'Logger' },
      { id: 'e15', source: 'InvoiceGenerator',  target: 'TaxCalculator' },
      { id: 'e16', source: 'InvoiceGenerator',  target: 'Logger' },
      // payments
      { id: 'e17', source: 'PaymentProcessor', target: 'StripeAdapter' },
      { id: 'e18', source: 'PaymentProcessor', target: 'BillingEngine' },
      { id: 'e19', source: 'PaymentProcessor', target: 'EventBus' },
      { id: 'e20', source: 'PaymentProcessor', target: 'Logger' },
      { id: 'e21', source: 'RefundService',    target: 'PaymentProcessor' },
      { id: 'e22', source: 'RefundService',    target: 'BillingEngine' },
      { id: 'e23', source: 'StripeAdapter',    target: 'ConfigLoader' },
      { id: 'e24', source: 'StripeAdapter',    target: 'Logger' },
      // search
      { id: 'e25', source: 'SearchIndex',   target: 'Database' },
      { id: 'e26', source: 'SearchIndex',   target: 'Logger' },
      { id: 'e27', source: 'QueryParser',   target: 'ConfigLoader' },
      { id: 'e28', source: 'RankingEngine', target: 'SearchIndex' },
    ];

    const settings = {
      direction: 'RIGHT' as ElkDirection,
      showBadges: true,
      hoverEmphasis: true,
    };

    // Resolver: build a badge bag from each node's data. Coverage colour
    // bands at 80% / 60% match the GitHub Codecov convention. Errors
    // badge only renders when there's actually something to flag.
    const resolveBadges = (n: GraphNode): readonly NodeBadge[] => {
      if (!settings.showBadges) return [];
      const d = n.data as CodeNodeData;
      const coverageFill =
        d.coverage >= 80 ? 0x16a34a : d.coverage >= 60 ? 0xd97706 : 0xdc2626;
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
    };

    // ── Canvas setup — register everything by id, then init() last ───────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-code-kg')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Graph layer: only resolver fields (bgFill, labelText, badges) and
    // initData live in the constructor; literal style goes to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        node: {
          style: {
            bgFill: (n: GraphNode) => PKG_FILL[(n.data as CodeNodeData).package],
            labelText: (n: GraphNode) => n.id,
            badges: resolveBadges,
          },
        },
      },
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.layers.add(
      new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } }),
    );

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }),
    );

    const hover = new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' });
    canvas.behaviours.register(hover);

    canvas.behaviours.register(
      new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }),
    );

    canvas.behaviours.register(
      new SystemThemeBehaviour({ id: 'system-theme', targetLayerId: 'bg' }),
    );

    // ── Layout — register the ELK layout; activeLayout auto-runs on mount.
    // `ElkLayout`'s constructor surface is its ELK params only; the engine's
    // id / target wiring rides on the instance, so set those after construction.
    const layout = new ElkLayout();
    Object.assign(layout, { id: 'elk', targetLayerId: 'graph' });
    layout.events.on('end', ({ reason }) => {
      if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
    });
    canvas.layouts.add(layout);
    onStoryTeardown(() => layout.stop());

    // ── Serialisable config ─────────────────────────────────────────────
    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0f172a',
          color: '#334155',
          size: 1.2,
          spacing: 26,
          alpha: 0.7,
        },
        graph: {
          node: {
            style: {
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
              // `selected` is auto-merged via DEFAULT_NODE_STATE_CONFIGS;
              // override for a thick white ring against the indigo / emerald.
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
        minimap: {
          position: 'bottom-right',
          width: 220,
          height: 160,
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
        select: { enabled: true, multiple: true, trigger: ['shift'] },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
          dark: { backgroundColor: '#0f172a', color: '#334155' },
        },
      },
      layouts: {
        elk: {
          algorithm: 'layered',
          direction: settings.direction,
          nodeSpacing: 28,
          layerSpacing: 90,
        },
      },
      activeLayout: 'elk',
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Wipe each node's per-instance style so `resolveNodeStyle` re-runs
    // the layer template's resolvers against the live `settings` (the
    // `badges` resolver reads `settings.showBadges`).
    const rerenderAll = (): void => {
      for (const node of graph.store.nodes()) {
        graph.store.updateNode(node.id, { style: undefined });
      }
    };

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Code Knowledge Graph' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(settings, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT'])
      .name('layout direction')
      .onFinishChange((v: ElkDirection) => {
        canvasOptions.layouts.elk.direction = v;
        canvas.update({ layouts: { elk: canvasOptions.layouts.elk } });
      });

    gui
      .add(settings, 'showBadges')
      .name('show badges')
      .onChange(rerenderAll);

    gui
      .add(settings, 'hoverEmphasis')
      .name('hover focal emphasis')
      .onChange((on: boolean) => (on ? hover.enable() : hover.disable()));

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
