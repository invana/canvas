import {
  CanvasThemeSync,
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **A run, painted onto the plan it ran.** The reference rendering for Invana's
 * `operate.runs.detail.flow` — one execution of `nl-query@5`, drawn as shape
 * rather than as numbers.
 *
 * It is the same grammar as *Agentic workflow* and *Iteration loop*, with three
 * decisions this family adds:
 *
 * - **Read-only is the absence of a behaviour, not a new component.** There is
 *   no `DragNodeBehaviour` here. A run is a record: a node that can be dragged
 *   invites an edit the surface will never accept, which is worse on a trace
 *   than no affordance at all. Pan, zoom and hover stay, because reading is not
 *   editing.
 * - **A gate is an edge badge, not a node.** An approval is dispatched by
 *   nobody, holds no slot and spends no participant, so it cannot be a box in
 *   the chain. It is a condition *on the way into* `execute_query` — which is
 *   exactly what a badge at `placement: 'middle'` on that edge says, and the
 *   badge carries who answered it.
 * - **The branch nothing took is drawn.** `call_enrichment` is dashed, muted
 *   and unlabelled by outcome. A run that hid its untaken branches would be a
 *   drawing of a different, simpler plan.
 *
 * Status rides three redundant channels, as everywhere else in this book:
 * colour, stroke weight and — for the untaken branch — a dash. The run-state
 * hues stay literal (`0x1da54f` · `0xce8509` · `0xe05252`), because a run state
 * is meaning rather than chrome and the role vocabulary has no `success`.
 *
 * **Nothing here moves.** The one animation in this book belongs to a live
 * workflow; a settled run has no *now* to point at.
 */
const meta: Meta<typeof GraphCanvas> = {
  title: 'Designs/Run flow',
  component: GraphCanvas,
  parameters: { layout: 'fullscreen' }
};

export default meta;
type Story = StoryObj<typeof meta>;

// ── The definition — literal JSON, top to bottom ─────────────────────────────

/**
 * Three cards and one dimmed one. The rail is the **outcome**, which is why
 * they are separate structures rather than one card with a bound colour: a
 * free-form structure is static apart from its bound text, so the variant is
 * what a node's `type` selects.
 */
const card = (rail: number, stroke: number, alpha = 1) => ({
  kind: 'freeform' as const,
  width: 168,
  height: 76,
  cornerRadius: 10,
  bgRole: 'cardBg' as const,
  stroke,
  strokeWidth: 1.6,
  alpha,
  elements: [
    { id: 'rail', type: 'rect' as const, x: 0, y: 0, width: 4, height: 76, cornerRadius: 2, fill: rail },
    { id: 'title', type: 'text' as const, x: 18, y: 2, bind: 'data.title', fontSize: 12.5, fontWeight: 600, colorRole: 'heading' as const },
    { id: 'l1', type: 'text' as const, x: 18, y: 26, bind: 'data.l1', fontSize: 10, colorRole: 'foreground' as const },
    { id: 'l2', type: 'text' as const, x: 18, y: 42, bind: 'data.l2', fontSize: 10, colorRole: 'muted' as const }
  ]
});

const STRUCTURES: NodeStructureRegistry = {
  ran: { name: 'ran', ...card(0x1da54f, 0xbfc7cf) },
  retried: { name: 'retried', ...card(0xce8509, 0xce8509) },
  asked: { name: 'asked', ...card(0x0b73da, 0xbfc7cf) },
  never: { name: 'never', ...card(0x9aa4ae, 0xd5dae0, 0.55) }
};

const TYPES: NodeTypeRegistry = {
  ran: { structure: 'ran', styling: '', bindings: {} },
  retried: { structure: 'retried', styling: '', bindings: {} },
  asked: { structure: 'asked', styling: '', bindings: {} },
  never: { structure: 'never', styling: '', bindings: {} }
};

/**
 * `run:7d3184f1` — nine steps, one clarification round that went back, one
 * approval gate, one step that took two attempts, one branch never taken.
 */
const DATA: GraphData = {
  nodes: [
    { id: 'parse_intent', type: 'ran', data: { title: 'parse_intent', l1: 'llm · extract', l2: '2 rounds · 1.6s' } },
    { id: 'ask_user', type: 'asked', data: { title: 'ask_user', l1: 'human · clarification', l2: 'ravi · 41.2s' } },
    { id: 'resolve_schema', type: 'ran', data: { title: 'resolve_schema', l1: 'graph data · schema', l2: '2 models · 0.2s' } },
    { id: 'build_query', type: 'ran', data: { title: 'build_query', l1: 'llm · decide', l2: 'claude-opus-5 · 1.4s' } },
    { id: 'validate_query', type: 'ran', data: { title: 'validate_query', l1: 'agent · check', l2: 'passed · 0.1s' } },
    { id: 'execute_query', type: 'retried', data: { title: 'execute_query', l1: 'graph data · read_only', l2: '↺ 2 of 3 · 1,284 rows · 2.1s' } },
    { id: 'summarise', type: 'ran', data: { title: 'summarise', l1: 'llm · extract', l2: '1 delegation · 0.9s' } },
    { id: 'deliver', type: 'ran', data: { title: 'deliver', l1: 'agent · spine', l2: 'to the canvas · 0.1s' } },
    { id: 'call_enrichment', type: 'never', data: { title: 'call_enrichment', l1: 'third party · network', l2: 'never taken' } }
  ],
  edges: [
    { id: 'e1', source: 'parse_intent', target: 'ask_user', type: 'FLOW', style: { strokeWidth: 1.6 } },
    { id: 'e2', source: 'ask_user', target: 'resolve_schema', type: 'FLOW', style: { strokeWidth: 1.6 } },
    { id: 'e3', source: 'resolve_schema', target: 'build_query', type: 'FLOW', style: { strokeWidth: 1.6 } },
    { id: 'e4', source: 'build_query', target: 'validate_query', type: 'FLOW', style: { strokeWidth: 1.6 } },
    // The gate. It belongs to no step, so it rides the edge it holds — and the
    // badge carries the one fact the chain cannot: who answered it.
    {
      id: 'e5',
      source: 'validate_query',
      target: 'execute_query',
      type: 'FLOW',
      style: {
        strokeWidth: 1.6,
        // The badge names the gate on the line; the answer rides above it, so
        // neither is read through the other.
        labelText: 'approved by ravi · waited 2m 04s',
        labelColor: 0xce8509,
        labelPlacement: 0.5,
        labelOffsetY: -18,
        badges: [
          {
            id: 'approval',
            placement: 'middle',
            origin: 'center',
            shape: { kind: 'rect', width: 96, height: 22, cornerRadius: 4 },
            strokeColor: 0xce8509,
            strokeWidth: 1.4,
            labelText: '◈ approval',
            labelColor: 0xce8509,
            labelFontSize: 10,
            keepUpright: true
          }
        ]
      }
    },
    { id: 'e6', source: 'execute_query', target: 'summarise', type: 'FLOW', style: { strokeWidth: 1.6 } },
    { id: 'e7', source: 'summarise', target: 'deliver', type: 'FLOW', style: { strokeWidth: 1.6 } },
    // The round that went back. A return edge, withheld from ELK's layering
    // below so it routes around the chain instead of reversing it.
    {
      id: 'round2',
      source: 'ask_user',
      target: 'parse_intent',
      type: 'ROUND',
      style: {
        shape: { pathType: 'manhattan', pathStyleOpts: { stubLength: 44 } },
        strokeColor: 0xce8509,
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        arrowTargetColor: 0xce8509,
        labelText: 'round 2 — the loop went back once',
        labelColor: 0xce8509,
        labelPlacement: 0.22,
        badges: [
          {
            id: 'rounds',
            placement: 'middle',
            origin: 'center',
            shape: { kind: 'rect', width: 62, height: 22, cornerRadius: 11 },
            strokeColor: 0xce8509,
            strokeWidth: 1.4,
            labelText: '2 of 3',
            labelColor: 0xce8509,
            labelFontSize: 10,
            keepUpright: true
          }
        ]
      }
    },
    // Declared, and this run never took it.
    {
      id: 'e8',
      source: 'build_query',
      target: 'call_enrichment',
      type: 'UNTAKEN',
      style: {
        strokeColor: 0x9aa4ae,
        strokeWidth: 1.4,
        strokeDashArray: [4, 4],
        arrowTargetColor: 0x9aa4ae,
        labelText: 'never taken',
        labelColor: 0x9aa4ae,
        alpha: 0.7
      }
    }
  ]
};

const NODE: GraphLayerProps['node'] = {
  style: { labelText: '' }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    shape: { pathType: 'orth' },
    strokeCap: 'round',
    arrowTargetShape: 'triangle',
    arrowTargetSize: 10,
    labelFontSize: 10,
    labelPlacement: 'center',
    labelAutoRotate: false
  }
};

const CONFIG: CanvasConfig = {
  fitOnLoad: true,
  activeLayout: 'elk',
  layouts: {
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      edgeRouting: 'ORTHOGONAL',
      nodeSpacing: 58,
      layerSpacing: 168,
      layoutOptions: {
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
      }
    }
  }
};

export const RunFlow: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" />
        <CanvasThemeSync />
        <GraphLayer
          id="graph"
          data={DATA}
          node={NODE}
          edge={EDGE}
          nodeStructureTemplates={STRUCTURES}
          nodeTypes={TYPES}
        />
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={72}
          options={{ feedbackEdges: (e) => e.type === 'ROUND' }}
        />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        {/* No `DragNodeBehaviour`: a run is a record, and a node that can be
            moved offers an edit this surface will never accept. */}
        <HoverActivateBehaviour id="hover" degree={0} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" enabled />
      </GraphCanvas>
    </div>
  )
};
