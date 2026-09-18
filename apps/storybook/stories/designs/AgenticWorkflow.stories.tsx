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
 * **Family III — agentic workflow.** The reference rendering of plate P6, and
 * the only family that is *alive*: a schema is true whether or not you are
 * looking at it, but a workflow has a current position, and the diagram's main
 * job is showing where that position is.
 *
 * The grammar decisions:
 *
 * - **No `DecisionNode` class** (rule R1) — the diamond is a structure whose
 *   `frame` is a four-point polygon, so it inherits every decoration, badge and
 *   hit path a card has. Four node *types* here, four structures, zero new
 *   engine kinds.
 * - **Run state rides three redundant channels** (rules R2 + R4) — each edge
 *   declares colour *and* stroke weight *and* dash pattern. The failed branch
 *   still reads in greyscale, in a screenshot, and for a colour-blind reader.
 *   Only the `live` edge adds motion, because motion encodes *now* and nothing
 *   else.
 * - **One moving thing** — exactly one `marching-ants-connector` decoration is
 *   attached in the whole scene. A diagram with three animations has none.
 * - **Rails identify the actor** — agents carry an `accent` rail, tool calls a
 *   green one, so a reader never checks a legend to know whether a box thinks
 *   or executes.
 *
 * **Themed by role, not by palette.** Every chrome colour in the cards is a
 * `*Role` (`cardBg` · `muted` · `heading` · `foreground` · `divider` ·
 * `accent`), recompiled by `GraphLayer` against the live palette on every
 * `theme:change`. The four **run-state** colours stay literal, because the role
 * vocabulary has no `success` / `warning` / `danger` / `info` and a run state
 * is meaning rather than chrome — the same split the tasks-panel plates make,
 * with the same tokens (`0x1da54f` · `0x0b73da` · `0xe05252`).
 *
 * **Known gaps.** Three things here are hand-declared that should be engine
 * surfaces: the status → style mapping (an *edge status channel* on `EdgeStyle`,
 * so `status: 'live'` resolves to weight + hue + decoration in one field), the
 * missing status **roles** above, and swimlane framing for the ACT stage (a
 * rectangular group-frame layer). See the plate book's gap table.
 *
 * **Everything above the component is data** — `STRUCTURES` · `TYPES` · `DATA` ·
 * `NODE` · `EDGE` · `CONFIG` are literal JSON, so the whole definition survives
 * `JSON.stringify` and comes back identical.
 *
 * ⚠️ **Text `y` looks a line high on purpose** — `compileFreeform` emits a label
 * part at `el.y + fontSize`, so a 12.5px title whose top must land at 14 is
 * authored as `1.5`.
 */
const meta: Meta = { title: 'designs/AgenticWorkflow' };
export default meta;
type Story = StoryObj;

// ── The definition — literal JSON, top to bottom ─────────────────────────────
/**
 * Four structures, one per node type. The pill and the diamond are the same
 * card with a different `frame`: a rounded rect and a four-point polygon.
 */
const STRUCTURES: NodeStructureRegistry = {
  terminal: {
    name: 'terminal',
    kind: 'freeform',
    width: 104,
    height: 38,
    // A pill: a rect whose corner radius is half its height.
    cornerRadius: 19,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'title', type: 'text', x: 52, y: 2, bind: 'data.title', anchor: 'center', fontSize: 11, colorRole: 'heading' }
    ]
  },
  decision: {
    name: 'decision',
    kind: 'freeform',
    width: 112,
    height: 112,
    // The whole "decision box" primitive: a square turned 45°, declared as
    // explicit points rather than a rotation — a rotation would take the label
    // with it and run "needs tools?" diagonally across the diamond.
    frame: { kind: 'polygon', points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0, y: 0.5 }] },
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'title', type: 'text', x: 56, y: 39, bind: 'data.title', anchor: 'center', fontSize: 11, colorRole: 'heading' }
    ]
  },
  agent: {
    name: 'agent',
    kind: 'freeform',
    width: 168,
    height: 96,
    cornerRadius: 12,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      { id: 'rail', type: 'rect', x: 0, y: 0, width: 4, height: 96, cornerRadius: 2, fillRole: 'accent' },
      { id: 'title', type: 'text', x: 18, y: 1.5, bind: 'data.title', fontSize: 12.5, fontWeight: 600, colorRole: 'heading' },
      { id: 'meta', type: 'text', x: 18, y: 21.5, bind: 'data.meta', fontSize: 9.5, colorRole: 'muted' },
      { id: 'rule', type: 'line', x: 18, y: 42, x2: 154, y2: 42, colorRole: 'divider' },
      { id: 'k1', type: 'text', x: 18, y: 40, bind: 'data.k1', fontSize: 10, colorRole: 'foreground' },
      { id: 'v1', type: 'text', x: 154, y: 40, bind: 'data.v1', anchor: 'right', fontSize: 10, colorRole: 'heading' },
      { id: 'k2', type: 'text', x: 18, y: 59, bind: 'data.k2', fontSize: 10, colorRole: 'foreground' },
      { id: 'v2', type: 'text', x: 154, y: 59, bind: 'data.v2', anchor: 'right', fontSize: 10, colorRole: 'heading' }
    ]
  },
  tool: {
    name: 'tool',
    kind: 'freeform',
    width: 168,
    height: 64,
    cornerRadius: 10,
    bgRole: 'cardBg',
    strokeRole: 'muted',
    strokeWidth: 1.8,
    elements: [
      // The rail is the one literal colour on a card: "this box executes".
      { id: 'rail', type: 'rect', x: 0, y: 0, width: 4, height: 64, cornerRadius: 2, fill: 0x1da54f },
      { id: 'title', type: 'text', x: 18, y: 1.5, bind: 'data.title', fontSize: 12.5, fontWeight: 600, colorRole: 'heading' },
      { id: 'meta', type: 'text', x: 18, y: 21.5, bind: 'data.meta', fontSize: 9.5, colorRole: 'muted' }
    ]
  }
};

