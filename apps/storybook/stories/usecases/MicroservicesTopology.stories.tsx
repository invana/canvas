/**
 * **Microservices Topology** — Datadog / Istio / Linkerd-style service map,
 * dressed in the `<GraphCanvasApp>` shell. ~20 services across a SaaS stack laid
 * out with ELK `layered` (mounted as a `<ElkLayout>` child and pointed at by
 * `config.activeLayout`); the health state of each service (healthy / degraded /
 * down) drives node styling via state-configs; each edge's RPS scales the stroke
 * width and its error rate picks the stroke colour; degraded edges carry an
 * animated `marching-ants-connector` so the failing path pops out without the
 * user reading any numbers.
 *
 * The header carries a **simulate degradation** toggle — every 3s it flips a
 * random service's `states` to `degraded` and rolls it back, showing the live
 * wiring between a data update and state-config styling — plus **Settings**,
 * which docks `<CanvasSettingsEditorPanel>` so the ELK algorithm / direction /
 * spacing and every behaviour are editable live.
 *
 * Exercises: per-tier shape + glyph icon, state-config styling by data field
 * (`health`), data-driven edge styling (log-scaled width, banded colour),
 * animated decorations, RPS badge with resolvable label text.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { EdgeDecorationSpec, EdgeStyle, GraphCanvas, GraphData, GraphLayer } from '@invana/graph';
import {
  microservices,
  type MicroservicesEdgeData,
  type MicroservicesHealth,
  type MicroservicesTier,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Activity, Map, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'Usecases/Microservices Topology' };
export default meta;
type Story = StoryObj;

export const MicroservicesTopology: Story = {
  render: function Render() {
    const [minimapOn, setMinimapOn] = useState(true);
    const [simulateOn, setSimulateOn] = useState(false);
    // The live engine, lifted out of the app so the simulation effect can write
    // to the graph store. `data` / `config` are memoised, so this extra render
    // never re-seeds the canvas.
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (c) => (
            <CanvasSettingsEditorPanel canvas={c} className="border-0 bg-transparent shadow-none" />
          ),
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    const { data, healthStates } = useMemo(() => {
      const TIER_GLYPH: Record<MicroservicesTier, string> = {
        gateway: 'G',
        api: 'A',
        logic: 'L',
        data: 'D',
        external: 'E',
      };
      const TIER_FILL: Record<MicroservicesTier, number> = {
        gateway: 0x0ea5e9, // sky
        api: 0x6366f1, // indigo
        logic: 0x8b5cf6, // violet
        data: 0x64748b, // slate
        external: 0x14b8a6, // teal
      };

      const formatRps = (rps: number): string =>
        rps >= 1000 ? `${(rps / 1000).toFixed(1)}k` : String(rps);

      /** Dataset health → the state names the layer's state catalogue defines. */
      const toStates = (h: MicroservicesHealth): readonly string[] | undefined => {
        if (h === 'degraded') return ['degraded'];
        if (h === 'down') return ['down'];
        return undefined; // healthy is the implicit default
      };

      const buildEdgeStyle = (d: MicroservicesEdgeData): EdgeStyle => {
        // Stroke width scales with log(rps), so a 6000 RPS edge is ~3× a 100 RPS
        // edge instead of 60×.
        const width = 1 + Math.log10(Math.max(1, d.rps)) * 0.55;
        const colour =
          d.errorRate >= 0.2 ? 0xdc2626 : d.errorRate >= 0.05 ? 0xea580c : d.errorRate >= 0.01 ? 0xf59e0b : 0x94a3b8;
        const decorations: EdgeDecorationSpec[] = [];
        if (d.errorRate >= 0.05) {
          decorations.push({
            id: 'degraded-ants',
            kind: 'marching-ants-connector',
            color: colour,
            strokeWidth: width + 0.5,
            dashLength: 6,
          });
        }
        return {
          shape: { pathType: 'rounded', pathStyleOpts: { radius: 8 } },
          strokeColor: colour,
          strokeWidth: width,
          strokeAlpha: d.errorRate >= 0.2 ? 0.95 : 0.7,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 7,
          arrowTargetColor: colour,
          ...(decorations.length > 0 ? { decorations } : {}),
          ...(d.rps > 0
            ? {
                labelText: formatRps(d.rps),
                labelColor: 0x64748b,
                labelFontSize: 9,
                labelBackgroundAlpha: 0.85,
                labelBackgroundPadding: 2,
                labelBackgroundCornerRadius: 3,
              }
            : {}),
        };
      };

      const graph: GraphData = {
        nodes: microservices.nodes.map((n) => ({
          id: n.id,
          type: n.data.tier,
          data: n.data,
          style: {
            shape: { kind: 'rect', width: 168, height: 46, cornerRadius: 8 },
            bgFill: TIER_FILL[n.data.tier],
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1.5,
            icon: {
              kind: 'glyph',
              char: TIER_GLYPH[n.data.tier],
              fontFamily: 'sans-serif',
              fontWeight: 700,
              color: 0xffffff,
              alpha: 0.45,
              sizeRatio: 0.6,
              anchor: 'top-left',
              offsetX: 8,
              offsetY: 8,
            },
            labelText: n.id,
            labelColor: 0xffffff,
            labelFontSize: 11,
            labelFontWeight: 600,
            labelPlacement: 'center',
            badges:
              n.data.rps > 0
                ? [
                    {
                      id: 'rps',
                      placement: 'top-right',
                      origin: 'center',
                      shape: { kind: 'rect', width: 44, height: 16, cornerRadius: 8 },
                      fill: 0x111827,
                      strokeColor: 0xffffff,
                      strokeWidth: 1.2,
                      labelText: formatRps(n.data.rps),
                      labelColor: 0xffffff,
                      labelFontSize: 10,
                    },
                  ]
                : [],
          },
          states: toStates(n.data.health),
        })),
        edges: microservices.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'CALLS',
          data: e.data,
          style: buildEdgeStyle(e.data),
        })),
      };

      return { data: graph, healthStates: toStates };
    }, []);

    const config: CanvasConfig = useMemo(
      () => ({
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // Tier colours are stamped per node above.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', inactiveState: 'dimmed', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              state: {
                // `degraded` / `down` are story-local state names — declared
                // here so the layer's state catalogue recognises the names each
                // node lists in `states`.
                degraded: {
                  bgStrokeColor: 0xf59e0b,
                  bgStrokeWidth: 3,
                  effects: { breathing: { amplitude: 0.18, frequencyHz: 1.4 } },
                },
                down: {
                  bgStrokeColor: 0xdc2626,
                  bgStrokeWidth: 3,
                  bgAlpha: 0.55,
                  decorations: [
                    { id: 'down-pulse', kind: 'pulse-ring', color: 0xdc2626, periodMs: 1200, maxRadius: 20 },
                  ],
                },
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
              },
            },
            edge: {
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2.4,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24,
                },
              },
            },
          },
          minimap: { position: 'bottom-right', width: 220, height: 160 },
        },
        layouts: {
          elk: {
            algorithm: 'layered',
            direction: 'RIGHT',
            nodeSpacing: 32,
            layerSpacing: 110,
            edgeSpacing: 16,
          },
        },
      }),
      [],
    );

    // Live incident simulation: flip one random non-edge-tier service to
    // `degraded` every 3s and roll it back 2.2s later. Writing `states` on the
    // graph store is all it takes — the state-config above does the styling.
    useEffect(() => {
      if (!simulateOn || !canvas) return;
      const layer = canvas.layers.get<GraphLayer>('graph');
      if (!layer) return;

      const candidates = microservices.nodes.filter(
        (n) => n.data.tier !== 'gateway' && n.data.tier !== 'external',
      );
      const rollbacks: ReturnType<typeof setTimeout>[] = [];
      const timer = setInterval(() => {
        const victim = candidates[Math.floor(Math.random() * candidates.length)]!;
        layer.store.updateNode(victim.id, { states: ['degraded'] });
        rollbacks.push(
          setTimeout(() => {
            // Restore the dataset-authored health.
            layer.store.updateNode(victim.id, { states: healthStates(victim.data.health) });
          }, 2200),
        );
      }, 3000);

      return () => {
        clearInterval(timer);
        for (const t of rollbacks) clearTimeout(t);
        // Leave the graph as the dataset authored it.
        for (const n of candidates) {
          layer.store.updateNode(n.id, { states: healthStates(n.data.health) });
        }
      };
    }, [simulateOn, canvas, healthStates]);

    const onReady = useCallback((c: GraphCanvas | null) => {
      setCanvas(c);
      if (!c) return;
      c.showMessage('Edge width = RPS · colour = error rate · toggle the incident simulation in the header');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Microservices Topology',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'toggle',
                    key: 'simulate',
                    icon: Activity,
                    label: 'Simulate degradation: off',
                    activeLabel: 'Simulate degradation: on',
                    active: simulateOn,
                    onToggle: () => setSimulateOn((v) => !v),
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
          {/* Registered as `elk`; `config.activeLayout` runs it once data is in.
              `fitPadding` frames the graph when the solve completes — the app's
              own `fitOnLoad` fires against the pre-layout positions, so an
              async layout has to own the final fit. */}
          <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />

          {minimapOn && <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />}
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
