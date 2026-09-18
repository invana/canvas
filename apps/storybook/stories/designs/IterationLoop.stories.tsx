import {
  CanvasThemeSync,
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  HoverActivateBehaviour,
  TextResolutionLODBehaviour,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, NodeStructureRegistry, NodeTypeRegistry } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family IV — iteration loops.** The reference rendering of plate P7. A loop
 * is the one flow a left-to-right layout actively lies about, and the fix is
 * not a cleverer router — it is admitting the loop body is a *region*.
 *
 * Three marks make a loop legible, and two of the three ship today:
 *
 * - **The loop-back edge** — `gate → generate` runs against the layout's
 *   direction, so ELK routes it around the layer stack. `pathType: 'manhattan'`
 *   with a deep stub is what keeps it from cutting through the body.
 * - **A counter badge that states its own progress** — the return edge carries
 *   an `EdgeBadge` at `placement: 'middle'` reading `2 of 4`. Edge badges are
 *   parametric along the routed path and re-anchor when the path changes, so
 *   the counter survives a drag, a re-layout and a router swap with no code.
 * - **An exhaustion exit** — the only edge allowed to leave the region, drawn
 *   red and dashed. Both exits are visible at rest (rule R4): `accept` in
 *   green, `escalate` in red, neither relying on animation to be found.
 *
 * **Themed by role, not by palette.** The cards are `FreeformStructure`s whose
 * chrome is `*Role` (`cardBg` · `muted` · `heading` · `foreground` · `accent`),
 * recompiled against the live palette on every `theme:change`. The **flow**
 * colours stay literal — the role vocabulary has no `success` / `warning` /
 * `danger`, and a retry is meaning rather than chrome — using the same tokens
 * as the tasks-panel plates (`0x1da54f` · `0xce8509` · `0xe05252`).
 *
 * **Known gap — the frame.** The loop body should sit inside a named,
 * axis-aligned region with a title chip declaring its bound (`iterate · max 4`).
 * `bubble-sets` covers organic hulls, not rectangular frames, so the bound
 * currently lives in the decision node's own label instead. This is the one item
 * on the page that needs a new layer class rather than a registry entry; the
 * workflow family wants the same thing for swimlanes. Note `tabbed-rect` already
 * ships and is the natural silhouette for that frame — its raised tab is
 * exactly where a group title goes.
 *
 * ⚠️ **Text `y` looks a line high on purpose** — `compileFreeform` emits a label
 * part at `el.y + fontSize`.
 */
