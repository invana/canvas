import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  HoverActivateBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig, CompositePart } from '@invana/canvas';
import type { GraphData, GraphNode, NodeShapeOptions } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family III — agentic workflow.** The reference rendering of plate P6, and
 * the only family that is *alive*: a schema is true whether or not you are
 * looking at it, but a workflow has a current position, and the diagram's main
 * job is showing where that position is.
 *
 * The grammar decisions:
 *
 * - **No `DecisionNode` class** (rule R1) — the diamond is
 *   `{ kind: 'regular-polygon', sides: 4, rotation: π/4 }`, so it inherits
 *   every decoration, badge and hit path a card has. Five node *types* here,
 *   one shape resolver, zero new engine kinds.
 * - **Run state rides three redundant channels** (rules R2 + R4) — each edge's
 *   `data.status` drives colour *and* stroke weight *and* dash pattern. The
 *   failed branch still reads in greyscale, in a screenshot, and for a
 *   colour-blind reader. Only the `live` edge adds motion, because motion
 *   encodes *now* and nothing else.
 * - **One moving thing** — exactly one `marching-ants-connector` decoration is
 *   attached in the whole scene. A diagram with three animations has none.
 * - **Rails identify the actor** — agents carry a violet accent rail, tool
 *   calls a teal one, so a reader never checks a legend to know whether a box
 *   thinks or executes.
 *
 * **Known gaps.** Two things here are hand-rolled that should be engine
 * surfaces: the status → style mapping (an *edge status channel* on
 * `EdgeStyle`, so `status: 'live'` resolves to weight + hue + decoration
 * without a resolver per story), and swimlane framing for the ACT stage (a
 * rectangular group-frame layer). See the plate book's gap table.
 */
const meta: Meta = { title: 'designs/AgenticWorkflow' };
export default meta;
type Story = StoryObj;

// ── Palette ─────────────────────────────────────────────────────────────────
// Contrast-first. Every value is checked against the near-white card body it
// sits on: body text and titles clear 7:1, secondary text 4.5:1, and the card
// outline is a slate-500 rather than the slate-300 hairline a "quiet" border
// tempts you into — at canvas zoom a 1px hairline below ~3:1 simply vanishes.
const PAPER = 0xffffff;   // card body
const INK = 0x0f172a;     // titles                        — 17.9:1 on PAPER
const BODY = 0x334155;    // row text                      —  9.7:1
const MUTED = 0x64748b;   // meta / types / edge labels    —  4.8:1
const RULE = 0x94a3b8;    // dividers *inside* a card      —  2.8:1, decorative
const LINE = 0x64748b;    // card outline + connectors     —  4.8:1
const VIOLET = 0x5b3fd1;  // agents, live flow, selection
const TEAL = 0x0b7a6e;    // data, tools, success
const CRIMSON = 0xb02525; // failure

// ── Node + edge vocabulary ──────────────────────────────────────────────────
type Kind = 'terminal' | 'agent' | 'decision' | 'tool';
type Status = 'done' | 'live' | 'idle' | 'failed';

interface StepData {
  readonly title: string;
  readonly meta?: string;
  /** Rows shown inside an agent / tool card — label on the left, value right. */
  readonly rows?: ReadonlyArray<readonly [string, string]>;
}

const stepOf = (n: GraphNode): StepData => n.data as StepData;

const CARD_W = 168;
const CARD_H = 96;
const TOOL_H = 64;
const PILL_W = 104;
const PILL_H = 38;
const DIAMOND_R = 56;

/**
 * Dash is the third channel, and it is the one the layer template can't carry:
 * a `strokeDashArray` resolver must answer a tuple for *every* edge, and there
 * is no tuple meaning "solid". So the two dashed statuses declare it on the
 * edge record — which is also the documented split (per-item style carries
 * only what differs). A first-class `status` field on `EdgeStyle` would fold
 * all three channels back into one declaration; see the plate book's gap table.
 */
const DASH: Partial<Record<Status, readonly [number, number]>> = {
  live: [7, 6],
  failed: [5, 4]
};
// ── Run state: colour × weight × dash, three independent channels ───────────
const STROKE: Record<Status, number> = { done: TEAL, live: VIOLET, idle: MUTED, failed: CRIMSON };
const WEIGHT: Record<Status, number> = { done: 2, live: 2.6, idle: 1.6, failed: 2.6 };

