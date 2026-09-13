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
import type { EdgeBadge, GraphData, GraphNode, NodeShapeOptions } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family IV — iteration loops.** The reference rendering of plate P7. A loop
 * is the one flow a left-to-right layout actively lies about, and the fix is
 * not a cleverer router — it is admitting the loop body is a *region*.
 *
 * Three marks make a loop legible, and two of the three ship today:
 *
 * - **The loop-back edge** — `critique → generate` runs against the layout's
 *   direction, so ELK routes it around the layer stack. `pathType: 'orth'`
 *   with a deep stub is what keeps it from cutting through the body.
 * - **A counter badge that states its own progress** — the return edge carries
 *   an `EdgeBadge` at `placement: 'middle'` reading `2 of 4`. Edge badges are
 *   parametric along the routed path and re-anchor when the path changes, so
 *   the counter survives a drag, a re-layout and a router swap with no code.
 * - **An exhaustion exit** — the only edge allowed to leave the region, drawn
 *   crimson and dashed. Both exits are visible at rest (rule R4): `accept` in
 *   teal, `escalate` in crimson, neither relying on animation to be found.
 *
 * **Known gap — the frame.** The loop body should sit inside a named,
 * axis-aligned region with a title chip declaring its bound (`iterate · max
 * 4`). `bubble-sets` covers organic hulls, not rectangular frames, so the
 * bound currently lives in the decision node's own label instead. This is the
 * one item on the page that needs a new layer class rather than a registry
 * entry; the workflow family wants the same thing for swimlanes.
 *
 * Note `tabbed-rect` already ships and is the natural silhouette for that
 * frame — its raised tab is exactly where a group title goes.
 */
const meta: Meta = { title: 'designs/IterationLoop' };
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
const LINE = 0x64748b;    // card outline + connectors     —  4.8:1
const VIOLET = 0x5b3fd1;  // agents, live flow, selection
const TEAL = 0x0b7a6e;    // data, tools, success
const AMBER = 0x9a6207;   // branch, keys, retry
const CRIMSON = 0xb02525; // failure

// ── Vocabulary ──────────────────────────────────────────────────────────────
type Kind = 'step' | 'decision' | 'exit';
type Flow = 'forward' | 'retry' | 'accept' | 'escalate';

interface StepData {
  readonly title: string;
  readonly lines?: readonly string[];
}
const stepOf = (n: GraphNode): StepData => n.data as StepData;
const flowOf = (e: { data?: unknown }): Flow =>
  ((e.data as { flow?: Flow } | undefined)?.flow ?? 'forward');

const CARD_W = 156;
const CARD_H = 78;
const PILL_W = 150;
const PILL_H = 38;
const DIAMOND_R = 54;

/**
 * Dash rides on the edge record rather than the layer template: a
 * `strokeDashArray` resolver has to answer a tuple for every edge and there is
 * no tuple meaning "solid". Only `escalate` is dashed.
 */
const DASH: Partial<Record<Flow, readonly [number, number]>> = { escalate: [6, 4] };
// ── Flow encoding — hue, weight and dash move together (R2 + R4) ────────────
const STROKE: Record<Flow, number> = { forward: MUTED, retry: AMBER, accept: TEAL, escalate: CRIMSON };
const WEIGHT: Record<Flow, number> = { forward: 1.6, retry: 2, accept: 2.2, escalate: 2 };

/**
 * The counter badge. Parametric placement means it rides the middle of the
 * routed path and re-anchors whenever the path changes — drag a node and it
 * follows without a single line of positioning code.
 */
const RETRY_BADGE: EdgeBadge = {
  id: 'attempt',
  placement: 'middle',
  origin: 'center',
  shape: { kind: 'rect', width: 66, height: 22, cornerRadius: 11 },
  fill: PAPER,
  strokeColor: AMBER,
  strokeWidth: 1.4,
  labelText: '2 of 4',
  labelColor: AMBER,
  labelFontSize: 10,
  keepUpright: true
};

/**
 * The whole flow channel on the edge record. Colour and weight were layer
 * template resolvers reading `edge.data.flow`; they resolved every edge to the
 * default, so the accept path never went teal and the escalation never went
 * crimson. Setting all three channels together keeps R2 legible in one place.
 */
const flowStyle = (flow: Flow) => ({
  strokeColor: STROKE[flow],
  strokeWidth: WEIGHT[flow],
  arrowTargetColor: STROKE[flow],
  labelColor: STROKE[flow],
  ...(DASH[flow] ? { strokeDashArray: DASH[flow] } : {}),
  ...(flow === 'retry' ? { badges: [RETRY_BADGE], labelPlacement: 0.72 } : {})
});

/** `flow` is the single authored field; it fans out into colour, weight and dash. */
interface Transition {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly type: string;
  readonly flow: Flow;
  readonly label?: string;
}