const TYPES: NodeTypeRegistry = {
  terminal: { structure: 'terminal', styling: '', bindings: {} },
  agent: { structure: 'agent', styling: '', bindings: {} },
  decision: { structure: 'decision', styling: '', bindings: {} },
  tool: { structure: 'tool', styling: '', bindings: {} }
};

/**
 * One run, mid-flight. Each edge declares its three channels together —
 * `strokeColor` + `strokeWidth` + `strokeDashArray` — because that is what
 * makes R2's redundancy legible in one place. The four run-state colours are
 * the literal half of the template's colour pair: `0x1da54f` done ·
 * `0x0b73da` live · `0xe05252` failed · idle left to the themed `muted`
 * default.
 */
const DATA: GraphData = {
  nodes: [
    { id: 'query', type: 'terminal', data: { title: 'user query' } },
    {
      id: 'planner',
      type: 'agent',
      data: { title: 'Planner', meta: 'claude-opus-5', k1: 'intent', v1: 'lookup', k2: 'budget', v2: '4 calls' }
    },
    { id: 'route', type: 'decision', data: { title: 'needs tools?' } },
    { id: 'search', type: 'tool', data: { title: 'web.search', meta: '14 results · 620ms' } },
    { id: 'grep', type: 'tool', data: { title: 'repo.grep', meta: 'timeout at 30s' } },
    {
      id: 'synth',
      type: 'agent',
      data: { title: 'Synthesise', meta: 'claude-opus-5 · cited', k1: 'sources', v1: '14', k2: 'tokens', v2: '8.1k' }
    },
    { id: 'answer', type: 'terminal', data: { title: 'answer' } }
  ],
  edges: [
    {
      id: 'e1',
      source: 'query',
      target: 'planner',
      type: 'FLOW',
      style: { strokeColor: 0x1da54f, strokeWidth: 2, arrowTargetColor: 0x1da54f }
    },
    {
      id: 'e2',
      source: 'planner',
      target: 'route',
      type: 'FLOW',
      style: { strokeColor: 0x1da54f, strokeWidth: 2, arrowTargetColor: 0x1da54f }
    },
    {
      id: 'e3',
      source: 'route',
      target: 'search',
      type: 'BRANCH',
      style: { strokeColor: 0x1da54f, strokeWidth: 2, arrowTargetColor: 0x1da54f, labelText: 'yes · tools' }
    },
    {
      id: 'e4',
      source: 'route',
      target: 'grep',
      type: 'BRANCH',
      style: {
        strokeColor: 0xe05252,
        strokeWidth: 2.6,
        strokeDashArray: [5, 4],
        arrowTargetColor: 0xe05252,
        labelText: 'yes · tools'
      }
    },
    // Never taken this run: no colour declared, so it stays the themed `muted`
    // default — the edge that is *not* the story.
    { id: 'e5', source: 'route', target: 'synth', type: 'BRANCH', style: { strokeWidth: 1.6, labelText: 'no · direct' } },
    // The one moving thing in the scene.
    {
      id: 'e6',
      source: 'search',
      target: 'synth',
      type: 'FLOW',
      style: {
        strokeColor: 0x0b73da,
        strokeWidth: 2.6,
        strokeDashArray: [7, 6],
        arrowTargetColor: 0x0b73da,
        decorations: [
          {
            kind: 'marching-ants-connector',
            id: 'live',
            color: 0x0b73da,
            strokeWidth: 2.6,
            dashLength: 7,
            gapLength: 6,
            speedPxPerSec: 42
          }
        ]
      }
    },
    {
      id: 'e7',
      source: 'grep',
      target: 'synth',
      type: 'FLOW',
      style: { strokeColor: 0xe05252, strokeWidth: 2.6, strokeDashArray: [5, 4], arrowTargetColor: 0xe05252 }
    },
    { id: 'e8', source: 'synth', target: 'answer', type: 'FLOW', style: { strokeWidth: 1.6 } }
  ]
};

// The layer template carries no colour: node labels, borders, edge strokes and
// arrowheads all come from `GraphLayer.applyTheme`, and the cards resolve their
// own roles.
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
    // Orthogonal routes have vertical legs. `labelKeepUpright` only un-flips
    // upside-down text — switching rotation off is what keeps a label
    // horizontal wherever on the route it lands.
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
      nodeSpacing: 48,
      layerSpacing: 96
    }
  }
};

export const AgenticWorkflow: Story = {
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
        {/* No `nodeSize`: each structure declares its own box. */}
        <ElkLayout id="elk" targetLayerId="graph" fitPadding={72} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag" />
        <HoverActivateBehaviour id="hover" degree={0} />
        <TextResolutionLODBehaviour id="label-lod" targetLayerId="graph" enabled />
      </GraphCanvas>
    </div>
  )
};