/**
 * The whole status channel, resolved on the edge record rather than through
 * layer-template resolvers. Colour and weight used to be resolvers reading
 * `edge.data.status`; every edge came back `idle` (verified by sampling the
 * rendered pixels — all of them `#64748b`), while the dash, set here, was
 * correct. Keeping the three channels together also makes the point of R2
 * legible in one place.
 */
const statusStyle = (status: Status) => ({
  strokeColor: STROKE[status],
  strokeWidth: WEIGHT[status],
  arrowTargetColor: STROKE[status],
  ...(DASH[status] ? { strokeDashArray: DASH[status] } : {}),
  ...(status === 'live'
    ? {
        decorations: [
          {
            kind: 'marching-ants-connector' as const,
            id: 'live',
            color: VIOLET,
            strokeWidth: 2.6,
            dashLength: 7,
            gapLength: 6,
            speedPxPerSec: 42
          }
        ]
      }
    : {})
});

/**
 * The run. `status` is the single authored field; it fans out below into
 * colour + weight (layer template) and dash (per-edge style).
 */
interface Flow {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly status: Status;
  readonly label?: string;
}

const FLOWS: readonly Flow[] = [
  { id: 'e1', source: 'query', target: 'planner', type: 'FLOW', status: 'done' },
  { id: 'e2', source: 'planner', target: 'route', type: 'FLOW', status: 'done' },
  { id: 'e3', source: 'route', target: 'search', type: 'BRANCH', status: 'done', label: 'yes · tools' },
  { id: 'e4', source: 'route', target: 'grep', type: 'BRANCH', status: 'failed', label: 'yes · tools' },
  { id: 'e5', source: 'route', target: 'synth', type: 'BRANCH', status: 'idle', label: 'no · direct' },
  { id: 'e6', source: 'search', target: 'synth', type: 'FLOW', status: 'live' },
  { id: 'e7', source: 'grep', target: 'synth', type: 'FLOW', status: 'failed' },
  { id: 'e8', source: 'synth', target: 'answer', type: 'FLOW', status: 'idle' }
];

/**
 * Label config for an edge that actually has one. Kept off the layer template
 * on purpose: a template `labelBackgroundFill` paints its plate even when the
 * text resolves to `''`, which punched a white notch out of every unlabelled
 * edge. Per-item style carries only what differs — this differs.
 */
const labelFor = (label: string | undefined) =>
  label
    ? {
        labelText: label,
        labelBackgroundFill: PAPER,
        labelBackgroundPadding: 4,
        labelBackgroundCornerRadius: 3
      }
    : undefined;

const DATA: GraphData = {
  nodes: [
    { id: 'query', type: 'terminal', data: { title: 'user query' } satisfies StepData },
    {
      id: 'planner',
      type: 'agent',
      data: {
        title: 'Planner',
        meta: 'claude-opus-5',
        rows: [['intent', 'lookup'], ['budget', '4 calls']]
      } satisfies StepData
    },
    { id: 'route', type: 'decision', data: { title: 'needs tools?' } satisfies StepData },
    { id: 'search', type: 'tool', data: { title: 'web.search', meta: '14 results · 620ms' } satisfies StepData },
    { id: 'grep', type: 'tool', data: { title: 'repo.grep', meta: 'timeout at 30s' } satisfies StepData },
    {
      id: 'synth',
      type: 'agent',
      data: {
        title: 'Synthesise',
        meta: 'claude-opus-5 · cited',
        rows: [['sources', '14'], ['tokens', '8.1k']]
      } satisfies StepData
    },
    { id: 'answer', type: 'terminal', data: { title: 'answer' } satisfies StepData }
  ],
  edges: FLOWS.map(({ status, label, ...edge }) => ({
    ...edge,
    data: { status, label },
    style: { ...statusStyle(status), ...labelFor(label) }
  }))
};

