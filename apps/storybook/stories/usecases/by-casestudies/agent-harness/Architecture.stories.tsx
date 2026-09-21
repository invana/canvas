/**
 * **Agent harness — architecture** — a hand-drawn "how the agent runs" diagram
 * rebuilt one-to-one as a live graph on `<GraphCanvasApp>`: the ephemeral
 * HARNESS region (dashed), the LOOP and LLM OPS frames (indigo), the MEMORY
 * pillars, the Retrieval-gate diamond, and the mix of solid / dashed / dotted
 * edges — including the long "reply, but the same gateway" return arc over the
 * top and the "save chats" drop down the right-hand side.
 *
 * **The definition is data, top to bottom.** Four literals and no resolver
 * functions: `structures` (the skeletons), `stylings`, `types` (which type
 * wears which skeleton) and `data` (what each node *is*). Nothing about this
 * drawing lives in a closure, so it could be stored, diffed or round-tripped
 * through the state export — see
 * `docs/rfcs/feat/2026-09-21-a-diagram-definition-lives-in-resolver-functions.md`.
 *
 * **Templated vs authored, and why the line falls there.** A structure fixes
 * its card's box, so it fits a mark that is the same size everywhere (the
 * gate, the frame floor, the note dot) and not one that is a different size on
 * every node (the boxes). Those carry a literal shape instead — still data,
 * just per node rather than per type.
 *
 * How the drawing maps onto engine primitives:
 *
 *   - **Cards → a literal `composite` on each node.** Every box carries its own
 *     `style.shape`: a card whose two `label` parts are the two text tones of
 *     the source drawing (bold near-white title, dim smaller subtitle). The
 *     thirteen boxes have ten different sizes, and a structure's box is fixed
 *     at the template — so the card that varies per node is authored per node,
 *     and only the fixed-size marks are templated (below). A composite's
 *     `position` is its **centre**.
 *   - **The diamond → a `freeform` structure with a `polygon` frame.** One
 *     node, one size: exactly what a structure is for. It borrows a 4-vertex
 *     silhouette for its body and binds its two texts from `data`, so the gate
 *     stays one node like everything else.
 *   - **Regions → group nodes.** LOOP / LLM OPS / MEMORY / HARNESS carry
 *     `style.group: { autoFit: true }` over their `parentId` members (HARNESS
 *     nests the other frames). The dashed HARNESS border is just
 *     `bgStrokeDashArray` on that node.
 *   - **Exact curves → authored `waypoints`.** The return arc and the two
 *     right-hand drops are `rounded` routes through fixed waypoints — the
 *     rounded-corner arc the drawing has. The "each turn" bow is a `quadratic`
 *     with `curveOffset`. Dotted = `[1, 4]` + round cap; dashed = `[5, 4]`.
 *
 * **Why only the frames carry a `look` state.** Publishing a theme palette
 * rewrites the *layer template* for ordinary nodes — which every structure and
 * every per-node `style` already outranks — but it writes group-node `bgFill` /
 * `bgStrokeColor` onto the node's own `style`. A per-node `state` overlay is
 * the one seat above that, so the four frames keep their colours there and
 * nothing else needs one. Edges are **raised** in `onReady`
 * (`store.actions.raise`) because connectors paint below shapes, so un-raised
 * edges and their labels would sink under the filled frames.
 *
 * Positions are authored (`activeLayout: ''`) — the arrangement *is* the
 * diagram, so every node carries its coordinate from the source drawing.
 */

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  GraphCanvas,
  GraphData,
  NodeStructureRegistry,
  NodeStylingRegistry,
  NodeTypeRegistry,
} from '@invana/graph';
import { TextResolutionLODBehaviour } from '@invana/canvas-react';
import { GraphCanvasApp, GraphControlsToolbar } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';

// `selfThemed`: this story pins its own `<ThemeProvider storageKey={null}>`, so the
// preview decorator skips it entirely and the Theme/Variant toolbar leaves it alone.
const meta: Meta = { title: 'usecases/by-casestudies/agent-harness/Architecture', parameters: { selfThemed: true } };
export default meta;
type Story = StoryObj;

