/**
 * **Graph engineering — knowledge-graph schema (Fig. 1).** The "knowledge graph
 * schema for multi-agent systems" figure from *Graph Engineering: The Karpathy
 * Loop, Improved 1000× by Itself*, redrawn as a live graph: a central **AGENT**
 * hub fed by typed entities through directional edges, each entity described by
 * a small Title / Description card, with extra properties and keywords
 * extending the graph for richer traversal.
 *
 * **What moves, and which engine piece moves it — all of it is data:**
 *
 *   - **The scene arrives** card by card, left to right — the bundle's
 *     `EntranceBehaviour` (`config.behaviours.entrance`) writes a staggered
 *     `fade-in` per node and a `fade-in-connector` per edge, each edge behind the
 *     later of its endpoints. *Replay* in the header calls `replay()`.
 *   - **Information flows into the agent** — every edge carries a
 *     `flow-particles-connector` decoration (the blue beads of the figure) over a
 *     faint `glow-connector`, declared **once** on the layer's edge template.
 *   - **The hub breathes** — AGENT wears a `hub` state whose overlay adds a
 *     pulsing `glow` and a `pulse-ring`. This one `states: ['hub']` on a record
 *     is deliberate: a styling template has no `decorations` seat and a type
 *     binding's `states` only carries label text, so a state overlay is the
 *     only data path for a per-type decoration today.
 *
 * **Cards are structures, not per-node shapes.** Four `freeform` structures —
 * `title` (Title / Description), `entity` (heading + wrapped example list),
 * `pill` (one word) and `hub` — and `nodeTypes` bind each to the record's
 * `data`. Positions are authored (`activeLayout: ''`): the arrangement *is* the
 * figure.
 *
 * ⚠️ A freeform text's `y` is authored one `fontSize` *above* where its top
 * renders (`compileFreeform` adds the font size) — so a heading meant to start
 * 10 px into a 14 px card is written `y: -4`.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  EntranceBehaviour,
  GraphCanvas,
  GraphData,
  NodeStructureRegistry,
  NodeTypeRegistry,
} from '@invana/graph';
import { GraphCanvasApp, GraphControlsToolbar } from '@invana/canvas-ui';
import { Button } from '@invana/ui';
import { ThemeProvider } from '@invana/themes';

// `selfThemed`: the story pins its own paper-white theme, so the preview
// decorator and the Theme toolbar leave it alone.
const meta: Meta = {
  title: 'canvas-demos/by-casestudies/graph-engineering/KnowledgeGraphSchema',
  parameters: { selfThemed: true },
};
export default meta;
type Story = StoryObj;

export const KnowledgeGraphSchemaStory: Story = {
  name: 'KnowledgeGraphSchema',
  render: function Render() {
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

    // ── The skeletons ───────────────────────────────────────────────────────
    /**
     * Four fixed-size cards in the figure's ink-on-paper palette: navy rim,
     * near-white fill, dark heading, slate body text. `entity` wraps its
     * example list onto two lines (`maxWidth` + `maxLines`).
     */
    const structures: NodeStructureRegistry = useMemo(() => ({
      title: {
        name: 'title',
        kind: 'freeform',
        width: 150,
        height: 60,
        cornerRadius: 6,
        bg: 0xffffff,
        stroke: 0x1f3a6e,
        strokeWidth: 2,
        elements: [
          { id: 'title', type: 'text', x: 16, y: -4, bind: 'data.title', fontSize: 14, fontWeight: 600, color: 0x0f172a },
          { id: 'desc', type: 'text', x: 24, y: 20, bind: 'data.desc', fontSize: 13, color: 0x334155 },
        ],
      },
      entity: {
        name: 'entity',
        kind: 'freeform',
        width: 280,
        height: 64,
        cornerRadius: 6,
        bg: 0xf6f8ff,
        stroke: 0x1f3a6e,
        strokeWidth: 2,
        elements: [
          { id: 'title', type: 'text', x: 16, y: -2, bind: 'data.title', fontSize: 15, fontWeight: 600, color: 0x0f172a },
          { id: 'desc', type: 'text', x: 16, y: 22, bind: 'data.desc', fontSize: 12, color: 0x334155,
            maxWidth: 250, maxLines: 2, lineHeight: 16 },
        ],
      },
      pill: {
        name: 'pill',
        kind: 'freeform',
        width: 210,
        height: 42,
        cornerRadius: 6,
        bg: 0xf6f8ff,
        stroke: 0x1f3a6e,
        strokeWidth: 2,
        elements: [
          { id: 'title', type: 'text', x: 105, y: -2, bind: 'data.title', anchor: 'center', fontSize: 15, fontWeight: 600, color: 0x0f172a },
        ],
      },
      hub: {
        name: 'hub',
        kind: 'freeform',
        width: 150,
        height: 66,
        cornerRadius: 10,
        bg: 0xffffff,
        stroke: 0x1f3a6e,
        strokeWidth: 2.5,
        elements: [
          { id: 'title', type: 'text', x: 75, y: -3, bind: 'data.title', anchor: 'center', fontSize: 24, fontWeight: 600, color: 0x0f172a },
        ],
      },
    }), []);

    /** The type *is* the selector — each node's `type` picks its card. */
    const types: NodeTypeRegistry = useMemo(() => ({
      title: { structure: 'title', styling: '', bindings: {} },
      entity: { structure: 'entity', styling: '', bindings: {} },
      pill: { structure: 'pill', styling: '', bindings: {} },
      hub: { structure: 'hub', styling: '', bindings: {} },
    }), []);

    // ── The figure ──────────────────────────────────────────────────────────
    /** Centre coordinates, read off the source figure. */
    const data: GraphData = useMemo(() => ({
      nodes: [
        // Upper-left: a person entity, described by its Title card.
        { id: 'person-title', type: 'title', position: { x: 196, y: 320 },
          data: { title: 'Title', desc: ': Description' } },
        { id: 'first-person', type: 'entity', position: { x: 210, y: 446 },
          data: { title: 'First Person', desc: '(e.g., name, role, category (employee), math)' } },

        // Upper-middle: the object the agent collaborates with.
        { id: 'object-title', type: 'title', position: { x: 556, y: 320 },
          data: { title: 'Title', desc: 'Description' } },
        { id: 'object-above', type: 'entity', position: { x: 560, y: 440 },
          data: { title: 'Object Above', desc: '(e.g., machine, collaboration)' } },

        { id: 'tools', type: 'pill', position: { x: 400, y: 548 }, data: { title: 'Tools' } },

        // The hub.
        { id: 'agent', type: 'hub', position: { x: 780, y: 590 }, states: ['hub'],
          data: { title: 'AGENT' } },
        { id: 'agency', type: 'pill', position: { x: 900, y: 400 }, data: { title: 'Agency / Group' } },

        // Right: text and objects the agent reads.
        { id: 'text-title', type: 'title', position: { x: 1180, y: 400 },
          data: { title: 'Title', desc: 'Description' } },
        { id: 'text-bottom', type: 'entity', position: { x: 1160, y: 520 },
          data: { title: 'Text Bottom', desc: '(e.g., contract details, sum by any terms)' } },
        { id: 'below-title', type: 'title', position: { x: 1160, y: 640 },
          data: { title: 'Title', desc: ': Description' } },
        { id: 'object-below', type: 'entity', position: { x: 1140, y: 760 },
          data: { title: 'Object Below', desc: '(e.g., metric, tool list, sum by any terms)' } },

        // Lower-left: the extension entities and the keyword they resolve to.
        { id: 'extra-person', type: 'entity', position: { x: 200, y: 660 },
          data: { title: 'Extra Person Entity', desc: '(Employee, Person, other entities)' } },
        { id: 'extra-property', type: 'entity', position: { x: 200, y: 790 },
          data: { title: 'Extra Property / Affiliate', desc: '(Provider, Age, Length, Area)' } },
        { id: 'keyword', type: 'pill', position: { x: 520, y: 720 },
          data: { title: 'Extra Person Keyword' } },
      ],

      // Every edge points toward the agent — the figure's "directional edges".
      // The short Title → entity drops are straight; everything else bows.
      edges: [
        { id: 'pt-fp', source: 'person-title', target: 'first-person', type: 'describes',
          style: { shape: { pathType: 'straight' } } },
        { id: 'ot-oa', source: 'object-title', target: 'object-above', type: 'describes',
          style: { shape: { pathType: 'straight' } } },
        { id: 'tt-tb', source: 'text-title', target: 'text-bottom', type: 'describes',
          style: { shape: { pathType: 'straight' } } },
        { id: 'bt-ob', source: 'below-title', target: 'object-below', type: 'describes',
          style: { shape: { pathType: 'straight' } } },

        { id: 'fp-tools', source: 'first-person', target: 'tools', type: 'feeds' },
        { id: 'oa-tools', source: 'object-above', target: 'tools', type: 'feeds' },
        { id: 'tools-agent', source: 'tools', target: 'agent', type: 'feeds' },
        { id: 'agency-agent', source: 'agency', target: 'agent', type: 'feeds' },
        { id: 'tb-agent', source: 'text-bottom', target: 'agent', type: 'feeds' },
        { id: 'ob-agent', source: 'object-below', target: 'agent', type: 'feeds' },

        { id: 'ep-kw', source: 'extra-person', target: 'keyword', type: 'extends' },
        { id: 'xp-kw', source: 'extra-property', target: 'keyword', type: 'extends' },
        { id: 'kw-agent', source: 'keyword', target: 'agent', type: 'feeds' },
      ],
    }), []);

    // ── The canvas ──────────────────────────────────────────────────────────
    const config = useMemo(() => ({
      activeLayout: '',
      layers: {
        background: { type: 'pattern', patternType: 'dots', backgroundColor: '#ffffff',
                      color: '#e2e8f0', spacing: 28, size: 1 },
        graph: {
          nodeStructureTemplates: structures,
          nodeTypes: types,
          node: {
            state: {
              // The hub's own look: a slow brightness pulse and sonar rings.
              hub: {
                decorations: [
                  { id: 'hub-glow', kind: 'glow', color: 0x6b93ff, strokeWidth: 16, innerAlpha: 0.4,
                    pulse: { periodMs: 1800, amplitude: 0.6 } },
                  { id: 'hub-pulse', kind: 'pulse-ring', color: 0x3b6fd8, maxRadius: 26,
                    periodMs: 2200, rings: 2, strokeWidth: 1.5, innerAlpha: 0.5 },
                ],
              },
              highlighted: { bgStrokeColor: 0x3b6fd8, bgStrokeWidth: 3 },
            },
          },
          edge: {
            style: {
              strokeColor: 0x2c4a8a,
              strokeWidth: 1.6,
              arrowTargetShape: 'triangle',
              arrowTargetSize: 8,
              arrowTargetColor: 0x2c4a8a,
              shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: 18 },
                       sourceAnchor: 'boundary', targetAnchor: 'boundary' },
              // The blue beads riding every edge toward the agent.
              decorations: [
                { id: 'halo', kind: 'glow-connector', color: 0x8fb0ff, radius: 5, layers: 4, innerAlpha: 0.16 },
                { id: 'flow', kind: 'flow-particles-connector', color: 0x3b6fd8, count: 2, size: 7,
                  speedPxPerSec: 70 },
              ],
            },
            state: {
              highlighted: { strokeColor: 0x3b6fd8, strokeWidth: 2.4, arrowTargetColor: 0x3b6fd8 },
            },
          },
        },
      },
      behaviours: {
        color: { enabled: false },
        hover: { enabled: true, state: 'highlighted', degree: 1 },
        // Arrive left-to-right, one card at a time.
        entrance: { enabled: true, order: 'x', durationMs: 520, staggerMs: 140, maxStaggerMs: 2600,
                    includeEdges: true, easing: 'easeOutCubic' },
      },
    }), [structures, types]);

    const onReady = useCallback((next: GraphCanvas | null) => {
      setCanvas(next);
      if (!next) return;
      // The light palette republishes the edge template's stroke from its own
      // roles once the theme lands — reassert the figure's ink.
      next.update({
        layers: {
          background: { backgroundColor: '#ffffff' },
          graph: { edge: { style: { strokeColor: 0x2c4a8a } } },
        },
      });
    }, []);

    const replay = useCallback(() => {
      (canvas?.behaviours.get('entrance') as EntranceBehaviour | undefined)?.replay();
    }, [canvas]);

    return (
      <ThemeProvider defaultMode="light" storageKey={null}>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Fig. 1 — Knowledge graph schema for multi-agent systems',
            center: <GraphControlsToolbar />,
            right: <Button size="sm" variant="outline" onClick={replay}>Replay</Button>,
          }}
        />
      </ThemeProvider>
    );
  },
};
