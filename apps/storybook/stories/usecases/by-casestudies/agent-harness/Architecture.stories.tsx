/**
 * **Agent harness — architecture** — a hand-drawn "how the agent runs" diagram
 * rebuilt one-to-one as a live graph on `<GraphCanvasApp>`: the ephemeral
 * HARNESS region (dashed), the LOOP and LLM OPS frames (indigo), the MEMORY
 * pillars, the Retrieval-gate diamond, and the mix of solid / dashed / dotted
 * edges — including the long "reply, but the same gateway" return arc over the
 * top and the "save chats" drop down the right-hand side.
 *
 * How the drawing maps onto engine primitives:
 *
 *   - **Cards → `composite` nodes.** Every box is a `kind: 'composite'` card
 *     whose two `label` parts carry the two text tones of the source drawing
 *     (bold near-white title, dim smaller subtitle) — a plain rect + `\n`
 *     label can only do one tone. A composite's `position` is its **centre**.
 *   - **The diamond → a composite with a `polygon` root.** The Retrieval gate
 *     borrows a 4-vertex polygon silhouette for its body and keeps the same
 *     two-label interior, so it stays one node like everything else.
 *   - **Regions → group nodes.** LOOP / LLM OPS / MEMORY / HARNESS are
 *     `group: { autoFit: true }` frames over their `parentId` members
 *     (HARNESS nests the other frames). The dashed HARNESS border is just
 *     `bgStrokeDashArray` on that node.
 *   - **Exact curves → `pathType: 'smooth'` + authored `waypoints`.** The
 *     return arc and the two right-hand drops are orthogonal routes through
 *     fixed waypoints, smoothed — which is exactly the rounded-corner arc the
 *     drawing has. The "each turn" bow is a `quadratic` with `curveOffset`.
 *     Dotted = `[1, 4]` + round cap; dashed = `[5, 4]`.
 *
 * Two engine details this story leans on (both learned from the
 * invana-architecture story): frame/diamond colours ride on a **state
 * overlay** (`states: ['look']`) because publishing a theme palette rewrites
 * group-node `bgFill` / `bgStrokeColor`; and every edge is **raised** in
 * `onReady` (`store.actions.raise`) because connectors paint below shapes, so
 * un-raised edges and their labels would sink under the filled frames.
 *
 * Positions are authored (`activeLayout: ''`) — the arrangement *is* the
 * diagram, so every node carries its coordinate from the source drawing.
 */