export const ArchitectureStory: Story = {
  name: 'Architecture',
  render: function Render() {
    // ── The skeletons ───────────────────────────────────────────────────────────
    /**
     * Three structures, one per fixed-size mark. `gate` is a `freeform` card
     * (absolute element coordinates, 1:1 with the designer canvas); `frame` and
     * `note` are `simple` — a shape and nothing else. The boxes are not here:
     * their size differs per node, which a structure cannot express.
     *
     * ⚠️ **A structure's text `y` sits a line high on purpose** —
     * `compileFreeform` emits its label part at `el.y + fontSize`, so the gate's
     * title bakes at `y: 30` from an authored `y: 19`. The boxes' own `parts`
     * are *not* compiled, so their `y` is the final value (`9` / `27`).
     */
    const structures: NodeStructureRegistry = useMemo(() => ({
      gate: {
        name: 'gate',
        kind: 'freeform',
        width: 150,
        height: 96,
        // The diamond, as normalised box points — the same silhouette the drawing
        // has, and the fill / border / every decoration follow it.
        frame: { kind: 'polygon', points: [{ x: 0.5, y: 0 }, { x: 1, y: 0.5 }, { x: 0.5, y: 1 }, { x: 0, y: 0.5 }] },
        bg: 0x1d1a33,
        stroke: 0x655cd6,
        strokeWidth: 1.2,
        elements: [
          { id: 'title', type: 'text', x: 75, y: 19, bind: 'data.title', anchor: 'center', fontSize: 11, fontWeight: 600, color: 0xe9e9f0 },
          { id: 'sub', type: 'text', x: 75, y: 40, bind: 'data.sub', anchor: 'center', fontSize: 9, color: 0x8d90e0 },
        ],
      },
      // A frame gets a tiny floor — auto-fit provides the real size, and a large
      // floor anchored at the frame's own position inflates it past its members.
      frame: { name: 'frame', kind: 'simple', shape: { kind: 'rect', width: 40, height: 24, cornerRadius: 10 } },
      // Frame titles and free-floating captions live on 2×2 "note" nodes at exact
      // coordinates — a group's own inside-* label is width-constrained and
      // wraps/clips on long titles, which the note trick sidesteps.
      note: { name: 'note', kind: 'simple', shape: { kind: 'rect', width: 2, height: 2 } },
    }), []);

    /**
     * One styling entry, for the notes: a note is a *label holder*, so its 2×2
     * body paints the page colour rather than going invisible via `bgAlpha: 0`
     * (a falsy alpha is dropped and the palette's card fill takes over instead).
     */
    const stylings: NodeStylingRegistry = useMemo(() => ({
      note: { name: 'note', fill: 0x0a0a0e, stroke: 0x0a0a0e, strokeWidth: 1 },
    }), []);

    const types: NodeTypeRegistry = useMemo(() => ({
      gate: { structure: 'gate', styling: '', bindings: {} },
      frame: { structure: 'frame', styling: '', bindings: {} },
      note: { structure: 'note', styling: 'note', bindings: {} },
    }), []);

    // ── The drawing ─────────────────────────────────────────────────────────────
    /**
     * Every node carries the coordinate it has in the source drawing. Cards are
     * centre-positioned and carry their whole composite on `style.shape`.
     *
     * ⚠️ **A card's fill and rim live on the node, not inside the shape.**
     * `GraphCanvasApp` deep-merges this config over its `BASE_CONFIG`, which
     * pins a neutral `bgFill` on the layer template — and `nodeSpec` only falls
     * back to a composite's own `fill` when `bgFill` is undefined, so a colour
     * authored inside the shape is silently replaced by the app default. (This
     * is why `compileFreeform` re-asserts `bgFill` at node level for the cards
     * it compiles.) The rim is here for a second reason: only a node-level
     * stroke can ask for `'outside'` alignment — a composite root stroke has no
     * alignment field and paints centred. Frames
     * carry their inset geometry on `style.group` and their colours on the `look`
     * overlay (the one seat a theme publish can't reach — see the header).
     */
    const data: GraphData = useMemo(() => ({
      nodes: [
        // ── Free-floating page title ────────────────────────────────────
        { id: 'title-note', type: 'note', position: { x: 30, y: 24 },
          style: { labelText: 'ARCHITECTURE — CLICK ANY BOX', labelPlacement: 'right',
                   labelFontSize: 12, labelFontWeight: 600, labelLetterSpacing: 2,
                   labelForceShow: true, labelColor: 0xd9d9e2 } },

        // ── HARNESS (dashed outer region) ───────────────────────────────
        { id: 'harness', type: 'frame', position: { x: 24, y: 82 }, states: ['look'],
          style: { group: { autoFit: true, behindChildren: true, padding: 26, headerHeight: 4 } },
          state: { look: { bgFill: 0x0a0a0e, bgStrokeColor: 0x363744, bgStrokeWidth: 1.2,
                           bgStrokeDashArray: [5, 5] } } },

        { id: 'gateway', type: 'box', parentId: 'harness', position: { x: 115, y: 159 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 130, height: 54, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Gateway',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'cli · voice · web',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'working-memory', type: 'box', parentId: 'harness', position: { x: 272, y: 159 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 140, height: 54, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Working memory',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'assembled per turn',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'reply', type: 'box', parentId: 'harness', position: { x: 595, y: 164 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 100, height: 52, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Reply',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: '→ back to you',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },

        // ── LOOP frame (indigo, inside the harness) ─────────────────────
        { id: 'loop', type: 'frame', parentId: 'harness', position: { x: 362, y: 112 }, states: ['look'],
          style: { group: { autoFit: true, behindChildren: true, padding: 16, headerHeight: 4 } },
          state: { look: { bgFill: 0x0e0e17, bgStrokeColor: 0x5a54c4, bgStrokeWidth: 1.2 } } },
        { id: 'llm-agent', type: 'box', parentId: 'loop', position: { x: 446, y: 159 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 135, height: 54, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'LLM agent',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'reason',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'tools', type: 'box', parentId: 'loop', position: { x: 446, y: 232 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 135, height: 50, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Tools',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'create_event…',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },

        // ── Retrieval gate (diamond) ────────────────────────────────────
        { id: 'retrieval-gate', type: 'gate', parentId: 'harness', position: { x: 271, y: 333 },
          data: { title: 'Retrieval gate', sub: '68 skip · 62 retrieve' } },

        // ── MEMORY frame + pillars ──────────────────────────────────────
        { id: 'memory', type: 'frame', parentId: 'harness', position: { x: 48, y: 424 }, states: ['look'],
          style: { group: { autoFit: true, behindChildren: true, padding: 22, headerHeight: 32,
                            togglePlacement: 'bottom-right' },
                   labelText: 'MEMORY — three pillars', labelPlacement: 'inside-top-left',
                   labelFontSize: 10, labelLetterSpacing: 1, labelColor: 0x6e7183 },
          state: { look: { bgFill: 0x0e0e15, bgStrokeColor: 0x2b2b36, bgStrokeWidth: 1.2 } } },
        { id: 'procedural', type: 'box', parentId: 'memory', position: { x: 155, y: 506 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 171, height: 56, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Procedural',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'how to act · SKILL.md · 4 skill(s)',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'semantic', type: 'box', parentId: 'memory', position: { x: 357, y: 506 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 174, height: 56, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Semantic · FTS5',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'durable facts · 53 facts',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'episodic', type: 'box', parentId: 'memory', position: { x: 522, y: 506 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 126, height: 56, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Episodic',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: '20 episodes',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },

        { id: 'consolidation', type: 'box', parentId: 'harness', position: { x: 247, y: 621 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 356, height: 54, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Consolidation · every 6 exchanges',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: '2/12 queued → distilled into facts',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },

        // ── LLM OPS frame (offline improvement loop, outside the harness) ─
        { id: 'llm-ops', type: 'frame', position: { x: 700, y: 102 }, states: ['look'],
          style: { group: { autoFit: true, behindChildren: true, padding: 17, headerHeight: 25 } },
          state: { look: { bgFill: 0x0f0f18, bgStrokeColor: 0x5a54c4, bgStrokeWidth: 1.2 } } },
        { id: 'trace', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 168 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 228, height: 48, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Trace',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: '12 file(s) · always on',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'eval', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 241 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 228, height: 44, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Eval',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'deterministic + judge',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'release-gate', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 309 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 228, height: 48, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Release gate',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'det pass · judge pass',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },
        { id: 'release', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 378 },
          style: { bgFill: 0x1d1a33, bgStrokeColor: 0x272834, bgStrokeWidth: 1,
                   bgStrokeAlignment: 'outside',
                   shape: { kind: 'composite', width: 228, height: 48, cornerRadius: 7,
                            parts: [
                              { part: 'label', x: 14, y: 9, text: 'Release',
                                fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                              { part: 'label', x: 14, y: 27, text: 'new prompt · model · config',
                                fontSize: 9, fill: 0x7b7f93 },
                            ] } } },

        // ── Frame titles + free-floating captions (drawn above the frames) ─
        { id: 'harness-note', type: 'note', position: { x: 52, y: 105 },
          style: { labelText: 'HARNESS — runs on your laptop · the turn inside is ephemeral',
                   labelPlacement: 'right', labelFontSize: 10, labelLetterSpacing: 1,
                   labelColor: 0x62646f } },
        { id: 'loop-note', type: 'note', position: { x: 446, y: 122 },
          style: { labelText: 'LOOP', labelPlacement: 'center', labelAlign: 'center',
                   labelFontSize: 9, labelFontWeight: 600, labelLetterSpacing: 3,
                   labelColor: 0x8b90ea } },
        { id: 'llmops-title-note', type: 'note', position: { x: 717, y: 113 },
          style: { labelText: 'LLM OPS — offline improvement loop', labelPlacement: 'right',
                   labelFontSize: 10, labelFontWeight: 600, labelColor: 0x8b90ea } },
        { id: 'llmops-sub-note', type: 'note', position: { x: 717, y: 130 },
          style: { labelText: 'observes each run · improves the agent', labelPlacement: 'right',
                   labelFontSize: 9, labelColor: 0x62646f } },
        // Invisible endpoint for the "improved prompt + config" arrow — in the
        // drawing it points back toward the loop and ends mid-air.
        { id: 'loop-return-point', type: 'note', position: { x: 472, y: 378 }, style: {} },
      ],

      // Solid = the turn's main flow; dashed `[5, 4]` = conditional / offline
      // links; dotted `[1, 4]` = the memory reads. The two long right-angle
      // arcs are `rounded` routes through authored waypoints — the exact
      // rounded-corner curves of the drawing.
      edges: [
        { id: 'gw-wm', source: 'gateway', target: 'working-memory', type: 'flow', style: {} },
        { id: 'wm-agent', source: 'working-memory', target: 'llm-agent', type: 'flow', style: {} },
        { id: 'agent-reply', source: 'llm-agent', target: 'reply', type: 'flow', style: {} },

        // The return arc over the top of the whole harness.
        { id: 'reply-gw', source: 'reply', target: 'gateway', type: 'flow',
          style: { labelText: 'reply, but the same gateway', labelOffsetY: -9, strokeColor: 0x4a4b57,
                   shape: { pathType: 'rounded', pathStyleOpts: { radius: 16 },
                            waypoints: [{ x: 595, y: 96 }, { x: 115, y: 96 }] } } },

        // reason ⇄ act, two short verticals inside the loop.
        { id: 'act-out', source: 'llm-agent', target: 'tools', type: 'flow',
          style: { arrowTargetSize: 5,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'bottom', offset: 0.3 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'top', offset: 0.3 } } } },
        { id: 'act-back', source: 'tools', target: 'llm-agent', type: 'flow',
          style: { arrowTargetSize: 5,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'top', offset: 0.7 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'bottom', offset: 0.7 } } } },

        { id: 'wm-gate', source: 'working-memory', target: 'retrieval-gate', type: 'flow',
          style: { labelText: 'only if needed', strokeDashArray: [5, 4], strokeColor: 0x4a4b57 } },

        // The gate reads all three pillars — dotted fan.
        { id: 'proc-gate', source: 'procedural', target: 'retrieval-gate', type: 'read',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57 } },
        { id: 'sem-gate', source: 'semantic', target: 'retrieval-gate', type: 'read',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57,
                   labelText: 'the gate reads all three', labelPlacement: 0.55 } },
        { id: 'epi-gate', source: 'episodic', target: 'retrieval-gate', type: 'read',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57 } },

        { id: 'cons-sem', source: 'consolidation', target: 'semantic', type: 'write',
          style: { labelText: 'distill', strokeDashArray: [1, 4], strokeCap: 'round',
                   strokeColor: 0x4a4b57,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'top', offset: 0.81 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'bottom', offset: 0.5 } } } },

        // Into the offline loop: every turn traces; chats drop to consolidation.
        { id: 'reply-trace', source: 'reply', target: 'trace', type: 'flow',
          style: { labelText: 'each turn', labelOffsetY: -9,
                   shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: 26 } } } },
        { id: 'reply-cons', source: 'reply', target: 'consolidation', type: 'write',
          style: { labelText: 'save chats', labelPlacement: 0.25, strokeDashArray: [5, 4],
                   strokeColor: 0x4a4b57,
                   shape: { pathType: 'rounded', pathStyleOpts: { radius: 16 },
                            waypoints: [{ x: 652, y: 340 }, { x: 652, y: 621 }] } } },

        // The LLM OPS pipeline.
        { id: 'trace-eval', source: 'trace', target: 'eval', type: 'flow', style: {} },
        { id: 'eval-rgate', source: 'eval', target: 'release-gate', type: 'flow', style: {} },
        { id: 'rgate-release', source: 'release-gate', target: 'release', type: 'flow', style: {} },

        // …and its product flowing back toward the loop (mid-air arrowhead,
        // as drawn).
        { id: 'release-loop', source: 'release', target: 'loop-return-point', type: 'flow',
          style: { labelText: 'improved prompt + config', labelPlacement: 0.45,
                   strokeDashArray: [5, 4], strokeColor: 0x4a4b57 } },
      ],
    }), []);

    // ── The canvas ──────────────────────────────────────────────────────────────
    /**
     * Positions are authored — no layout runs; `fitOnLoad` frames the page. The
     * graph layer carries only what every node shares: the registries above, the
     * label size, and the edge template.
     */
    const config = useMemo(() => ({
      activeLayout: '',
      layers: {
        background: { type: 'pattern', patternType: 'dots', backgroundColor: '#0a0a0e',
                      color: '#13141c', spacing: 28, size: 1, alpha: 0 },
        graph: {
          nodeStructureTemplates: structures,
          nodeStylingTemplates: stylings,
          nodeTypes: types,
          node: { style: { labelFontSize: 10 } },
          edge: {
            style: {
              strokeColor: 0x5a5c6a,
              strokeWidth: 1.2,
              arrowTargetShape: 'triangle',
              arrowTargetSize: 6,
              shape: { pathType: 'straight', sourceAnchor: 'boundary', targetAnchor: 'boundary' },
              labelColor: 0x7e8296,
              labelFontSize: 10,
              labelAutoRotate: false,
              labelBackgroundFill: 0x0a0a0e,
              labelBackgroundPadding: 2,
            },
          },
        },
      },
      behaviours: {
        // The drawing owns its palette; hovering a box lifts its neighbourhood.
        color: { enabled: false },
        hover: { enabled: true, state: 'highlighted', degree: 1 },
      },
    }), [structures, stylings, types]);

    const onReady = useCallback((canvas: GraphCanvas | null) => {
      if (!canvas) return;
      const graph = canvas.layers.get('graph');
      if (!graph) return;

      // Connectors paint below every shape, so inside a *filled* frame an
      // edge (and its label) would vanish under the frame. Raise them all —
      // boundary anchors already trim each edge at its box outline, so
      // floating above the nodes changes nothing else visually.
      const allEdges = new Set<string>();
      for (const edge of (graph as import('@invana/graph').GraphLayer).store.edges()) allEdges.add(edge.id);
      canvas.store.actions.raise.set('diagram-edges', allEdges);

      // The dark palette republishes the edge template's stroke/label colours
      // from its own roles the moment the theme lands — reassert the
      // drawing's exact values after it. (Node colours need no equivalent:
      // they ride the structures and the per-node styles, both of which
      // outrank the template the publish rewrites.)
      canvas.update({
        layers: {
          background: { backgroundColor: '#0a0a0e' },
          graph: {
            edge: { style: { strokeColor: 0x5a5c6a, labelColor: 0x7e8296, labelBackgroundFill: 0x0a0a0e } },
          },
        },
      });
    }, []);

    return (
      <ThemeProvider defaultMode="dark" storageKey={null}>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{ title: 'Agent harness — architecture', center: <GraphControlsToolbar /> }}
        >
          {/* Re-rasterise label glyphs on zoom-in so the diagram's small
              captions stay crisp when inspected up close. Tiered (not
              per-step) so a zoom pass pays at most one re-raster. */}
          <TextResolutionLODBehaviour id="text-resolution-lod" targetLayerId="graph" enabled />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
