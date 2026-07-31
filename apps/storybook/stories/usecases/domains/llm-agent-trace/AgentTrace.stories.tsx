/**
 * **LLM Agent Trace** — LangSmith / Langfuse / Helicone-style execution graph for
 * a single agent run, composed from `<GraphCanvasApp>`. Each node is one of
 * `llm` (model call), `tool` (function call), `decision` (branch), `output`
 * (terminal). Status (`success` / `error` / `pending`) drives the styling —
 * failed nodes pulse red, pending nodes carry a pulse-ring decoration, and edges
 * between successful steps animate flow particles to draw the eye along the path.
 *
 * Three preset traces are baked into the dataset; the header's **Trace** picker
 * swaps between them so the same story shows a happy path, an error+retry path,
 * and a multi-tool branching path. Picking one hands the app a new `data`
 * identity, which re-seeds the graph and re-runs the ELK layout. The **Settings**
 * toggle docks `<CanvasSettingsEditorPanel>` for the ELK params and behaviours.
 *
 * Exercises: `ElkLayout` `layered` `DOWN`, per-kind node shape, state-config
 * styling on `error` / `pending`, animated edge decorations
 * (`flow-particles-connector`, `marching-ants-connector`), per-edge labels read
 * from edge data.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout } from '@invana/canvas-react';
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
import type { EdgeDecorationSpec, EdgeStyle, GraphCanvas, GraphData, NodeShapeOptions } from '@invana/graph';
import {
  agentTrace,
  type AgentTraceNodeKind,
  type AgentTraceStatus,
} from '@invana/graph-datasets/usecase-demos';
import { ThemeProvider } from '@invana/themes';
import { Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/llm-agent-trace/AgentTrace' };
export default meta;
type Story = StoryObj;

export const AgentTraceStory: Story = {
  name: 'AgentTrace',
  render: function Render() {
    const [presetId, setPresetId] = useState(agentTrace[0]!.id);

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

    // Rebuilt per preset — a new `data` identity re-seeds the graph and the
    // active ELK layout re-runs on the topology change.
    const data: GraphData = useMemo(() => {
      // Shape disambiguates kind at a glance: llm = soft circle, tool = rect,
      // decision = diamond, output = pill.
      const SHAPE_BY_KIND: Record<AgentTraceNodeKind, NodeShapeOptions> = {
        llm: { kind: 'circle', radius: 30 },
        tool: { kind: 'rect', width: 150, height: 44, cornerRadius: 6 },
        decision: { kind: 'regular-polygon', sides: 4, radius: 32, rotation: Math.PI / 4 },
        output: { kind: 'rect', width: 170, height: 40, cornerRadius: 20 },
      };
      const FILL_BY_KIND: Record<AgentTraceNodeKind, number> = {
        llm: 0x8b5cf6, // violet
        tool: 0x0ea5e9, // sky
        decision: 0xf59e0b, // amber
        output: 0x14b8a6, // teal
      };
      const STATUS_TINT: Record<AgentTraceStatus, number> = {
        success: 0x16a34a,
        error: 0xdc2626,
        pending: 0x94a3b8,
      };

      const trace = agentTrace.find((t) => t.id === presetId) ?? agentTrace[0]!;
      // Edge styling reads both endpoints: a failure on either end mutes the
      // edge; the clean success path picks up the flow-particle decoration.
      const statusById = new Map(trace.nodes.map((n) => [n.id, n.data.status]));

      return {
        nodes: trace.nodes.map((n) => ({
          id: n.id,
          type: n.data.kind,
          data: n.data,
          style: {
            shape: SHAPE_BY_KIND[n.data.kind],
            bgFill: FILL_BY_KIND[n.data.kind],
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1.5,
            labelText: n.data.label,
            labelColor: 0xffffff,
            labelFontSize: n.data.kind === 'tool' ? 10 : 11,
            labelFontWeight: 600,
            labelPlacement: 'center',
          },
          states:
            n.data.status === 'error'
              ? ['error']
              : n.data.status === 'pending'
                ? ['pending']
                : undefined,
        })),
        edges: trace.edges.map((e) => {
          const sStatus = statusById.get(e.source);
          const tStatus = statusById.get(e.target);
          const failed = sStatus === 'error' || tStatus === 'error';
          const pending = sStatus === 'pending' || tStatus === 'pending';
          const onActivePath = !failed && !pending && e.data.kind !== 'branch';

          const decorations: EdgeDecorationSpec[] = [];
          if (failed) {
            decorations.push({
              id: 'failed-ants',
              kind: 'marching-ants-connector',
              color: STATUS_TINT.error,
              strokeWidth: 1.5,
              dashLength: 6,
            });
          } else if (onActivePath) {
            decorations.push({
              id: 'flow',
              kind: 'flow-particles-connector',
              color: 0x14b8a6,
              count: 4,
              size: 4,
              speedPxPerSec: 90,
            });
          }

          // A `returns` edge is labelled with the token count its source step
          // consumed — the one number worth reading off the wire.
          const tokens =
            e.data.kind === 'returns'
              ? trace.nodes.find((n) => n.id === e.source)?.data.tokens
              : undefined;

          const style: EdgeStyle = {
            ...(failed
              ? { strokeColor: STATUS_TINT.error, strokeAlpha: 0.55, arrowTargetColor: STATUS_TINT.error }
              : pending
                ? {
                    strokeColor: STATUS_TINT.pending,
                    strokeAlpha: 0.35,
                    strokeDashArray: [4, 4] as const,
                    arrowTargetColor: STATUS_TINT.pending,
                  }
                : {}),
            ...(decorations.length > 0 ? { decorations } : {}),
            ...(tokens !== undefined ? { labelText: `${tokens}t` } : {}),
          };

          return { id: e.id, source: e.source, target: e.target, type: e.data.kind, data: e.data, style };
        }),
      };
    }, [presetId]);

    const config: CanvasConfig = useMemo(
      () => ({
        // The ELK layout mounted as a child below owns the arrangement.
        activeLayout: 'elk',
        behaviours: {
          // Kind colours are stamped per node above.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, clearOnBackground: true },
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              state: {
                // `error` / `pending` carry richer overlays than the built-in
                // colour shift: error grows a thick red stroke and breathes,
                // pending dims and carries a pulse-ring.
                error: {
                  bgStrokeColor: 0xdc2626,
                  bgStrokeWidth: 3,
                  effects: { breathing: { amplitude: 0.18, frequencyHz: 1.5 } },
                },
                pending: {
                  bgStrokeColor: 0x94a3b8,
                  bgStrokeWidth: 2,
                  bgAlpha: 0.55,
                  decorations: [
                    { id: 'pending-pulse', kind: 'pulse-ring', color: 0x94a3b8, periodMs: 1600, maxRadius: 18 },
                  ],
                },
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
              },
            },
            edge: {
              style: {
                shape: { pathType: 'bezier', pathStyleOpts: { axis: 'v', tension: 0.55 } },
                strokeColor: 0x94a3b8,
                strokeWidth: 1.4,
                strokeAlpha: 0.8,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 8,
                arrowTargetColor: 0x94a3b8,
                labelColor: 0x64748b,
                labelFontSize: 10,
                labelBackgroundAlpha: 0.85,
                labelBackgroundPadding: 3,
                labelBackgroundCornerRadius: 3,
              },
              state: {
                highlighted: {
                  strokeColor: 0xfbbf24,
                  strokeWidth: 2.2,
                  strokeAlpha: 1,
                  arrowTargetColor: 0xfbbf24,
                },
              },
            },
          },
        },
        layouts: {
          elk: {
            algorithm: 'layered',
            direction: 'DOWN',
            nodeSpacing: 36,
            layerSpacing: 80,
            edgeNodeSpacing: 28,
            edgeSpacing: 18,
          },
        },
      }),
      [],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Switch traces from the header — happy path · error + retry · multi-tool branch');
    }, []);

    return (
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'LLM Agent Trace',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'preset',
                    label: 'Trace',
                    value: presetId,
                    options: Object.fromEntries(agentTrace.map((t) => [t.id, t.id])),
                    onChange: setPresetId,
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
              and re-runs it on every preset swap. */}
          <ElkLayout id="elk" targetLayerId="graph" fitPadding={80} />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