const meta: Meta = { title: 'designs/IterationLoop' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, top to bottom ─────────────────────────────
/**
 * Four structures. The two exits are the same pill in two colours, which is why
 * they are two entries rather than one parameterised card: a free-form
 * structure is static apart from its bound text, so the *variant* is what a
 * node's `type` selects.
 */
const STRUCTURES: NodeStructureRegistry = {
  step: {
    name: 'step',
    kind: 'freeform',
    width: 156,
    height: 78,
    cornerRadius: 10,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'rail', type: 'rect', x: 0, y: 0, width: 4, height: 78, cornerRadius: 2, fillRole: 'accent' },
      { id: 'title', type: 'text', x: 18, y: 1.5, bind: 'data.title', fontSize: 12.5, fontWeight: 600, colorRole: 'heading' },
      { id: 'l1', type: 'text', x: 18, y: 26, bind: 'data.l1', fontSize: 10, colorRole: 'foreground' },
      { id: 'l2', type: 'text', x: 18, y: 42, bind: 'data.l2', fontSize: 10, colorRole: 'foreground' }
    ]
  },
  decision: {
    name: 'decision',
    kind: 'freeform',
    width: 108,
    height: 108,
    // Explicit points, not a rotation: a rotation applies to the whole shape
    // *including its label*, which left the question running diagonally.
    frame: { kind: 'polygon', points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0, y: 0.5 }] },
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'title', type: 'text', x: 54, y: 37, bind: 'data.title', anchor: 'center', fontSize: 11, fontWeight: 600, colorRole: 'heading' }
    ]
  },
  accept: {
    name: 'accept',
    kind: 'freeform',
    width: 150,
    height: 38,
    cornerRadius: 19,
    bgRole: 'cardBg',
    // Literal, because the exit's colour *is* the outcome.
    stroke: 0x1da54f,
    strokeWidth: 1.8,
    elements: [
      { id: 'title', type: 'text', x: 75, y: 2, bind: 'data.title', anchor: 'center', fontSize: 11, fontWeight: 600, color: 0x1da54f }
    ]
  },
  escalate: {
    name: 'escalate',
    kind: 'freeform',
    width: 150,
    height: 38,
    cornerRadius: 19,
    bgRole: 'cardBg',
    stroke: 0xe05252,
    strokeWidth: 1.8,
    elements: [
      { id: 'title', type: 'text', x: 75, y: 2, bind: 'data.title', anchor: 'center', fontSize: 11, fontWeight: 600, color: 0xe05252 }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  step: { structure: 'step', styling: '', bindings: {} },
  decision: { structure: 'decision', styling: '', bindings: {} },
  accept: { structure: 'accept', styling: '', bindings: {} },
  escalate: { structure: 'escalate', styling: '', bindings: {} }
};

/**
 * The loop. Each transition declares its channels together: forward flow takes
 * the themed `muted` default and says nothing; `retry`, `accept` and `escalate`
 * each carry their literal hue, their weight, and — for the escalation — the
 * dash that keeps them legible in greyscale.
 */
const DATA: GraphData = {
  nodes: [
    { id: 'generate', type: 'step', data: { title: 'Generate', l1: 'draft candidate', l2: 'temp 0.7' } },
    { id: 'critique', type: 'step', data: { title: 'Critique', l1: 'rubric · 6 criteria', l2: 'score 0.62' } },
    // The bound lives here until a group-frame layer can carry it on the region.
    { id: 'gate', type: 'decision', data: { title: 'score ≥ 0.8?' } },
    { id: 'accept', type: 'accept', data: { title: 'accept' } },
    { id: 'escalate', type: 'escalate', data: { title: 'escalate to human' } }
  ],
  edges: [
    { id: 'f1', source: 'generate', target: 'critique', type: 'FLOW', style: { strokeWidth: 1.6 } },
    { id: 'f2', source: 'critique', target: 'gate', type: 'FLOW', style: { strokeWidth: 1.6 } },
    // The back-edge. Runs against the layout direction, so ELK routes it around
    // — `manhattan` is the router that honours `stubLength`, so the return path
    // leaves each endpoint along its tangent and staircases around the layer
    // stack rather than cutting back through the loop body. (`orth` ignores the
    // option entirely; only `manhattan` and `er` read it.) The label steps off
    // centre so it doesn't collide with its own badge.
    {
      id: 'retry',
      source: 'gate',
      target: 'generate',
      type: 'RETRY',
      style: {
        shape: { pathType: 'manhattan', pathStyleOpts: { stubLength: 44 } },
        strokeColor: 0xce8509,
        strokeWidth: 2,
        arrowTargetColor: 0xce8509,
        labelText: 'retry with critique',
        labelColor: 0xce8509,
        labelPlacement: 0.72,
        badges: [
          {
            id: 'attempt',
            placement: 'middle',
            origin: 'center',
            shape: { kind: 'rect', width: 66, height: 22, cornerRadius: 11 },
            strokeColor: 0xce8509,
            strokeWidth: 1.4,
            labelText: '2 of 4',
            labelColor: 0xce8509,
            labelFontSize: 10,
            keepUpright: true
          }
        ]
      }
    },
    {
      id: 'ok',
      source: 'gate',
      target: 'accept',
      type: 'EXIT',
      style: {
        strokeColor: 0x1da54f,
        strokeWidth: 2.2,
        arrowTargetColor: 0x1da54f,
        labelText: 'yes',
        labelColor: 0x1da54f
      }
    },
    {
      id: 'bail',
      source: 'gate',
      target: 'escalate',
      type: 'EXIT',
      style: {
        strokeColor: 0xe05252,
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        arrowTargetColor: 0xe05252,
        labelText: 'attempts exhausted',
        labelColor: 0xe05252
      }
    }
  ]
};

// No colour on the layer template — the theme owns node borders, edge strokes,
// arrowheads and label text; the structures own the cards.
const NODE: GraphLayerProps['node'] = {
  // Each card draws its own words; the node-level label would double them up.
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
    // The host <div> sizes the engine's render surface — structural, and exempt
    // from the no-inline-CSS rule (root rule 13).
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" />
        {/* Drives the behaviour's mode + family from the host `@invana/themes`
            theme, which is what makes every role above follow the toolbar. */}
        <CanvasThemeSync />
        <GraphLayer
          id="graph"
          data={DATA}
          node={NODE}
          edge={EDGE}
          nodeStructureTemplates={STRUCTURES}
          nodeTypes={TYPES}
        />
        {/* `retry` is a *return*, not forward flow. Declaring it withholds it
            from ELK — which would otherwise reverse it and thread dummy nodes
            through the spanned layers, staggering the band — and routes it
            along its own lane above the flow instead. */}
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={72}
          options={{ feedbackEdges: (e) => e.type === 'RETRY' }}
        />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" enabled />
      </GraphCanvas>
    </div>
  )
};