// ── Shapes — one resolver, five types, no new engine kinds ──────────────────
/** Accent rail + title + optional meta + optional divider and rows. */
function card(step: StepData, width: number, height: number, rail: number): CompositePart[] {
  const parts: CompositePart[] = [
    { part: 'rect', x: 0, y: 0, width: 4, height, fill: rail, cornerRadius: 2 },
    { part: 'label', x: 18, y: 14, text: step.title, fontSize: 12.5, fontWeight: 600, fill: INK }
  ];
  if (step.meta) {
    parts.push({ part: 'label', x: 18, y: 31, text: step.meta, fontSize: 9.5, fill: MUTED });
  }
  (step.rows ?? []).forEach(([label, value], i) => {
    const y = 50 + i * 19;
    if (i === 0) {
      parts.push({ part: 'line', x: 18, y: y - 8, x2: width - 14, y2: y - 8, stroke: { color: RULE, width: 1 } });
    }
    parts.push({ part: 'label', x: 18, y, text: label, fontSize: 10, fill: BODY });
    parts.push({ part: 'label', x: width - 14, y, text: value, anchor: 'right', fontSize: 10, fill: INK });
  });
  return parts;
}

function stepShape(n: GraphNode): NodeShapeOptions {
  const step = stepOf(n);
  switch (n.type as Kind) {
    case 'terminal':
      // A pill: a rect whose corner radius is half its height.
      return { kind: 'rect', width: PILL_W, height: PILL_H, cornerRadius: PILL_H / 2 };
    case 'decision':
      // The whole "decision box" primitive: a square, turned 45°.
      // Explicit vertices, not `regular-polygon` + rotation: the rotation
      // applies to the whole shape *including its label*, which left
      // "needs tools?" running diagonally across the diamond.
      return {
        kind: 'polygon',
        vertices: [
          { x: 0, y: -DIAMOND_R },
          { x: DIAMOND_R, y: 0 },
          { x: 0, y: DIAMOND_R },
          { x: -DIAMOND_R, y: 0 }
        ]
      };
    case 'tool':
      return {
        kind: 'composite',
        width: CARD_W,
        height: TOOL_H,
        cornerRadius: 10,
        fill: PAPER,
        stroke: { color: LINE, width: 1.8 },
        parts: card(step, CARD_W, TOOL_H, TEAL),
        clip: true
      };
    case 'agent':
    default:
      return {
        kind: 'composite',
        width: CARD_W,
        height: CARD_H,
        cornerRadius: 12,
        fill: PAPER,
        stroke: { color: LINE, width: 1.8 },
        parts: card(step, CARD_W, CARD_H, VIOLET),
        clip: true
      };
  }
}

const sizeOf = (n: GraphNode): { width: number; height: number } => {
  switch (n.type as Kind) {
    case 'terminal': return { width: PILL_W, height: PILL_H };
    case 'decision': return { width: DIAMOND_R * 2, height: DIAMOND_R * 2 };
    case 'tool': return { width: CARD_W, height: TOOL_H };
    default: return { width: CARD_W, height: CARD_H };
  }
};


// ── Style ───────────────────────────────────────────────────────────────────
const NODE: GraphLayerProps['node'] = {
  style: {
    shape: stepShape,
    bgFill: PAPER,
    bgStrokeColor: (n: GraphNode) => (n.type === 'decision' ? LINE : LINE),
    bgStrokeWidth: 1.8,
    // Composites carry their own labels; only the pill and the diamond need
    // the node-level one.
    labelText: (n: GraphNode) => (n.type === 'terminal' || n.type === 'decision' ? stepOf(n).title : ''),
    labelColor: INK,
    labelFontSize: 11,
    labelPlacement: 'center'
  },
  state: {
    hovered: { decorations: [{ kind: 'ring', id: 'focus', color: VIOLET, width: 2, gap: 4 }] }
  }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    shape: { pathType: 'orth' },
    strokeCap: 'round',
    arrowTargetShape: 'triangle',
    arrowTargetSize: 10,
    labelFontSize: 10,
    labelColor: BODY,
    labelPlacement: 'center',
    // Orthogonal routes have vertical legs. `labelKeepUpright` only un-flips
    // upside-down text — switching rotation off is what keeps a label
    // horizontal wherever on the route it lands.
    labelAutoRotate: false,
  }
};

const CONFIG: CanvasConfig = {
  // One fitter, and it re-frames as the layout settles.
  fitOnLoad: true,
  activeLayout: 'elk',
  layouts: {
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      edgeRouting: 'ORTHOGONAL',
      nodeSpacing: 48,
      layerSpacing: 96
    }
  }
};

export const AgenticWorkflow: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={72} options={{ nodeSize: sizeOf }} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
      </GraphCanvas>
    </div>
  )
};
