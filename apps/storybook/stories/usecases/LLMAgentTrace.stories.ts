/**
 * **LLM Agent Trace** — LangSmith / Langfuse / Helicone-style execution
 * graph for a single agent run. Each node is one of:
 * `llm` (model call), `tool` (function call), `decision` (branch),
 * `output` (terminal). Status (`success` / `error` / `pending`) drives
 * the styling — failed nodes pulse red, pending nodes carry a
 * pulse-ring decoration, and edges between successful steps animate
 * flow particles to draw the eye along the path.
 *
 * Three preset traces are baked into the dataset; the GUI swaps between
 * them so the same story shows a happy path, an error+retry path, and
 * a multi-tool branching path.
 *
 * Exercises: `ElkLayout` `layered` `DOWN`, per-kind node shape,
 * state-config-driven styling on `error` / `pending`, animated edge
 * decorations (`flow-particles-connector`, `marching-ants-connector`),
 * edge label resolvers reading per-edge data. Built the new way:
 * register layers/behaviours/layout by id, then a single serialisable
 * `canvasOptions` object, then `init()` last.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  type EdgeData,
  type EdgeDecorationSpec,
  type EdgeStyle,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  agentTrace,
  type AgentTraceEdgeData,
  type AgentTraceNodeData,
  type AgentTraceNodeKind,
  type AgentTraceStatus,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';
import { SystemThemeBehaviour } from '../system-theme';

const meta: Meta = { title: 'Usecases/LLM Agent Trace' };
export default meta;
type Story = StoryObj;

export const LLMAgentTrace: Story = {
  render: () => createContainer({ id: 'usecase-agent-trace' }),

  play: async ({ canvasElement }) => {
    // Per-kind shape + fill. Shape disambiguates kind at a glance:
    // llm = soft circle, tool = rect, decision = diamond, output = pill.
    const SHAPE_BY_KIND: Record<AgentTraceNodeKind, NodeShapeOptions> = {
      llm:      { kind: 'circle', radius: 30 },
      tool:     { kind: 'rect', width: 150, height: 44, cornerRadius: 6 },
      decision: { kind: 'regular-polygon', sides: 4, radius: 32, rotation: Math.PI / 4 },
      output:   { kind: 'rect', width: 170, height: 40, cornerRadius: 20 },
    };
    const FILL_BY_KIND: Record<AgentTraceNodeKind, number> = {
      llm:      0x8b5cf6, // violet
      tool:     0x0ea5e9, // sky
      decision: 0xf59e0b, // amber
      output:   0x14b8a6, // teal
    };
    const STATUS_TINT: Record<AgentTraceStatus, number> = {
      success: 0x16a34a,
      error:   0xdc2626,
      pending: 0x94a3b8,
    };

    const settings = {
      preset: agentTrace[0]!.id,
      animateActive: true,
      showTokens: true,
    };

    // Build the node/edge arrays for a given preset. Pure data — fed to
    // `initData` for the first render and to `setData` on GUI swaps.
    const buildTrace = (presetId: string): { nodes: NodeData<AgentTraceNodeData>[]; edges: EdgeData<AgentTraceEdgeData>[] } => {
      const trace = agentTrace.find((t) => t.id === presetId) ?? agentTrace[0]!;
      // Lookup endpoint statuses so edge styling can read both sides
      // (failure on either end mutes the edge; the success path picks up
      // the flow-particle decoration).
      const statusById = new Map(trace.nodes.map((n) => [n.id, n.data.status]));

      const nodes: NodeData<AgentTraceNodeData>[] = trace.nodes.map((n) => ({
        id: n.id,
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
        states: n.data.status === 'error' ? ['error']
              : n.data.status === 'pending' ? ['pending']
              : undefined,
      }));

      const edges: EdgeData<AgentTraceEdgeData>[] = trace.edges.map((e) => {
        const sStatus = statusById.get(e.source);
        const tStatus = statusById.get(e.target);
        const failed  = sStatus === 'error'   || tStatus === 'error';
        const pending = sStatus === 'pending' || tStatus === 'pending';
        const onActivePath = !failed && !pending && e.data.kind !== 'branch';

        const decorations: EdgeDecorationSpec[] = [];
        if (failed) {
          decorations.push({ id: 'failed-ants', kind: 'marching-ants-connector', color: 0xdc2626, strokeWidth: 1.5, dashLength: 6 });
        } else if (settings.animateActive && onActivePath) {
          decorations.push({ id: 'flow', kind: 'flow-particles-connector', color: 0x14b8a6, count: 4, size: 4, speedPxPerSec: 90 });
        }

        const labelBits: string[] = [];
        const tokens = e.data.kind === 'returns' ? statusById.get(e.source) && trace.nodes.find((n) => n.id === e.source)?.data.tokens : undefined;
        if (settings.showTokens && tokens !== undefined) labelBits.push(`${tokens}t`);

        const style: EdgeStyle = {
          ...(failed
            ? { strokeColor: 0xdc2626, strokeAlpha: 0.55, arrowTargetColor: 0xdc2626 }
            : pending
              ? { strokeColor: 0x94a3b8, strokeAlpha: 0.35, strokeDashArray: [4, 4] as const, arrowTargetColor: 0x94a3b8 }
              : {}),
          ...(decorations.length > 0 ? { decorations } : {}),
          ...(labelBits.length > 0 ? { labelText: labelBits.join(' · ') } : {}),
        };

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          data: e.data,
          style,
        };
      });

      return { nodes, edges };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-agent-trace')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // ── Layers ──────────────────────────────────────────────────────────
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: buildTrace(settings.preset),
        node: {
          state: {
            // `error` and `pending` are NOT in DEFAULT_NODE_STATE_CONFIGS
            // beyond a colour shift, so the story registers richer overlays
            // here: error grows a thick red stroke and breathes; pending
            // dims and carries a pulse-ring.
            error: {
              bgStrokeColor: STATUS_TINT.error,
              bgStrokeWidth: 3,
              effects: { breathing: { amplitude: 0.18, frequencyHz: 1.5 } },
            },
            pending: {
              bgStrokeColor: STATUS_TINT.pending,
              bgStrokeWidth: 2,
              bgAlpha: 0.55,
              decorations: [
                { id: 'pending-pulse', kind: 'pulse-ring', color: STATUS_TINT.pending, periodMs: 1600, maxRadius: 18 },
              ],
            },
            highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
            selected:    { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
          },
        },
        edge: {
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2.2, strokeAlpha: 1, arrowTargetColor: 0xfbbf24 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(
      new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' }),
    );
    canvas.behaviours.register(
      new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }),
    );
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', targetLayerId: 'bg' }));

    // ── Layout ──────────────────────────────────────────────────────────
    // `ElkLayout`'s constructor only types its own ELK params, so the
    // registry id / target layer are assigned after construction (both are
    // declared on the base `Layout`). `activeLayout: 'elk'` then resolves
    // against this id and auto-runs the layout against `'graph'` on mount.
    const layout = new ElkLayout();
    Object.assign(layout, { id: 'elk', targetLayerId: 'graph' });
    layout.events.on('end', ({ reason }) => {
      if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
    });
    canvas.layouts.add(layout);
    onStoryTeardown(() => layout.stop());

    // ── Config ──────────────────────────────────────────────────────────
    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0b1220',
          color: '#1e293b',
          size: 1.2,
          spacing: 26,
          alpha: 0.7,
        },
        graph: {
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
              labelBackgroundFill: 0xffffff,
              labelBackgroundAlpha: 0.85,
              labelBackgroundPadding: 3,
              labelBackgroundCornerRadius: 3,
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
        select: { enabled: true, clearOnBackground: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#1e293b' },
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
      activeLayout: 'elk',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Swap the live dataset to another preset and re-run the layout.
    const loadPreset = (presetId: string): void => {
      graph.setData(buildTrace(presetId));
      void layout.apply(graph);
    };

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'LLM Agent Trace' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(settings, 'preset', agentTrace.map((t) => t.id))
      .name('preset')
      .onChange((id: string) => {
        loadPreset(id);
      });

    gui
      .add(settings, 'animateActive')
      .name('animate active path')
      .onChange(() => {
        loadPreset(settings.preset);
      });

    gui
      .add(settings, 'showTokens')
      .name('show token counts')
      .onChange(() => {
        loadPreset(settings.preset);
      });

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