const TRANSITIONS: readonly Transition[] = [
  { id: 'f1', source: 'generate', target: 'critique', type: 'FLOW', flow: 'forward' },
  { id: 'f2', source: 'critique', target: 'gate', type: 'FLOW', flow: 'forward' },
  // The back-edge. Runs against the layout direction, so ELK routes it around.
  { id: 'retry', source: 'gate', target: 'generate', type: 'RETRY', flow: 'retry', label: 'retry with critique' },
  { id: 'ok', source: 'gate', target: 'accept', type: 'EXIT', flow: 'accept', label: 'yes' },
  { id: 'bail', source: 'gate', target: 'escalate', type: 'EXIT', flow: 'escalate', label: 'attempts exhausted' }
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
    {
      id: 'generate',
      type: 'step',
      data: { title: 'Generate', lines: ['draft candidate', 'temp 0.7'] } satisfies StepData
    },
    {
      id: 'critique',
      type: 'step',
      data: { title: 'Critique', lines: ['rubric · 6 criteria', 'score 0.62'] } satisfies StepData
    },
    // The bound lives here until a group-frame layer can carry it on the region.
    { id: 'gate', type: 'decision', data: { title: 'score ≥ 0.8?' } satisfies StepData },
    { id: 'accept', type: 'exit', data: { title: 'accept' } satisfies StepData },
    { id: 'escalate', type: 'exit', data: { title: 'escalate to human' } satisfies StepData }
  ],
  edges: TRANSITIONS.map(({ flow, label, ...edge }) => ({
    ...edge,
    data: { flow, label },
    style: { ...flowStyle(flow), ...labelFor(label) }
  }))
};

// ── Shapes ──────────────────────────────────────────────────────────────────
function stepShape(n: GraphNode): NodeShapeOptions {
  const step = stepOf(n);
  switch (n.type as Kind) {
    case 'exit':
      return { kind: 'rect', width: PILL_W, height: PILL_H, cornerRadius: PILL_H / 2 };
    case 'decision':
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
    case 'step':
    default: {
      const parts: CompositePart[] = [
        { part: 'rect', x: 0, y: 0, width: 4, height: CARD_H, fill: VIOLET, cornerRadius: 2 },
        { part: 'label', x: 18, y: 14, text: step.title, fontSize: 12.5, fontWeight: 600, fill: INK },
        ...(step.lines ?? []).map((text, i): CompositePart => ({
          part: 'label',
          x: 18,
          y: 36 + i * 16,
          text,
          fontSize: 10,
          fill: BODY
        }))
      ];
      return {
        kind: 'composite',
        width: CARD_W,
        height: CARD_H,
        cornerRadius: 10,
        fill: PAPER,
        stroke: { color: LINE, width: 1.8 },
        parts,
        clip: true
      };
    }
  }
}

const sizeOf = (n: GraphNode): { width: number; height: number } => {
  switch (n.type as Kind) {
    case 'exit': return { width: PILL_W, height: PILL_H };
    case 'decision': return { width: DIAMOND_R * 2, height: DIAMOND_R * 2 };
    default: return { width: CARD_W, height: CARD_H };
  }
};



// ── Style ───────────────────────────────────────────────────────────────────
const NODE: GraphLayerProps['node'] = {
  style: {
    shape: stepShape,
    bgFill: (n: GraphNode) => (n.type === 'exit' ? PAPER : PAPER),
    bgStrokeColor: (n: GraphNode) => {
      if (n.id === 'accept') return TEAL;
      if (n.id === 'escalate') return CRIMSON;
      return LINE;
    },
    bgStrokeWidth: 1.8,
    labelText: (n: GraphNode) => (n.type === 'step' ? '' : stepOf(n).title),
    labelColor: (n: GraphNode) => {
      if (n.id === 'accept') return TEAL;
      if (n.id === 'escalate') return CRIMSON;
      return INK;
    },
    labelFontSize: 11,
    labelFontWeight: 600,
    labelPlacement: 'center'
  },
  state: {
    hovered: { decorations: [{ kind: 'ring', id: 'focus', color: VIOLET, width: 2, gap: 4 }] }
  }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    // Forward edges take `orth`. The back-edge takes `manhattan` instead —
    // it's the router that honours `stubLength`, so the return path leaves
    // each endpoint along its tangent and staircases around the layer stack
    // rather than cutting back through the loop body. (`orth` ignores the
    // option entirely; only `manhattan` and `er` read it.)
    shape: (e) =>
      flowOf(e) === 'retry'
        ? { pathType: 'manhattan' as const, pathStyleOpts: { stubLength: 44 } }
        : { pathType: 'orth' as const },
    strokeCap: 'round',
    arrowTargetShape: 'triangle',
    arrowTargetSize: 10,
    labelFontSize: 10,
    labelAutoRotate: false,
    labelPlacement: 'center',
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
      nodeSpacing: 56,
      layerSpacing: 110,
      layoutOptions: {
        // The authored order *is* the intended spine for a hand-written flow,
        // so let it drive layering and in-layer ordering instead of a greedy
        // guess. (Passthrough wins over the convenience fields above.)
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
        // Aligns a chain far better than the default Brandes-Köpf once any
        // dummy nodes are in play.
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX'
      }
    }
  }
};

export const IterationLoop: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        {/* `retry` is a *return*, not forward flow. Declaring it withholds it
            from ELK — which would otherwise reverse it and thread dummy nodes
            through the spanned layers, staggering the band — and routes it
            along its own lane above the flow instead. */}
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={72}
          options={{ nodeSize: sizeOf, feedbackEdges: (e) => e.type === 'RETRY' }}
        />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
      </GraphCanvas>
    </div>
  )
};