import { useCallback, useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GraphCanvas, GraphData, GraphEdge, GraphNode, NodeShapeOptions } from '@invana/graph';
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
    // Every node carries the coordinate it has in the source drawing.
    // Cards (`composite`) are centre-positioned; their footprint + two text
    // lines ride on `data`, which the shape resolver reads. Frames are group
    // nodes — per-frame inset geometry rides on `data.group`, colours on the
    // `look` state overlay (see the layer template below).
    const data: GraphData = useMemo(() => ({
      nodes: [
        // ── Free-floating page title ────────────────────────────────────
        { id: 'title-note', type: 'note', position: { x: 30, y: 24 }, states: ['look'],
          style: { labelText: 'ARCHITECTURE — CLICK ANY BOX', labelPlacement: 'right',
                   labelFontSize: 12, labelFontWeight: 600, labelLetterSpacing: 2,
                   labelForceShow: true } },

        // ── HARNESS (dashed outer region) ───────────────────────────────
        // Frame titles live on tiny invisible "note" nodes at exact coords —
        // a group's own inside-* label is width-constrained and wraps/clips
        // on long titles (the note trick sidesteps that).
        { id: 'harness', type: 'frame', position: { x: 24, y: 82 }, states: ['look'],
          data: { group: { padding: 26, headerHeight: 4 } } },

        { id: 'gateway', type: 'box', parentId: 'harness', position: { x: 115, y: 159 }, states: ['look'],
          data: { w: 130, h: 54, title: 'Gateway', sub: 'cli · voice · web' } },
        { id: 'working-memory', type: 'box', parentId: 'harness', position: { x: 272, y: 159 }, states: ['look'],
          data: { w: 140, h: 54, title: 'Working memory', sub: 'assembled per turn' } },
        { id: 'reply', type: 'box', parentId: 'harness', position: { x: 595, y: 164 }, states: ['look'],
          data: { w: 100, h: 52, title: 'Reply', sub: '→ back to you' } },

        // ── LOOP frame (indigo, inside the harness) ─────────────────────
        { id: 'loop', type: 'frame', parentId: 'harness', position: { x: 362, y: 112 }, states: ['look'],
          data: { group: { padding: 16, headerHeight: 4 } } },
        { id: 'llm-agent', type: 'box', parentId: 'loop', position: { x: 446, y: 159 }, states: ['look'],
          data: { w: 135, h: 54, title: 'LLM agent', sub: 'reason' } },
        { id: 'tools', type: 'box', parentId: 'loop', position: { x: 446, y: 232 }, states: ['look'],
          data: { w: 135, h: 50, title: 'Tools', sub: 'create_event…' } },

        // ── Retrieval gate (diamond) ────────────────────────────────────
        { id: 'retrieval-gate', type: 'gate', parentId: 'harness', position: { x: 271, y: 333 }, states: ['look'],
          data: { title: 'Retrieval gate', sub: '68 skip · 62 retrieve' } },

        // ── MEMORY frame + pillars ──────────────────────────────────────
        { id: 'memory', type: 'frame', parentId: 'harness', position: { x: 48, y: 424 }, states: ['look'],
          data: { group: { padding: 22, headerHeight: 32, togglePlacement: 'bottom-right' } },
          style: { labelText: 'MEMORY — three pillars', labelPlacement: 'inside-top-left',
                   labelFontSize: 10, labelLetterSpacing: 1 } },
        { id: 'procedural', type: 'box', parentId: 'memory', position: { x: 155, y: 506 }, states: ['look'],
          data: { w: 171, h: 56, title: 'Procedural', sub: 'how to act · SKILL.md · 4 skill(s)' } },
        { id: 'semantic', type: 'box', parentId: 'memory', position: { x: 357, y: 506 }, states: ['look'],
          data: { w: 174, h: 56, title: 'Semantic · FTS5', sub: 'durable facts · 53 facts' } },
        { id: 'episodic', type: 'box', parentId: 'memory', position: { x: 522, y: 506 }, states: ['look'],
          data: { w: 126, h: 56, title: 'Episodic', sub: '20 episodes' } },

        { id: 'consolidation', type: 'box', parentId: 'harness', position: { x: 247, y: 621 }, states: ['look'],
          data: { w: 356, h: 54, title: 'Consolidation · every 6 exchanges',
                  sub: '2/12 queued → distilled into facts' } },

        // ── LLM OPS frame (offline improvement loop, outside the harness) ─
        { id: 'llm-ops', type: 'frame', position: { x: 700, y: 102 }, states: ['look'],
          data: { group: { padding: 17, headerHeight: 25 } } },
        { id: 'trace', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 168 }, states: ['look'],
          data: { w: 228, h: 48, title: 'Trace', sub: '12 file(s) · always on' } },
        { id: 'eval', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 241 }, states: ['look'],
          data: { w: 228, h: 44, title: 'Eval', sub: 'deterministic + judge' } },
        { id: 'release-gate', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 309 }, states: ['look'],
          data: { w: 228, h: 48, title: 'Release gate', sub: 'det pass · judge pass' } },
        { id: 'release', type: 'box', parentId: 'llm-ops', position: { x: 831, y: 378 }, states: ['look'],
          data: { w: 228, h: 48, title: 'Release', sub: 'new prompt · model · config' } },

        // ── Frame titles + free-floating captions (drawn above the frames) ─
        { id: 'harness-note', type: 'note', position: { x: 52, y: 105 }, states: ['look'],
          style: { labelText: 'HARNESS — runs on your laptop · the turn inside is ephemeral',
                   labelPlacement: 'right', labelFontSize: 10, labelLetterSpacing: 1 } },
        { id: 'loop-note', type: 'note', position: { x: 446, y: 122 }, states: ['look'],
          style: { labelText: 'LOOP', labelPlacement: 'center', labelAlign: 'center',
                   labelFontSize: 9, labelFontWeight: 600, labelLetterSpacing: 3 } },
        { id: 'llmops-title-note', type: 'note', position: { x: 717, y: 113 }, states: ['look'],
          style: { labelText: 'LLM OPS — offline improvement loop', labelPlacement: 'right',
                   labelFontSize: 10, labelFontWeight: 600 } },
        { id: 'llmops-sub-note', type: 'note', position: { x: 717, y: 130 }, states: ['look'],
          style: { labelText: 'observes each run · improves the agent', labelPlacement: 'right',
                   labelFontSize: 9 } },
        // Invisible endpoint for the "improved prompt + config" arrow — in the
        // drawing it points back toward the loop and ends mid-air.
        { id: 'loop-return-point', type: 'note', position: { x: 472, y: 378 }, states: ['look'],
          style: {} },
      ] as GraphNode[],

      // Solid = the turn's main flow; dashed `[5, 4]` = conditional / offline
      // links; dotted `[1, 4]` = the memory reads. The two long right-angle
      // arcs are `smooth` routes through authored waypoints — the exact
      // rounded-corner curves of the drawing.
      edges: [
        { id: 'gw-wm', source: 'gateway', target: 'working-memory', style: {} },
        { id: 'wm-agent', source: 'working-memory', target: 'llm-agent', style: {} },
        { id: 'agent-reply', source: 'llm-agent', target: 'reply', style: {} },

        // The return arc over the top of the whole harness.
        { id: 'reply-gw', source: 'reply', target: 'gateway',
          style: { labelText: 'reply, but the same gateway', labelOffsetY: -9, strokeColor: 0x4a4b57,
                   shape: { pathType: 'rounded', pathStyleOpts: { radius: 16 },
                            waypoints: [{ x: 595, y: 96 }, { x: 115, y: 96 }] } } },

        // reason ⇄ act, two short verticals inside the loop.
        { id: 'act-out', source: 'llm-agent', target: 'tools',
          style: { arrowTargetSize: 5,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'bottom', offset: 0.3 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'top', offset: 0.3 } } } },
        { id: 'act-back', source: 'tools', target: 'llm-agent',
          style: { arrowTargetSize: 5,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'top', offset: 0.7 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'bottom', offset: 0.7 } } } },

        { id: 'wm-gate', source: 'working-memory', target: 'retrieval-gate',
          style: { labelText: 'only if needed', strokeDashArray: [5, 4], strokeColor: 0x4a4b57 } },

        // The gate reads all three pillars — dotted fan.
        { id: 'proc-gate', source: 'procedural', target: 'retrieval-gate',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57 } },
        { id: 'sem-gate', source: 'semantic', target: 'retrieval-gate',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57,
                   labelText: 'the gate reads all three', labelPlacement: 0.55 } },
        { id: 'epi-gate', source: 'episodic', target: 'retrieval-gate',
          style: { strokeDashArray: [1, 4], strokeCap: 'round', strokeColor: 0x4a4b57 } },

        { id: 'cons-sem', source: 'consolidation', target: 'semantic',
          style: { labelText: 'distill', strokeDashArray: [1, 4], strokeCap: 'round',
                   strokeColor: 0x4a4b57,
                   shape: { pathType: 'straight',
                            sourceAnchor: 'edge-port', sourceAnchorOpts: { side: 'top', offset: 0.81 },
                            targetAnchor: 'edge-port', targetAnchorOpts: { side: 'bottom', offset: 0.5 } } } },

        // Into the offline loop: every turn traces; chats drop to consolidation.
        { id: 'reply-trace', source: 'reply', target: 'trace',
          style: { labelText: 'each turn', labelOffsetY: -9,
                   shape: { pathType: 'quadratic', pathStyleOpts: { curveOffset: 26 } } } },
        { id: 'reply-cons', source: 'reply', target: 'consolidation',
          style: { labelText: 'save chats', labelPlacement: 0.25, strokeDashArray: [5, 4],
                   strokeColor: 0x4a4b57,
                   shape: { pathType: 'rounded', pathStyleOpts: { radius: 16 },
                            waypoints: [{ x: 652, y: 340 }, { x: 652, y: 621 }] } } },

        // The LLM OPS pipeline.
        { id: 'trace-eval', source: 'trace', target: 'eval', style: {} },
        { id: 'eval-rgate', source: 'eval', target: 'release-gate', style: {} },
        { id: 'rgate-release', source: 'release-gate', target: 'release', style: {} },

        // …and its product flowing back toward the loop (mid-air arrowhead,
        // as drawn).
        { id: 'release-loop', source: 'release', target: 'loop-return-point',
          style: { labelText: 'improved prompt + config', labelPlacement: 0.45,
                   strokeDashArray: [5, 4], strokeColor: 0x4a4b57 } },
      ] as GraphEdge[],
    }), []);

    const config = useMemo(() => ({
      // Positions are authored — no layout runs; `fitOnLoad` frames the page.
      activeLayout: '',
      layers: {
        background: { type: 'pattern', patternType: 'dots', backgroundColor: '#0a0a0e',
                      color: '#13141c', spacing: 28, size: 1, alpha: 0 },
        graph: {
          node: {
            // Geometry by type; all colour lives on the `look` overlay below,
            // so the theme publish (which rewrites group-node fills and the
            // template's stroke/label colours) can't repaint the drawing.
            style: {
              shape: (n: GraphNode): NodeShapeOptions => {
                // Frames get a tiny floor — auto-fit provides the real size,
                // and a large floor anchored at the frame's own position
                // inflates it past its members.
                if (n.type === 'frame') return { kind: 'rect', width: 40, height: 24, cornerRadius: 10 };
                if (n.type === 'note') return { kind: 'rect', width: 2, height: 2 };
                if (n.type === 'gate') {
                  const d = n.data as { title: string; sub: string };
                  return {
                    kind: 'composite', width: 150, height: 96,
                    root: { kind: 'polygon', x: 0, y: 0, fill: 0x1d1a33,
                            stroke: { color: 0x655cd6, width: 1.2 },
                            vertices: [{ x: 0, y: -48 }, { x: 75, y: 0 }, { x: 0, y: 48 }, { x: -75, y: 0 }] },
                    parts: [
                      { part: 'label', x: 75, y: 30, text: d.title, anchor: 'center', align: 'center',
                        fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                      { part: 'label', x: 75, y: 49, text: d.sub, anchor: 'center', align: 'center',
                        fontSize: 9, fill: 0x8d90e0 },
                    ],
                  };
                }
                const d = n.data as { w: number; h: number; title: string; sub: string };
                return {
                  kind: 'composite', width: d.w, height: d.h, cornerRadius: 7,
                  parts: [
                    { part: 'label', x: 14, y: 9, text: d.title, fontSize: 11, fontWeight: 600, fill: 0xe9e9f0 },
                    { part: 'label', x: 14, y: 27, text: d.sub, fontSize: 9, fill: 0x7b7f93 },
                  ],
                };
              },
              group: (n: GraphNode) =>
                n.type === 'frame'
                  ? { autoFit: true, behindChildren: true,
                      ...(n.data as { group: object }).group }
                  : undefined,
              labelFontSize: 10,
            },
            // The drawing's own palette, per node kind/id — resolved *above*
            // `style`, so it survives the palette publish.
            state: {
              look: {
                // The harness and the floating title are "transparent" by
                // painting the page colour — a `bgAlpha: 0` is dropped as
                // falsy and the palette's card fill takes over instead.
                bgFill: (n: GraphNode) =>
                  n.type === 'box' ? 0x16161d
                  : n.id === 'retrieval-gate' ? 0x1d1a33
                  : n.id === 'loop' ? 0x0e0e17
                  : n.id === 'llm-ops' ? 0x0f0f18
                  : n.id === 'memory' ? 0x0e0e15
                  : 0x0a0a0e,
                bgStrokeColor: (n: GraphNode) =>
                  n.type === 'note' ? 0x0a0a0e
                  : n.type === 'box' ? 0x272834
                  : n.id === 'retrieval-gate' || n.id === 'loop' || n.id === 'llm-ops' ? 0x5a54c4
                  : n.id === 'memory' ? 0x2b2b36
                  : 0x363744,
                // A width of 0 would be dropped as falsy — notes stay
                // invisible by painting the page colour instead.
                bgStrokeWidth: (n: GraphNode) =>
                  n.type === 'frame' || n.type === 'gate' ? 1.2 : 1,
                bgStrokeDashArray: (n: GraphNode) =>
                  n.id === 'harness' ? ([5, 5] as [number, number]) : undefined,
                labelColor: (n: GraphNode) =>
                  n.id === 'title-note' ? 0xd9d9e2
                  : n.id === 'loop-note' || n.id === 'llmops-title-note' ? 0x8b90ea
                  : n.id === 'harness-note' || n.id === 'llmops-sub-note' ? 0x62646f
                  : n.id === 'memory' ? 0x6e7183
                  : 0x62646f,
              },
            },
          },
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
    }), []);

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
      // drawing's exact values after it.
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
